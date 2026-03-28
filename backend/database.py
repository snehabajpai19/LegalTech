# backend/database.py

import pymongo

from config import settings
from models.document import ChatMessage, Document
from models.user import User


class Database:
    def __init__(self, db_url):
        try:
            self.client = pymongo.MongoClient(db_url)
            self.client.admin.command("ping")
            default_db = self.client.get_default_database()
            self.db = default_db if default_db is not None else self.client.legaltech_db

            self.users = self.db.users
            self.users.create_index("email", unique=True)
            self.users.create_index("google_id", unique=True)

            self.documents = self.db.documents
            self.documents.create_index("user_id")
            self.chat_history = self.db.chat_history
            self.chat_history.create_index(
                [("user_id", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)]
            )
            self.document_templates = self.db.document_templates
            self.document_templates.create_index("name", unique=True)
            self.pii_mappings = self.db.pii_mappings
            self.pii_mappings.create_index("user_id")
            self.pii_mappings.create_index("expires_at", expireAfterSeconds=0)

            print("Database connection successful.")

        except pymongo.errors.PyMongoError as e:
            print(f"Could not connect to MongoDB: {e}")
            self.client = None
            self.db = None
            self.users = None
            self.documents = None
            self.chat_history = None
            self.document_templates = None
            self.pii_mappings = None


db_client = Database(settings.DATABASE_URL)


def get_db():
    return db_client.db


def get_db_client():
    return db_client
