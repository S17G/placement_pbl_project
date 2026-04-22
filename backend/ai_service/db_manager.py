import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

class DBManager:
    def __init__(self):
        self.uri = os.getenv("DEST_MONGO_URI")
        self.db_name = os.getenv("DEST_DB_NAME", "placement_db")
        self.client = None
        self.db = None

    async def connect(self):
        if not self.client:
            self.client = AsyncIOMotorClient(self.uri)
            self.db = self.client[self.db_name]
            print(f"Connected to MongoDB: {self.db_name}")

    async def save_session(self, student_id: str, data: dict, collection_name: str):
        if self.db is None: await self.connect()
        collection = self.db[collection_name]
        data['student_id'] = student_id
        data['timestamp'] = datetime.utcnow()
        result = await collection.insert_one(data)
        
        # CLEANUP: Remove ObjectId so it doesn't crash the API response
        if '_id' in data:
            del data['_id']
            
        return str(result.inserted_id)

    async def get_chat_history(self, student_id: str, limit: int = 10):
        if self.db is None: await self.connect()
        collection = self.db['chat_history']
        cursor = collection.find({"student_id": student_id}).sort("timestamp", -1).limit(limit)
        history = await cursor.to_list(length=limit)
        return history[::-1] # Return in chronological order

    async def get_latest_roadmap(self, student_id: str):
        if self.db is None: await self.connect()
        collection = self.db['roadmaps']
        roadmap = await collection.find_one({"student_id": student_id}, sort=[("timestamp", -1)])
        return roadmap

    async def fetch_collection_data(self, collection_name: str):
        if self.db is None: await self.connect()
        collection = self.db[collection_name]
        cursor = collection.find({})
        return await cursor.to_list(length=None)

    async def save_chat_message(self, student_id: str, role: str, content: str):
        if self.db is None: await self.connect()
        collection = self.db['chat_history']
        message = {
            "student_id": student_id,
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow()
        }
        await collection.insert_one(message)

db_manager = DBManager()
