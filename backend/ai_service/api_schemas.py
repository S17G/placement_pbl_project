from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class SkillDiscoveryRequest(BaseModel):
    role: str
    ctc_bracket: str

class SkillRecommendationResponse(BaseModel):
    role: str
    recommended_skills: List[str]

class CompanyListItem(BaseModel):
    company_name: str
    ctc: str
    ctc_bracket: str
    match_p: float

class RoadmapRequest(BaseModel):
    student_id: str
    user_skills: List[str]
    target_role: str
    target_ctc_bracket: str
    target_company: Optional[str] = None
    background: Optional[str] = None

class ChatRequest(BaseModel):
    student_id: str
    message: str
    # Optional: current roadmap ID for context
    roadmap_id: Optional[str] = None

class AnalysisResponse(BaseModel):
    roadmap_id: str
    company_name: str
    match_percentage: float
    matched_count: int
    missing_count: int
    priority_skill: str
    estimated_preparation_days: int
    analysis_summary: str
    readiness_status: str
    skills_already_have: List[str]
    skills_to_develop: List[Dict]
    roadmap_blocks: List[Dict]
