from pymongo import MongoClient
from dotenv import load_dotenv
import os
import urllib.parse
load_dotenv()

mongodb_uri = os.getenv("MONGO_URI")
if not mongodb_uri:
    print("WARNING: MONGO_URI environment variable not set. Using default localhost URI.")
    mongodb_uri = "mongodb://localhost:27017/"

try:
    # Display connection info without credentials for debugging
    if "://" in mongodb_uri:
        protocol, rest = mongodb_uri.split("://", 1)
        if "@" in rest:
            auth, host_part = rest.split("@", 1)
            # Mask the password for security when printing
            if ":" in auth:
                username, _ = auth.split(":", 1)
                masked_uri = f"{protocol}://{username}:****@{host_part}"
            else:
                masked_uri = f"{protocol}://{auth}@{host_part}"
        else:
            masked_uri = mongodb_uri
        print(f"Connecting to MongoDB: {masked_uri}")
    
    # Connect to MongoDB
    client = MongoClient(mongodb_uri)
    db = client["login"]
    
    # Test connection
    client.admin.command('ping')
    print("Database connection successful")
except Exception as e:
    error_message = str(e)
    print(f"Database connection error: {error_message}")
    
    # Provide more specific error guidance
    if "auth failed" in error_message.lower() or "authentication failed" in error_message.lower():
        print("\nAuthentication Error Guidance:")
        print("1. Check that your username and password are correct")
        print("2. Ensure special characters in your password are URL encoded")
        print("3. Verify you have the correct database access permissions")
        print("4. For MongoDB Atlas: confirm IP whitelist includes your current IP address")
    
    # Set a default client and db to prevent crashes on import
    client = None
    db = None
#print(db['User'].find_one())