import os
import json
import re
import pandas as pd
from google import genai
from google.genai import types
from dotenv import load_dotenv
from skill_gap_engine import SkillGapEngine

# AI Provider Clients
try:
    from openai import OpenAI
    NVIDIA_AVAILABLE = True
except ImportError:
    NVIDIA_AVAILABLE = False

load_dotenv()

# Rate-limit/Error signals to trigger fallback
_RETRY_SIGNALS = ("429", "quota", "rate limit", "resource_exhausted", "rateLimitExceeded", "503", "500", "404")

class RoadmapGenerator:
    def __init__(self, api_key=None, engine=None):
        # --- NVIDIA setup (Primary) ---
        self.nvidia_api_key = os.getenv("NVIDIA_API_KEY")
        self.nvidia_client = None
        if NVIDIA_AVAILABLE and self.nvidia_api_key:
            self.nvidia_client = OpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=self.nvidia_api_key
            )
        self.nvidia_model_id = "mistralai/mistral-small-4-119b-2603" 


        # --- Gemini setup (Fallback 2) ---
        self.gemini_api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.gemini_client = None
        if self.gemini_api_key:
            self.gemini_client = genai.Client(api_key=self.gemini_api_key)
        self.gemini_model_id = "gemini-2.0-flash"

        self.engine = engine or SkillGapEngine()

    def get_context_for_role(self, role_filter):
        """Extract real interview questions and resources for the selected role."""
        if self.engine.kaggle_df.empty:
            return {"questions": "N/A", "resources": "N/A"}
            
        kag_data = self.engine.kaggle_df[self.engine.kaggle_df['grouped_role'] == role_filter]
        questions = []
        resources = []
        for _, row in kag_data.iterrows():
            if row.get('questions_all') is not None and not (isinstance(row.get('questions_all'), float) and pd.isna(row.get('questions_all'))):
                questions.append(f"Q: {row['questions_all']}")
            
            res = row.get('resource_links', row.get('resource links'))
            if res is not None and not (isinstance(res, float) and pd.isna(res)):
                if isinstance(res, list):
                    resources.extend([str(r).strip() for r in res if r])
                else:
                    parts = str(res).split(',')
                    resources.extend([p.strip() for p in parts if p.strip()])

        clean_resources = sorted(list(set([r for r in resources if r])))
        return {
            "questions": "\n".join(questions[:15]),
            "resources": "\n".join(clean_resources)
        }

    def _build_prompt(self, user_skills, target_role, target_ctc_bracket,
                      target_company_display, analysis, context):
        return f"""
You are an expert Career Coach. Generate a detailed placement readiness report for {target_company_display}.

INPUT:
- Role: {target_role} | CTC: {target_ctc_bracket}
- Current Skills: {", ".join(user_skills)}
- Missing: {", ".join(analysis['missing'])}
- Verified Database Resources: {context['resources'] if context['resources'] else 'NONE FOUND IN DB'}
- Real Questions: {context['questions']}

INSTRUCTION:
1. Use "Verified Database Resources" if provided. 
2. If "NONE FOUND IN DB", you MUST generate your own curated list of high-quality learning resources (YouTube, docs) for the missing skills.
3. Return ONLY a valid JSON object with the following schema:
{{
  "company_name": "{target_company_display}",
  "match_percentage": float,
  "matched_count": int,
  "missing_count": int,
  "priority_skill": "string (the most critical missing skill)",
  "estimated_preparation_days": int,
  "analysis_summary": "string (brief overview)",
  "readiness_status": "string (e.g., 'Ready', 'Partially Ready', 'Needs Focus')",
  "skills_already_have": ["skill1", "skill2"],
  "skills_to_develop": [
    {{ "skill": "string", "tag": "Critical/Recommended", "est_days": int, "resource_link": "URL" }}
  ],
  "roadmap_blocks": [
    {{
      "title": "Phase Title",
      "skills_covered": ["skill1", "skill2"],
      "tasks": ["Detailed task description", "Another task"],
      "resources": [
        {{ "label": "Resource Name", "url": "URL", "type": "course/video/practice" }}
      ]
    }}
  ]
}}
"""

    def _clean_json(self, text: str) -> dict:
        """Strips markdown code blocks and parses JSON."""
        # Remove markdown code blocks if present
        clean_text = re.sub(r"```json\s*|\s*```", "", text, flags=re.IGNORECASE).strip()
        # Fallback for just ``` blocks
        clean_text = re.sub(r"```\s*|\s*```", "", clean_text, flags=re.IGNORECASE).strip()
        try:
            return json.loads(clean_text)
        except json.JSONDecodeError:
            # If still failing, try to find the first '{' and last '}'
            match = re.search(r"(\{.*\})", clean_text, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            raise

    def _call_nvidia(self, prompt: str) -> dict:
        if not self.nvidia_client: raise RuntimeError("NVIDIA Not Configured")
        
        print(f"  [NVIDIA] Using model: {self.nvidia_model_id}...")
        completion = self.nvidia_client.chat.completions.create(
            model=self.nvidia_model_id,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=16384,
            extra_body={"reasoning_effort": "high"},
            response_format={"type": "json_object"},
        )
        return self._clean_json(completion.choices[0].message.content)


    def _call_gemini(self, prompt: str) -> dict:
        if not self.gemini_client: raise RuntimeError("Gemini Not Configured")
        response = self.gemini_client.models.generate_content(
            model=self.gemini_model_id,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        return self._clean_json(response.text)

    def generate_roadmap(self, user_skills, target_role, target_ctc_bracket,
                         target_company=None, student_background=None):
        print(f">> Starting roadmap generation for {target_company}...")
        # ... (rest of the checks)
        
        # 1. Check Function Existence
        if not hasattr(self.engine, 'get_company_by_name'):
            return {"error": "Critical: Engine function 'get_company_by_name' missing. Please restart server."}

        # 2. Resolve Data
        try:
            if target_company:
                comp_data = self.engine.get_company_by_name(target_company)
                if not comp_data: return {"error": f"Company '{target_company}' not found."}
                target_jd_skills = comp_data.get('skills_required', comp_data.get('skills', ''))
            else:
                company_list = self.engine.get_company_list(target_role, target_ctc_bracket)
                if not company_list: return {"error": "No companies found for this criteria."}
                target_jd_skills = company_list[0]['skills_required']
                target_company = company_list[0]['company_name']

            analysis = self.engine.compare_skills(user_skills, target_jd_skills)
            context = self.get_context_for_role(target_role)

            prompt = self._build_prompt(
                user_skills, target_role, target_ctc_bracket,
                target_company, analysis, context
            )

            # THE NVIDIA-FIRST CHAIN (Gemini Fallback)
            providers = [
                ("NVIDIA", self._call_nvidia),
                ("GEMINI", self._call_gemini)
            ]

            errors = []
            for name, caller in providers:
                try:
                    print(f"[LLM] Attempting {name} (Primary)..." if name == "NVIDIA" else f"[LLM] Falling back to {name}...")
                    result = caller(prompt)
                    
                    if not isinstance(result, dict):
                        raise ValueError(f"{name} returned non-dictionary response")
                    
                    result["provider"] = name.lower()
                    print(f"[LLM] SUCCESS: {name} generated the roadmap.")
                    return result
                except Exception as e:
                    error_msg = str(e)
                    print(f"[LLM] ERROR: {name} failed. Reason: {error_msg}")
                    errors.append(f"{name}: {error_msg}")
                    continue
            
            final_error = " | ".join(errors)
            print(f"[LLM] CRITICAL: All providers failed. {final_error}")
            return {"error": f"AI Engine failed. Details: {final_error}"}
        except Exception as e:
            print(f"[ENGINE] CRASH: {str(e)}")
            return {"error": f"Internal Engine Error: {str(e)}"}

if __name__ == "__main__":
    gen = RoadmapGenerator()
    print("Roadmap Generator Initialized.")
