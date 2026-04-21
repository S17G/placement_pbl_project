import os
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn
import pandas as pd
from contextlib import asynccontextmanager

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

# --- LIFESPAN HANDLER (Modern FastAPI) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP: Initializing engines and loading data
    print("\n" + "="*50)
    print(">> AI SERVICE STARTUP INITIATED")
    print("="*50)
    
    await db_manager.connect()
    
    print("Fetching placement data from MongoDB Atlas...")
    try:
        official_data = await db_manager.fetch_collection_data("companies_official")
        kaggle_data = await db_manager.fetch_collection_data("companies_kaggle")
        
        if isinstance(official_data, list) and isinstance(kaggle_data, list) and len(official_data) > 0:
            engine.update_data(pd.DataFrame(official_data), pd.DataFrame(kaggle_data))
            print(f"[OK] ENGINE READY: {len(official_data)} official and {len(kaggle_data)} kaggle records loaded.")
        else:
            print("[WARN] WARNING: MongoDB collections appear to be empty. Run migration script first.")
    except Exception as e:
        print(f"[ERROR] DATA LOAD FAILED: {str(e)}")
    
    print("="*50 + "\n")
    yield
    # SHUTDOWN
    print("\n[DONE] AI SERVICE SHUTDOWN COMPLETE")

# Create App
app = FastAPI(title="Placemate Skill Gap API", lifespan=lifespan)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
engine = SkillGapEngine()
# Pass the shared engine so RoadmapGenerator uses MongoDB-loaded data (not a new empty one)
generator = RoadmapGenerator(engine=engine)

# --- ENDPOINTS ---

@app.get("/api/v1/health")
async def health_check():
    """Simple health check for frontend connectivity."""
    return {
        "status": "healthy",
        "engine_ready": not engine.official_df.empty,
        "records_count": len(engine.official_df) + len(engine.kaggle_df)
    }

@app.get("/api/v1/metadata")
async def get_metadata():
    """Returns all unique roles, companies, and CTC brackets across both datasets."""
    if engine.official_df.empty:
        raise HTTPException(status_code=503, detail="AI Engine is still loading placement data from MongoDB. Please wait 5 seconds and refresh.")
    return engine.get_extended_metadata()

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
        print(f"[ERROR] Roadmap Generation Failed: {result['error']}")
        raise HTTPException(status_code=500, detail=result['error'])

    # Log which provider was used
    provider = result.get("_provider", "gemini")
    print(f"[LLM] Roadmap served by: {provider.upper()}")

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

    # 3. Build prompt
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

    # 4. Use shared chat logic for the core response
    try:
        result = generator.chat(prompt)
        ai_response = result["response"]
        provider_used = result["provider"]
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

    # 5. Save interactions to MongoDB
    await db_manager.save_chat_message(req.student_id, "user", req.message)
    await db_manager.save_chat_message(req.student_id, "assistant", ai_response)
    
    return {"response": ai_response, "provider": provider_used}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
