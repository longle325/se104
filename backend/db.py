from pymongo import MongoClient
from dotenv import load_dotenv
import os
load_dotenv()

mongodb_uri = os.getenv("MONGO_URI")
port = 8000
client = MongoClient(mongodb_uri, port)
db = client["chande"]