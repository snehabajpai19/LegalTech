# backend/database.py

import pymongo

from config import settings
from models.document import ChatMessage, Document
from models.user import User


class Database:
    def __init__(self, db_url):
        try:
            self.client = pymongo.MongoClient(db_url)
            self.db = self.client.legaltech_db

            self.users = self.db.users
            self.users.create_index("email", unique=True)
            self.users.create_index("google_id", unique=True)

            self.documents = self.db.documents
            self.chat_history = self.db.chat_history
            self.document_templates = self.db.document_templates
            self.document_templates.create_index("name", unique=True)
            self.pii_mappings = self.db.pii_mappings

            print("Database connection successful.")

        except pymongo.errors.ConnectionFailure as e:
            print(f"Could not connect to MongoDB: {e}")
            self.client = None
            self.db = None


db_client = Database(settings.DATABASE_URL)


def get_db():
    return db_client.db


def get_db_client():
    return db_client
