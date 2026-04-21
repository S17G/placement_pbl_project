import os
import json
import pandas as pd
from google import genai
from google.genai import types
from dotenv import load_dotenv
from skill_gap_engine import SkillGapEngine

load_dotenv()

class RoadmapGenerator:
    def __init__(self, api_key=None, engine=None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found. Please provide it or set it in .env")
        
        self.client = genai.Client(api_key=self.api_key)
        # Accept an external engine (data-loaded) or create an empty one as fallback
        self.engine = engine if engine is not None else SkillGapEngine()
        # Model list updated based on user's specific account access
        self.model_id = "gemini-2.5-flash" 

    def get_context_for_role(self, role_filter):
        """Extract real interview questions and resources for the selected role."""
        kag_data = self.engine.kaggle_df[self.engine.kaggle_df['grouped_role'] == role_filter]
        
        # Aggregate questions and resources
        questions = []
        resources = []
        
        for _, row in kag_data.iterrows():
            if pd.notna(row['questions_all']):
                questions.append(f"Company: {row['company_name']} asked: {row['questions_all']}")
            if pd.notna(row['resource_links']):
                resources.append(row['resource_links'])
                
        return {
            "questions": "\n".join(questions[:20]), # Limit context size
            "resources": "\n".join(set(resources))
        }

    def generate_roadmap(self, user_skills, target_role, target_ctc_bracket, target_company=None, student_background=None):
        # 1. Get Match Analysis from Engine
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

        # 2. Get Real Interview Context (RAG)
        context = self.get_context_for_role(target_role)
        if target_company:
            comp_kag = self.engine.kaggle_df[self.engine.kaggle_df['company_name'].astype(str).str.contains(target_company, case=False, na=False)]
            if not comp_kag.empty:
                comp_questions = [f"SPECIFIC {target_company} Question: {q}" for q in comp_kag['questions_all'].dropna()]
                context['questions'] = "\n".join(comp_questions[:10]) + "\n" + context['questions']

        # 3. Prompt Gemini to structure the Enhanced Roadmap
        prompt = f"""
        You are an expert Career Coach. Generate a detailed, actionable placement readiness roadmap for {target_company_display}.
        
        INPUT DATA:
        - Student Background: {student_background or "Not provided"}
        - Target Role: {target_role}
        - Target CTC: {target_ctc_bracket}
        - Current Skills: {", ".join(user_skills)}
        - Matched Skills: {", ".join(analysis['matched'])}
        - Missing Skills: {", ".join(analysis['missing'])}
        - Real Interview Context: {context['questions']}
        
        STRICT RULES:
        1. For resources, generate REAL, working URLs from: Coursera (coursera.org), YouTube (youtube.com/results?search_query=...), GeeksForGeeks (geeksforgeeks.org), LeetCode (leetcode.com/tag/...), or freeCodeCamp (freecodecamp.org).
        2. Assign a 'priority_skill' from the missing skills list.
        3. Each roadmap_block must have 3-5 tasks and 2-3 direct course resource URLs.
        4. Generate exactly 4 roadmap_blocks as sequential phases (Week 1-2, Week 3-4, Week 5-6, Week 7-8).
        5. For each skill_to_develop, provide specific actionable tasks (not generic advice).
        
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
              "tasks": ["Specific task 1", "Specific task 2", "Practice task 3"]
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

        # Try Generate with Fallback Chain
        # Note: Gemini 2.5 Flash (5 RPM) -> Gemini 2.5 Pro -> Gemini 2 Flash
        models_to_try = [self.model_id, "gemini-2.5-pro", "gemini-2-flash"]
        last_err = ""

        for model in models_to_try:
            try:
                response = self.client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1
                    )
                )
                return json.loads(response.text)
            except Exception as e:
                last_err = str(e)
                # Fallback to next model if this one fails (rate limit, etc)
                print(f"Model {model} failed: {last_err}")
                continue
        
        return {"error": f"AI Generation Failed. All account models reached limit. Details: {last_err}"}

if __name__ == "__main__":
    # Test Run
    gen = RoadmapGenerator()
    user_skills = ["Java", "OOP", "DBMS"]
    roadmap = gen.generate_roadmap(user_skills, "SDE", "10-15LPA")
    print(json.dumps(roadmap, indent=2))
