#!/usr/bin/env python3

import requests
import json

# Test script to check notifications API
BASE_URL = "http://localhost:8000"

def test_notifications():
    """Test notifications endpoint"""
    
    # First, need to login to get token
    login_data = {
        "username": "testuser", 
        "password": "password123"
    }
    
    try:
        # Login
        login_response = requests.post(f"{BASE_URL}/login", json=login_data)
        print(f"Login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            access_token = token_data["access_token"]
            
            # Test notifications
            headers = {"Authorization": f"Bearer {access_token}"}
            notifications_response = requests.get(f"{BASE_URL}/notifications", headers=headers)
            
            print(f"Notifications status: {notifications_response.status_code}")
            if notifications_response.status_code == 200:
                notifications = notifications_response.json()
                print(f"Number of notifications: {len(notifications)}")
                
                if notifications:
                    # Check first notification format
                    first_notification = notifications[0]
                    print(f"First notification: {json.dumps(first_notification, indent=2)}")
                    
                    # Check if created_at is properly formatted
                    if 'created_at' in first_notification:
                        print(f"created_at format: {type(first_notification['created_at'])} - {first_notification['created_at']}")
                    else:
                        print("No created_at field found")
                else:
                    print("No notifications found")
            else:
                print(f"Error getting notifications: {notifications_response.text}")
        else:
            print(f"Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_notifications() 