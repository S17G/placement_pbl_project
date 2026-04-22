import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# Using the stable long format
URI = "mongodb://ghargeshubh_db_user:ghargeshubh123@ac-myysemg-shard-00-00.lafl9ne.mongodb.net:27017,ac-myysemg-shard-00-01.lafl9ne.mongodb.net:27017,ac-myysemg-shard-00-02.lafl9ne.mongodb.net:27017/placement_db?ssl=true&authSource=admin&replicaSet=atlas-12s1bq-shard-0"

# THE MASTER MAP from our earlier consolidation
MAPS = {
    "Arista Network": "Arista Networks",
    "Arista": "Arista Networks",
    "BNY": "BNY Mellon",
    "BNY Mellon": "BNY Mellon",
    "DB": "Deutsche Bank",
    "Deutsche Bank": "Deutsche Bank",
    "ZS": "ZS Associates",
    "ZS Associates": "ZS Associates",
    "SDE": "Software Development Engineer",
    "FSD": "Full Stack Developer",
    "DA": "Data Analyst"
}

async def deep_clean():
    try:
        client = AsyncIOMotorClient(URI)
        db = client['placement_db']
        
        collections = ['companies_official', 'companies_kaggle', 'placementrecords', 'internshiprecords']
        total_updated = 0
        
        for coll_name in collections:
            print(f"Cleaning {coll_name}...")
            docs = await db[coll_name].find().to_list(length=2000)
            coll_updated = 0
            
            for doc in docs:
                updates = {}
                # Check company names
                for field in ['company', 'company_name']:
                    if field in doc:
                        val = str(doc[field]).strip()
                        if val in MAPS:
                            updates[field] = MAPS[val]
                
                # Check roles
                for field in ['role', 'profile']:
                    if field in doc:
                        val = str(doc[field]).strip()
                        if val in MAPS:
                            updates[field] = MAPS[val]
                
                if updates:
                    await db[coll_name].update_one({"_id": doc["_id"]}, {"$set": updates})
                    coll_updated += 1
            
            print(f"  - Updated {coll_updated} records in {coll_name}")
            total_updated += coll_updated
            
        print(f"\n>> DATABASE DEEP CLEAN COMPLETE! Total updates: {total_updated}")
        client.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(deep_clean())
