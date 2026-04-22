import asyncio
import os
import sys
from db_manager import db_manager

# Ensure UTF-8 for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

async def fix_official_roles():
    await db_manager.connect()
    coll = db_manager.db['companies_official']
    
    # Common role keywords to help identify if a string is a role vs skills
    role_keywords = ['engineer', 'associate', 'analyst', 'developer', 'sde', 'intern', 'trainee', 'consultant', 'specialist', 'btsa']
    
    records = await coll.find().to_list(length=1000)
    print(f"Checking {len(records)} official records...")
    
    updates = 0
    for doc in records:
        # Check if 'profile' already exists and is valid
        if doc.get('profile') and str(doc['profile']).strip() not in ['', 'nan', '-']:
            continue

        skills = str(doc.get('skills_required', '')).strip()
        if skills in ['', 'nan', '-']:
            continue
            
        is_role = False
        skills_lower = skills.lower()
        
        # Heuristic 1: Contains role keywords and is relatively short (not a long list of skills)
        if any(kw in skills_lower for kw in role_keywords) and len(skills.split(',')) <= 3:
            is_role = True
            
        # Heuristic 2: Known messy role strings from the CSV
        if any(x in skills for x in ["Software Engineer", "Associate Software Engineer", "Data Analyst", "Full stack developer"]):
            is_role = True

        if is_role:
            # Move to 'profile' field
            await coll.update_one(
                {"_id": doc["_id"]},
                {"$set": {"profile": skills}}
            )
            updates += 1
            print(f"Found Role in 'skills_required': {doc['company_name']} -> {skills}")

    print(f"\nFinished! Extracted {updates} roles into the 'profile' field.")
    # No close() method on db_manager, it closes on script end or can be ignored for this script
    
if __name__ == "__main__":
    asyncio.run(fix_official_roles())
