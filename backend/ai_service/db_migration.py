import asyncio
import os
import re
from db_manager import db_manager

# --- CANONICAL MAPPINGS ---
COMPANY_MAP = {
    "Arista Network": "Arista Networks",
    "Bank of New York": "BNY Mellon",
    "Bank of New York Mellon": "BNY Mellon",
    "eQ Technogic": "EQ Technologic",
    "eQ Technologic": "EQ Technologic",
    "Ion": "ION Group",
    "ION.": "ION Group",
    "ZS Associate": "ZS Associates",
    "Equifax.": "Equifax",
    "Qualys.": "Qualys",
    "Walmart Global Tech India": "Walmart",
    "Cell.do": "Sell.do",
    "Floqast": "FloQast"
}

ROLE_MAP = {
    # 1. Software Development Engineer (Canonical)
    "SDE": "Software Development Engineer",
    "SDE Role": "Software Development Engineer",
    "SDE1": "Software Development Engineer",
    "SDE [Intern + FTE]": "Software Development Engineer",
    "Software Development Engineer (SDE)": "Software Development Engineer",
    "Software Engineering": "Software Development Engineer",
    "Software Developer": "Software Development Engineer",
    
    # 2. Software Engineer (Canonical)
    "SWE": "Software Engineer",
    "Softwares Engineer": "Software Engineer",
    "Product Engineer": "Software Engineer",
    
    # 3. AI/Software Engineer Intern
    "AI/Software Engineer Intern (PPO -> AI/Software Engineer)": "AI/Software Engineer Intern",
    
    # 4. SDE Intern
    "SDE-I Intern": "SDE Intern",
    "SDE Intern - Mastercard Checkout Services": "SDE Intern",
    "SDE Intern \u2013 Mastercard Checkout Services": "SDE Intern",
    "Summer Internship (SDE Intern)": "SDE Intern",
    
    # 5. Software Engineer Intern
    "Software Engineer Intern - I": "Software Engineer Intern",
    "Software Engineering Internship": "Software Engineer Intern",
    "Software Intern (Summer Internship)": "Software Engineer Intern",
    "Software Engineering (SWE) Internship": "Software Engineer Intern",
    "Summer Intern": "Software Engineer Intern",
    "Summer Internship": "Software Engineer Intern",
    "Technology Summer Intern": "Software Engineer Intern",

    # 6. Others to keep
    "Associate Software Engineer Job Location: Pune": "Associate Software Engineer",
    "Business Technology Solutions Associate Job Location: Pune": "Business Technology Solutions Associate",
    "BTSA": "Business Technology Solutions Associate"
}

UNWANTED_ROLES = ["nan", "Full Time", "Intern", "Internship", "Technology Intern", "Entey level fresher", "Consulting", "Graduate Analyst"]

async def migrate(dry_run=True):
    await db_manager.connect()
    print(f"\n>> DATABASE MIGRATION STARTED (Dry Run: {dry_run})")
    
    # 1. COLLECTIONS
    off_coll = db_manager.db['companies_official']
    kag_coll = db_manager.db['companies_kaggle']
    
    # Normalise Companies
    for old, new in COMPANY_MAP.items():
        query = {"company_name": old}
        count_off = await off_coll.count_documents(query)
        count_kag = await kag_coll.count_documents(query)
        if count_off > 0 or count_kag > 0:
            print(f"[COMPANY] Mapping '{old}' -> '{new}' ({count_off} off, {count_kag} kag)")
            if not dry_run:
                await off_coll.update_many(query, {"$set": {"company_name": new}})
                await kag_coll.update_many(query, {"$set": {"company_name": new}})

    # Normalise Roles (Official uses 'profile', Kaggle uses 'role')
    for old, new in ROLE_MAP.items():
        query_off = {"profile": old}
        query_kag = {"role": old}
        count_off = await off_coll.count_documents(query_off)
        count_kag = await kag_coll.count_documents(query_kag)
        if count_off > 0 or count_kag > 0:
            print(f"[ROLE] Mapping '{old}' -> '{new}' ({count_off} off, {count_kag} kag)")
            if not dry_run:
                await off_coll.update_many(query_off, {"$set": {"profile": new}})
                await kag_coll.update_many(query_kag, {"$set": {"role": new}})

    # Cleanup Unwanted
    for role in UNWANTED_ROLES:
        query_off = {"profile": role}
        query_kag = {"role": role}
        count_off = await off_coll.count_documents(query_off)
        count_kag = await kag_coll.count_documents(query_kag)
        if count_off > 0 or count_kag > 0:
            print(f"[CLEANUP] Removing generic role '{role}' ({count_off} off, {count_kag} kag)")
            if not dry_run:
                await off_coll.delete_many(query_off)
                await kag_coll.delete_many(query_kag)

    # Final Cleanup: nan companies
    query_nan_comp = {"company_name": "nan"}
    count_nan = await off_coll.count_documents(query_nan_comp) + await kag_coll.count_documents(query_nan_comp)
    if count_nan > 0:
        print(f"[CLEANUP] Removing {count_nan} 'nan' company records")
        if not dry_run:
            await off_coll.delete_many(query_nan_comp)
            await kag_coll.delete_many(query_nan_comp)

    print("\n>> MIGRATION COMPLETE")

if __name__ == "__main__":
    import sys
    dry = "--live" not in sys.argv
    asyncio.run(migrate(dry_run=dry))
