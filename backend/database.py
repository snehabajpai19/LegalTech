# backend/database.py

import pymongo
from config import settings 
from models.user import User
from models.document import Document, ChatMessage

class Database:
    def __init__(self, db_url):
        try:
            self.client = pymongo.MongoClient(db_url)
            self.db = self.client.legaltech_db  # Our main database name
            
            # --- Create Collections ---
            # We create collections for each of our models
            # This is also where you can create indexes
            
            self.users = self.db.users
            self.users.create_index("email", unique=True)
            self.users.create_index("google_id", unique=True)

            self.documents = self.db.documents
            self.chat_history = self.db.chat_history

            print("✅ Database connection successful.")
        
        except pymongo.errors.ConnectionFailure as e:
            print(f"❌ Could not connect to MongoDB: {e}")
            self.client = None
            self.db = None

# Create a single instance of the Database
# We will import this 'db_client' instance in other files
db_client = Database(settings.DATABASE_URL)

# --- Helper functions to get the DB instance ---
# This is for FastAPI's "Dependency Injection" system
def get_db():
    return db_client.db

def get_db_client():
    return db_client