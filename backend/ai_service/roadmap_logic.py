import os
import json
import re
import pandas as pd
from google import genai
from google.genai import types
from dotenv import load_dotenv
import requests
from pathlib import Path
from skill_gap_engine import SkillGapEngine

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

# Explicitly load the .env from this file's directory so it works
# regardless of where uvicorn is launched from.
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path, override=True)

# Rate-limit / model-not-found signals that should trigger Groq fallback
_FALLBACK_SIGNALS = (
    "429", "quota", "rate limit", "resource_exhausted", "ratelimitexceeded",
    "not_found", "404", "not found for api version",  # catches the broken model-id error
)

def _is_rate_limit_error(err: Exception) -> bool:
    msg = str(err).lower()
    return any(sig.lower() in msg for sig in _FALLBACK_SIGNALS)


class RoadmapGenerator:
    def __init__(self, api_key=None, engine=None):
        # --- Gemini setup ---
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found. Please provide it or set it in .env")
        self.client = genai.Client(api_key=self.api_key)
        self.model_id = "gemini-2.5-flash"

        # --- NVIDIA setup (Primary) ---
        self.nvidia_api_key = os.getenv("NVIDIA_API_KEY")
        self.nvidia_url = "https://integrate.api.nvidia.com/v1/chat/completions"
        self.nvidia_model_id = "mistralai/mistral-small-4-119b-2603"

        # --- Groq fallback setup (Legacy/Inactive) ---
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.groq_client = None
        if GROQ_AVAILABLE and self.groq_api_key:
            self.groq_client = Groq(api_key=self.groq_api_key)
        self.groq_model_id = "llama-3.3-70b-versatile"

        # Accept an external engine (data-loaded) or create an empty one as fallback
        self.engine = engine if engine is not None else SkillGapEngine()

    # ------------------------------------------------------------------
    # RAG context retrieval
    # ------------------------------------------------------------------
    def get_context_for_role(self, role_filter):
        """Extract real interview questions and resources for the selected role."""
        kag_data = self.engine.kaggle_df[self.engine.kaggle_df['grouped_role'] == role_filter]

        questions = []
        resources = []

        for _, row in kag_data.iterrows():
            if pd.notna(row['questions_all']):
                questions.append(f"Company: {row['company_name']} asked: {row['questions_all']}")
            if pd.notna(row['resource_links']):
                resources.append(row['resource_links'])

        return {
            "questions": "\n".join(questions[:20]),
            "resources": "\n".join(set(resources))
        }

    # ------------------------------------------------------------------
    # Shared prompt builder
    # ------------------------------------------------------------------
    def _build_prompt(self, user_skills, target_role, target_ctc_bracket,
                      target_company_display, analysis, context, student_background):
        return f"""
You are an expert Career Coach. Generate a detailed, actionable placement readiness roadmap for {target_company_display}.

INPUT DATA:
- Student Background: {student_background or "Not provided"}
- Target Role: {target_role}
- Target CTC: {target_ctc_bracket}
- Current Skills: {", ".join(user_skills)}
- Matched Skills: {", ".join(analysis['matched'])}
- Missing Skills: {", ".join(analysis['missing'])}
- Real Interview Context: {context['questions']}
- Real Resource Context: {context.get('resources', '')}

STRICT RULES:
1. For resources, generate REAL, working URLs from: Coursera (coursera.org), YouTube (youtube.com/results?search_query=...), GeeksForGeeks (geeksforgeeks.org), LeetCode (leetcode.com/tag/...), or freeCodeCamp (freecodecamp.org).
2. Assign a 'priority_skill' from the missing skills list.
3. Each roadmap_block must have 3-5 tasks and 2-3 direct course resource URLs.
4. Generate exactly 4 roadmap_blocks as sequential phases (Week 1-2, Week 3-4, Week 5-6, Week 7-8).
5. For each skill_to_develop, provide specific actionable tasks (not generic advice).
6. For each skill in skills_to_develop, you MUST provide a direct 'resource_link'. Prioritize links from the 'Real Resource Context' (from placement_data_elite) if relevant. If none match, generate a valid YouTube/Coursera/Leetcode link.
7. Respond ONLY with valid JSON, no markdown fences.

OUTPUT FORMAT (JSON only, no extra text):
{{
  "company_name": "{target_company_display}",
  "match_percentage": {analysis['match_p']},
  "matched_count": {len(analysis['matched'])},
  "missing_count": {len(analysis['missing'])},
  "priority_skill": "Most critical missing skill",
  "estimated_preparation_days": 56,
  "analysis_summary": "Detailed 3-sentence personalized summary mentioning {target_company_display} specifically.",
  "readiness_status": "Brief readiness status label.",
  "skills_already_have": {json.dumps(analysis['matched']) if analysis['matched'] else '["None matched"]'},
  "skills_to_develop": [
    {{
      "skill": "Skill Name",
      "tag": "Critical",
      "est_days": 14,
      "tasks": ["Specific task 1", "Specific task 2", "Practice task 3"],
      "resource_link": "https://youtube.com/results?search_query=skill+name"
    }}
  ],
  "roadmap_blocks": [
    {{
      "title": "Week 1-2: Foundation",
      "week_label": "Week 1-2",
      "tasks": ["Specific actionable task 1", "Task 2", "Task 3"],
      "skills_covered": ["Skill A", "Skill B"],
      "resources": [
        {{"label": "Course Name", "url": "https://full-real-url.com", "type": "course"}},
        {{"label": "Practice Problems", "url": "https://leetcode.com/tag/array/", "type": "practice"}},
        {{"label": "YouTube Tutorial", "url": "https://youtube.com/results?search_query=skill+name", "type": "video"}}
      ]
    }}
  ]
}}
"""

    # ------------------------------------------------------------------
    # Provider: NVIDIA (Primary)
    # ------------------------------------------------------------------
    def _call_nvidia(self, prompt: str) -> dict:
        api_key = os.getenv("NVIDIA_API_KEY") or self.nvidia_api_key
        if not api_key:
            raise RuntimeError("NVIDIA_API_KEY not found in .env at runtime!")
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json"
        }
        payload = {
            "model": self.nvidia_model_id,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 16384,
            "temperature": 0.1,
            "top_p": 1.0,
            "stream": False
        }
        
        response = requests.post(self.nvidia_url, headers=headers, json=payload)
        response.raise_for_status()
        
        content = response.json()["choices"][0]["message"]["content"]
        # Clean up code fences if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        return json.loads(content)

    # ------------------------------------------------------------------
    # Provider: Gemini
    # ------------------------------------------------------------------
    def _call_gemini(self, prompt: str) -> dict:
        response = self.client.models.generate_content(
            model=self.model_id,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        return json.loads(response.text)

    # ------------------------------------------------------------------
    # Provider: Groq (fallback)
    # ------------------------------------------------------------------
    def _call_groq(self, prompt: str) -> dict:
        if not self.groq_client:
            raise RuntimeError(
                "Groq client not initialised. Set GROQ_API_KEY in your .env file "
                "and run: pip install groq"
            )
        completion = self.groq_client.chat.completions.create(
            model=self.groq_model_id,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        return json.loads(completion.choices[0].message.content)

    # ------------------------------------------------------------------
    # Chat / Generic AI calls
    # ------------------------------------------------------------------
    def chat(self, prompt: str) -> dict:
        """Centralised chat entry point with NVIDIA -> Gemini priority."""
        try:
            # 1. Try NVIDIA
            print(f"[CHAT] Trying NVIDIA ({self.nvidia_model_id})...")
            api_key = os.getenv("NVIDIA_API_KEY") or self.nvidia_api_key
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Accept": "application/json"
            }
            payload = {
                "model": self.nvidia_model_id,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 4096,
                "temperature": 0.3,
                "stream": False
            }
            response = requests.post(self.nvidia_url, headers=headers, json=payload)
            response.raise_for_status()
            ai_response = response.json()["choices"][0]["message"]["content"]
            return {"response": ai_response, "provider": "nvidia"}
        
        except Exception as nvidia_err:
            print(f"[CHAT] NVIDIA failed ({nvidia_err}). Falling back to Gemini...")
            try:
                # 2. Try Gemini
                print(f"[CHAT] Trying Gemini ({self.model_id})...")
                response = self.client.models.generate_content(
                    model=self.model_id,
                    contents=prompt
                )
                return {"response": response.text, "provider": "gemini"}
            except Exception as gemini_err:
                raise RuntimeError(f"Both AI providers failed. NVIDIA: {nvidia_err} | Gemini: {gemini_err}")

    # ------------------------------------------------------------------
    # Main entry point
    # ------------------------------------------------------------------
    def generate_roadmap(self, user_skills, target_role, target_ctc_bracket,
                         target_company=None, student_background=None):
        # 1. Resolve company + skill data from engine
        if target_company:
            comp_data = self.engine.get_company_by_name(target_company)
            if not comp_data:
                return {"error": f"Company '{target_company}' not found in database. Please check the name."}
            target_jd_skills = comp_data['skills_required']
        else:
            company_list = self.engine.get_company_list(target_role, target_ctc_bracket)
            if not company_list:
                return {"error": f"No companies found for role '{target_role}' in the {target_ctc_bracket} bracket."}
            target_jd_skills = company_list[0]['skills_required']
            target_company = company_list[0]['company_name']

        analysis = self.engine.compare_skills(user_skills, target_jd_skills)
        target_company_display = target_company or "Target Companies"

        # 2. RAG context
        context = self.get_context_for_role(target_role)
        if target_company:
            comp_kag = self.engine.kaggle_df[
                self.engine.kaggle_df['company_name'].astype(str).str.contains(
                    target_company, case=False, na=False
                )
            ]
            if not comp_kag.empty:
                comp_questions = [
                    f"SPECIFIC {target_company} Question: {q}"
                    for q in comp_kag['questions_all'].dropna()
                ]
                context['questions'] = "\n".join(comp_questions[:10]) + "\n" + context['questions']

        # 3. Build shared prompt
        prompt = self._build_prompt(
            user_skills, target_role, target_ctc_bracket,
            target_company_display, analysis, context, student_background
        )

        # 4. Try NVIDIA (Primary) → Fallback to Gemini (Secondary)
        try:
            print(f"[LLM] Trying NVIDIA ({self.nvidia_model_id})...")
            result = self._call_nvidia(prompt)
            result["_provider"] = "nvidia"
            print("[LLM] NVIDIA succeeded.")
            return result
        except Exception as nvidia_err:
            print(f"[LLM] NVIDIA failed ({nvidia_err}). Falling back to Gemini...")
            try:
                print(f"[LLM] Trying Gemini ({self.model_id})...")
                result = self._call_gemini(prompt)
                result["_provider"] = "gemini"
                print("[LLM] Gemini succeeded.")
                return result
            except Exception as gemini_err:
                return {
                    "error": f"AI Generation Failed. Both NVIDIA and Gemini failed. "
                             f"NVIDIA: {nvidia_err} | Gemini: {gemini_err}"
                }


if __name__ == "__main__":
    gen = RoadmapGenerator()
    user_skills = ["Java", "OOP", "DBMS"]
    roadmap = gen.generate_roadmap(user_skills, "SDE", "10-15LPA")
    print(json.dumps(roadmap, indent=2))
