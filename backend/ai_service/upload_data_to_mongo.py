import pandas as pd
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

def migrate_data():
    uri = os.getenv("DEST_MONGO_URI")
    db_name = os.getenv("DEST_DB_NAME", "placement_db")
    
    print(f"Connecting to MongoDB Atlas...")
    client = MongoClient(uri)
    db = client[db_name]
    
    # 1. Migrate Official Data
    print("Reading official_company_data_sorted.csv...")
    official_df = pd.read_csv('official_company_data_sorted.csv')
    official_records = official_df.to_dict('records')
    
    print(f"Uploading {len(official_records)} official records to 'companies_official'...")
    db.companies_official.drop() # Clear previous data
    db.companies_official.insert_many(official_records)
    
    # 2. Migrate Kaggle Data
    print("Reading placement_dataset_KAGGLE.csv...")
    kaggle_df = pd.read_csv('placement_dataset_KAGGLE.csv')
    kaggle_records = kaggle_df.to_dict('records')
    
    print(f"Uploading {len(kaggle_records)} kaggle records to 'companies_kaggle'...")
    db.companies_kaggle.drop()
    db.companies_kaggle.insert_many(kaggle_records)
    
    print("\nMigration Script Finished!")
    print(f"Database: {db_name}")
    print(f"Collections: companies_official, companies_kaggle")

if __name__ == "__main__":
    try:
        migrate_data()
    except Exception as e:
        print(f"Migration Failed: {str(e)}")
