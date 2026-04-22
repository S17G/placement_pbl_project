import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# YOUR DATA (Source)
YOUR_URI = "mongodb+srv://esha_parekh1010:pbl_project@cluster0.hokyblc.mongodb.net/placement_db?appName=Cluster0"

# FRIEND'S DATA (Destination)
FRIEND_URI = "mongodb+srv://ghargeshubh_db_user:ghargeshubh123@start.lafl9ne.mongodb.net/placement_db?retryWrites=true&w=majority&appName=Start"

async def migrate_all():
    y_client = AsyncIOMotorClient(YOUR_URI)
    f_client = AsyncIOMotorClient(FRIEND_URI)
    
    # We will consolidate everything into 'placement_db' on his cluster
    y_db = y_client['placement_db']
    f_db = f_client['placement_db']
    
    # Also grab his current 'test' data to move it to 'placement_db'
    f_test_db = f_client['test']

    print(">> Starting Final Fusion Migration...")

    # 1. Move HIS data from 'test' to 'placement_db'
    his_colls = ['users', 'faqentries', 'discussionposts', 'resumeresources', 'placementrecords', 'internshiprecords', 'registrationrequests']
    for coll in his_colls:
        try:
            data = await f_test_db[coll].find().to_list(length=1000)
            if data:
                print(f"[FRIEND] Moving '{coll}' ({len(data)} docs) to 'placement_db'...")
                for doc in data:
                    await f_db[coll].update_one({"_id": doc["_id"]}, {"$set": doc}, upsert=True)
        except Exception as e:
            print(f"Error moving {coll}: {str(e)}")

    # 2. Move YOUR model data to his 'placement_db'
    your_colls = ['companies_official', 'companies_kaggle', 'roadmaps', 'experience_processed']
    for coll in your_colls:
        try:
            data = await y_db[coll].find().to_list(length=1000)
            if data:
                print(f"[YOU] Moving '{coll}' ({len(data)} docs) to friend's 'placement_db'...")
                for doc in data:
                    await f_db[coll].update_one({"_id": doc["_id"]}, {"$set": doc}, upsert=True)
        except Exception as e:
            print(f"Error moving {coll}: {str(e)}")

    print("\n>> ALL DATA MERGED INTO FRIEND'S CLUSTER!")
    y_client.close()
    f_client.close()

if __name__ == "__main__":
    asyncio.run(migrate_all())
