import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# Importing the maps from your migration logic
COMPANY_CANONICAL_MAP = {
    "Arista Network": "Arista Networks",
    "Arista": "Arista Networks",
    "Barclays": "Barclays",
    "BNY Mellon": "BNY Mellon",
    "BNY": "BNY Mellon",
    "Cisco": "Cisco",
    "DB": "Deutsche Bank",
    "Deutsche Bank": "Deutsche Bank",
    "Mastercard": "Mastercard",
    "UBS": "UBS",
    "ZS": "ZS Associates",
    "ZS Associates": "ZS Associates"
}

ROLE_CANONICAL_MAP = {
    "SDE Intern": "Software Development Engineer",
    "SDE": "Software Development Engineer",
    "Software Engineer": "Software Development Engineer",
    "Data Analyst Intern": "Data Analyst",
    "DA": "Data Analyst",
    "Full Stack Developer": "Full Stack Developer",
    "FSD": "Full Stack Developer",
}

URI = "mongodb://ghargeshubh_db_user:ghargeshubh123@ac-myysemg-shard-00-00.lafl9ne.mongodb.net:27017,ac-myysemg-shard-00-01.lafl9ne.mongodb.net:27017,ac-myysemg-shard-00-02.lafl9ne.mongodb.net:27017/placement_db?ssl=true&authSource=admin&replicaSet=atlas-12s1bq-shard-0"

async def normalize():
    try:
        client = AsyncIOMotorClient(URI)
        db = client['placement_db']
        
        for coll_name in ['placementrecords', 'internshiprecords']:
            print(f"Normalizing {coll_name}...")
            records = await db[coll_name].find().to_list(length=1000)
            count = 0
            for doc in records:
                old_name = doc.get('company', '')
                old_role = doc.get('role', '')
                
                new_name = COMPANY_CANONICAL_MAP.get(old_name, old_name)
                new_role = ROLE_CANONICAL_MAP.get(old_role, old_role)
                
                if new_name != old_name or new_role != old_role:
                    await db[coll_name].update_one(
                        {"_id": doc["_id"]},
                        {"$set": {"company": new_name, "role": new_role}}
                    )
                    count += 1
            print(f"  - Updated {count} records in {coll_name}")
        
        print("Sync and Normalization complete!")
        client.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(normalize())
