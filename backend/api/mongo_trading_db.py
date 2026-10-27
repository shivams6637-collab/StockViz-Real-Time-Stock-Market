import os
from pymongo import MongoClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client["stockviz_db"]
