
import os
from pymongo import MongoClient, ASCENDING

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client["stockviz_db"]


def initialize_database():
    client.admin.command("ping")

    db["users"].create_index("email", unique=True)
    db["orders"].create_index([("account_id", ASCENDING)])
    db["holdings"].create_index(
        [("account_id", ASCENDING), ("symbol", ASCENDING)],
        unique=True
    )
    db["positions"].create_index([("account_id", ASCENDING)])
    db["funds"].create_index([("account_id", ASCENDING)], unique=True)

    print("MongoDB connected successfully!")
    print("Database:", db.name)
    print("Collections ready: users, orders, holdings, positions, funds")


if __name__ == "__main__":
    initialize_database()
