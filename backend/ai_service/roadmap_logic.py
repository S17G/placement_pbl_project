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

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

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
        self.nvidia_model_id = "mistralai/mistral-large-2-12407" 

        # --- Groq setup (Fallback 1) ---
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.groq_client = None
        if GROQ_AVAILABLE and self.groq_api_key:
            self.groq_client = Groq(api_key=self.groq_api_key)
        self.groq_model_id = "llama-3.3-70b-versatile"

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
            if pd.notna(row.get('questions_all')):
                questions.append(f"Q: {row['questions_all']}")
            
            res = row.get('resource_links', row.get('resource links'))
            if pd.notna(res):
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
- Verified Database Resources: {context['resources'] if len(str(context['resources'])) > 5 else 'NONE FOUND IN DB'}
- Real Questions: {context['questions']}

INSTRUCTION:
1. Use "Verified Database Resources" if provided. 
2. If "NONE FOUND IN DB", you MUST generate your own curated list of high-quality learning resources (YouTube, docs) for the missing skills.
3. Return ONLY a valid JSON object with: company_name, match_percentage, matched_count, missing_count, priority_skill, estimated_preparation_days, analysis_summary, readiness_status, skills_already_have, skills_to_develop, roadmap_blocks.
"""

    def _call_nvidia(self, prompt: str) -> dict:
        if not self.nvidia_client: raise RuntimeError("NVIDIA Not Configured")
        
        # Trying the most common Llama model on NIM if Mistral fails
        models = ["meta/llama-3.1-70b-instruct", "mistralai/mistral-large-2407"]
        last_err = None
        for model in models:
            try:
                print(f"  [NVIDIA] Trying model: {model}...")
                completion = self.nvidia_client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1,
                    response_format={"type": "json_object"},
                )
                return json.loads(completion.choices[0].message.content)
            except Exception as e:
                last_err = e
                print(f"  [NVIDIA] Model {model} failed: {str(e)}")
                continue
        raise last_err

    def _call_groq(self, prompt: str) -> dict:
        if not self.groq_client: raise RuntimeError("Groq Not Configured")
        completion = self.groq_client.chat.completions.create(
            model=self.groq_model_id,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        return json.loads(completion.choices[0].message.content)

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
        return json.loads(response.text)

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

            # DEBUG: Check types to catch ambiguous Pandas objects
            print(f">> DEBUG: target_company type: {type(target_company)}")
            print(f">> DEBUG: target_jd_skills type: {type(target_jd_skills)}")

            analysis = self.engine.compare_skills(user_skills, target_jd_skills)
            context = self.get_context_for_role(target_role)

            prompt = self._build_prompt(
                user_skills, target_role, target_ctc_bracket,
                target_company, analysis, context
            )

            # 2. THE NVIDIA-FIRST CHAIN
            providers = [
                ("NVIDIA", self._call_nvidia),
                ("GROQ", self._call_groq),
                ("GEMINI", self._call_gemini)
            ]

            errors = []
            for name, caller in providers:
                try:
                    print(f"[LLM] Attempting {name} (Primary)..." if name == "NVIDIA" else f"[LLM] Falling back to {name}...")
                    result = caller(prompt)
                    
                    if not isinstance(result, dict):
                        raise ValueError(f"{name} returned non-dictionary response")
                    
                    result["_provider"] = name.lower()
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
