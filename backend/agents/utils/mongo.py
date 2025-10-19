import os
from typing import Optional

import pymongo
from dotenv import load_dotenv

# Initializing the connection of MongoDB

class ElderDB:
    """Database utility class for MongoDB used in Elderly-Connect Project"""
    def __init__(self, uri: Optional[str] = None, *, timeout_ms: int = 10_000):
        load_dotenv()
        self.uri = uri or os.getenv("MONGO_URI")
        if not self.uri:
            raise RuntimeError(
                "Missing MongoDB connection string. Set the MONGO_URI environment variable."
            )

        try:
            self.client = pymongo.MongoClient(
                self.uri, serverSelectionTimeoutMS=timeout_ms
            )
            # Trigger a lightweight command so connection issues surface immediately.
            self.client.admin.command("ping")
            print(f"Connected to ElderDB at {self.uri}")
        except Exception as exc:
            raise ConnectionError(f"Failed to connect to ElderDB at {self.uri}") from exc

    def connect_collection(self, db_name: str, collection_name: str):
        """Connects to MongoDB and returns the specified collection"""
        if not db_name:
            raise ValueError("db_name must be provided.")
        if not collection_name:
            raise ValueError("collection_name must be provided.")

        try:
            collection = self.client[db_name][collection_name]
            print(f"Successfully connected to {db_name}'s {collection_name} collection!")
            return collection
        except Exception as exc:
            raise RuntimeError(
                f"Unable to access collection '{collection_name}' in database '{db_name}'."
            ) from exc

    # Connection Cleanup
    def close_connection(self):
        """Close ElderDB connection"""
        self.client.close()
        print("MongoDB Connection Closed.")

