import os
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn

from skill_gap_engine import SkillGapEngine
from roadmap_logic import RoadmapGenerator
from api_schemas import (
    SkillDiscoveryRequest, 
    SkillRecommendationResponse, 
    CompanyListItem, 
    RoadmapRequest,
    AnalysisResponse,
    ChatRequest
)
from db_manager import db_manager

app = FastAPI(title="Placemate Skill Gap API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
engine = SkillGapEngine()
# Note: RoadmapGenerator requires GEMINI_API_KEY env var
generator = RoadmapGenerator(engine=engine)

import pandas as pd

async def sync_engine_with_db():
    """Pulls normalized data from MongoDB and updates the engine."""
    print(">> Syncing engine with cloud database...")
    official_data = await db_manager.fetch_collection_data('companies_official')
    kaggle_data = await db_manager.fetch_collection_data('companies_kaggle')
    exp_processed_data = await db_manager.fetch_collection_data('experience_processed')
    
    # Merge and update the engine
    all_kaggle = kaggle_data + exp_processed_data
    engine.update_data(pd.DataFrame(official_data), pd.DataFrame(all_kaggle))
    print(f">> Sync complete: {len(official_data)} official and {len(all_kaggle)} kaggle/processed companies loaded.")

@app.on_event("startup")
async def startup_db():
    await db_manager.connect()
    await sync_engine_with_db()
    print(">> Engine data synchronized with Cloud DB.")

@app.get("/api/v1/metadata")
async def get_metadata():
    """Returns available roles, companies, and CTC brackets for UI filters."""
    # Use the more comprehensive metadata method from the engine
    return engine.get_extended_metadata()

@app.post("/api/v1/quick-match")
async def quick_match(
    company_name: str = Body(..., embed=True),
    user_skills: List[str] = Body(..., embed=True)
):
    """Instant skill comparison for UI feedback."""
    comp_data = engine.get_company_by_name(company_name)
    if not comp_data:
        raise HTTPException(status_code=404, detail="Company not found")
    
    analysis = engine.compare_skills(user_skills, comp_data.get('skills_required', ''))
    return analysis

@app.post("/api/v1/recommend-skills", response_model=SkillRecommendationResponse)
async def recommend_skills(req: SkillDiscoveryRequest):
    """Recommends top skills for a specific role/CTC to help student input."""
    skills = engine.get_recommended_skills(req.role, req.ctc_bracket)
    return {
        "role": req.role,
        "recommended_skills": skills
    }

@app.post("/api/v1/list-companies", response_model=List[CompanyListItem])
async def list_companies(
    role: str = Body(...), 
    ctc_bracket: str = Body(...), 
    user_skills: List[str] = Body(...)
):
    """Lists matching companies with a preliminary match percentage."""
    companies = engine.get_company_list(role, ctc_bracket)
    results = []
    for c in companies:
        analysis = engine.compare_skills(user_skills, c['skills_required'])
        results.append({
            "company_name": c['company_name'],
            "ctc": c['ctc'],
            "ctc_bracket": c['ctc_bracket'],
            "match_p": analysis['match_p']
        })
    # Sort by match percentage
    results.sort(key=lambda x: x['match_p'], reverse=True)
    return results

@app.post("/api/v1/generate-roadmap", response_model=AnalysisResponse)
async def generate_roadmap(req: RoadmapRequest):
    """Generates a deep, RAG-based roadmap and saves to MongoDB."""
    result = generator.generate_roadmap(
        user_skills=req.user_skills,
        target_role=req.target_role,
        target_ctc_bracket=req.target_ctc_bracket,
        target_company=req.target_company,
        student_background=req.background
    )

    if "error" in result:
        raise HTTPException(status_code=500, detail=result['error'])

    # Save to MongoDB roadmaps collection
    roadmap_id = await db_manager.save_session(req.student_id, result, "roadmaps")
    result['roadmap_id'] = roadmap_id
    
    # Save initial chat message to history for context
    await db_manager.save_chat_message(
        req.student_id, 
        "system", 
        f"Generated targeted roadmap for {result['company_name']} with {result['match_percentage']}% match."
    )
    
    return result

@app.post("/api/v1/chat")
async def chat_with_assistant(req: ChatRequest):
    """Personalized conversational chat that remembers history from MongoDB."""
    # 1. Load history from DB
    history = await db_manager.get_chat_history(req.student_id)
    history_str = "\n".join([f"{m['role']}: {m['content']}" for m in history])

    # 2. Extract latest roadmap for context
    latest_roadmap = await db_manager.get_latest_roadmap(req.student_id)
    roadmap_context = f"Student's Current Roadmap: {latest_roadmap['analysis_summary']}" if latest_roadmap else ""

    # 3. Prompt Gemini
    prompt = f"""
    You are a career assistant for the Placemate platform. 
    You recognize the student across sessions.
    
    PREVIOUS CONVERSATION HISTORY:
    {history_str}
    
    CURRENT CONTEXT:
    {roadmap_context}
    
    STUDENT MESSAGE: {req.message}
    
    Respond in a personalized, helpful way based on their history. If they ask for changes, tell them you'll update the plan.
    """

    try:
        # We can use the generator's gemini_client for chat
        response = generator.gemini_client.models.generate_content(
            model=generator.gemini_model_id,
            contents=prompt
        )
        ai_response = response.text
        
        # 4. Save interactions to MongoDB
        await db_manager.save_chat_message(req.student_id, "user", req.message)
        await db_manager.save_chat_message(req.student_id, "assistant", ai_response)
        
        return {"response": ai_response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
