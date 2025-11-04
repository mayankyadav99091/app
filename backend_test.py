#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import base64

class CampusCatalystAPITester:
    def __init__(self, base_url="https://iiit-companion-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.student_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append({"test": name, "error": details})

    def test_login(self, email, expected_role):
        """Test login functionality"""
        try:
            response = requests.post(f"{self.api_url}/auth/login", json={"email": email})
            
            if response.status_code == 200:
                data = response.json()
                if data.get('role') == expected_role and 'token' in data:
                    if expected_role == 'admin':
                        self.admin_token = data['token']
                    else:
                        self.student_token = data['token']
                    self.log_test(f"Login {email} ({expected_role})", True)
                    return True
                else:
                    self.log_test(f"Login {email}", False, f"Invalid role or missing token: {data}")
            else:
                self.log_test(f"Login {email}", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test(f"Login {email}", False, str(e))
        return False

    def test_mess_menu(self):
        """Test mess menu endpoint"""
        try:
            response = requests.get(f"{self.api_url}/mess/menu")
            if response.status_code == 200:
                data = response.json()
                required_fields = ['date', 'breakfast', 'lunch', 'snacks', 'dinner']
                if all(field in data for field in required_fields):
                    self.log_test("Mess Menu API", True)
                    return True
                else:
                    self.log_test("Mess Menu API", False, f"Missing fields in response: {data}")
            else:
                self.log_test("Mess Menu API", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Mess Menu API", False, str(e))
        return False

    def test_mess_feedback(self):
        """Test mess feedback submission"""
        if not self.student_token:
            self.log_test("Mess Feedback API", False, "No student token available")
            return False
        
        try:
            headers = {'Authorization': f'Bearer {self.student_token}'}
            feedback_data = {
                "meal_type": "lunch",
                "rating": 4,
                "comment": "Good food quality"
            }
            response = requests.post(f"{self.api_url}/mess/feedback", json=feedback_data, headers=headers)
            
            if response.status_code == 200:
                self.log_test("Mess Feedback API", True)
                return True
            else:
                self.log_test("Mess Feedback API", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Mess Feedback API", False, str(e))
        return False

    def test_mess_ratings(self):
        """Test mess ratings endpoint"""
        try:
            response = requests.get(f"{self.api_url}/mess/ratings")
            if response.status_code == 200:
                data = response.json()
                meal_types = ['breakfast', 'lunch', 'snacks', 'dinner']
                if all(meal in data for meal in meal_types):
                    self.log_test("Mess Ratings API", True)
                    return True
                else:
                    self.log_test("Mess Ratings API", False, f"Missing meal types: {data}")
            else:
                self.log_test("Mess Ratings API", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Mess Ratings API", False, str(e))
        return False

    def test_sports_equipment(self):
        """Test sports equipment listing"""
        try:
            response = requests.get(f"{self.api_url}/sports/equipment")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Sports Equipment API", True)
                    return data
                else:
                    self.log_test("Sports Equipment API", False, "Response is not a list")
            else:
                self.log_test("Sports Equipment API", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Sports Equipment API", False, str(e))
        return []

    def test_sports_booking(self, equipment_list):
        """Test sports equipment booking"""
        if not self.student_token or not equipment_list:
            self.log_test("Sports Booking API", False, "No token or equipment available")
            return False
        
        # Find available equipment
        available_equipment = [eq for eq in equipment_list if eq.get('status') == 'Available']
        if not available_equipment:
            self.log_test("Sports Booking API", False, "No available equipment to book")
            return False
        
        try:
            headers = {'Authorization': f'Bearer {self.student_token}'}
            equipment_id = available_equipment[0]['id']
            booking_data = {"equipment_id": equipment_id}
            
            response = requests.post(f"{self.api_url}/sports/book", json=booking_data, headers=headers)
            
            if response.status_code == 200:
                self.log_test("Sports Booking API", True)
                return True
            else:
                self.log_test("Sports Booking API", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Sports Booking API", False, str(e))
        return False

    def test_lost_found_items(self):
        """Test lost and found items listing"""
        try:
            response = requests.get(f"{self.api_url}/lost-found/items")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Lost & Found Items API", True)
                    return True
                else:
                    self.log_test("Lost & Found Items API", False, "Response is not a list")
            else:
                self.log_test("Lost & Found Items API", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Lost & Found Items API", False, str(e))
        return False

    def test_lost_found_post(self):
        """Test posting lost/found item"""
        if not self.student_token:
            self.log_test("Lost & Found Post API", False, "No student token available")
            return False
        
        try:
            headers = {'Authorization': f'Bearer {self.student_token}'}
            item_data = {
                "type": "lost",
                "item_name": "Test Water Bottle",
                "description": "Blue water bottle with IIIT logo",
                "location": "Library",
                "contact_name": "Test Student"
            }
            
            response = requests.post(f"{self.api_url}/lost-found/item", json=item_data, headers=headers)
            
            if response.status_code == 200:
                self.log_test("Lost & Found Post API", True)
                return True
            else:
                self.log_test("Lost & Found Post API", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Lost & Found Post API", False, str(e))
        return False

    def test_complaints_list(self):
        """Test complaints listing"""
        try:
            response = requests.get(f"{self.api_url}/complaints")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Complaints List API", True)
                    return data
                else:
                    self.log_test("Complaints List API", False, "Response is not a list")
            else:
                self.log_test("Complaints List API", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Complaints List API", False, str(e))
        return []

    def test_complaints_post(self):
        """Test posting complaint"""
        if not self.student_token:
            self.log_test("Complaints Post API", False, "No student token available")
            return False
        
        try:
            headers = {'Authorization': f'Bearer {self.student_token}'}
            complaint_data = {
                "title": "Test Complaint",
                "description": "This is a test complaint for waste management",
                "location": "Academic Block A",
                "category": "waste"
            }
            
            response = requests.post(f"{self.api_url}/complaints", json=complaint_data, headers=headers)
            
            if response.status_code == 200:
                self.log_test("Complaints Post API", True)
                return response.json().get('id')
            else:
                self.log_test("Complaints Post API", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Complaints Post API", False, str(e))
        return None

    def test_admin_complaint_update(self, complaint_id):
        """Test admin complaint status update"""
        if not self.admin_token or not complaint_id:
            self.log_test("Admin Complaint Update API", False, "No admin token or complaint ID")
            return False
        
        try:
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            update_data = {"status": "In Progress"}
            
            response = requests.put(f"{self.api_url}/complaints/{complaint_id}/status", 
                                  json=update_data, headers=headers)
            
            if response.status_code == 200:
                self.log_test("Admin Complaint Update API", True)
                return True
            else:
                self.log_test("Admin Complaint Update API", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Admin Complaint Update API", False, str(e))
        return False

    def test_admin_equipment_update(self, equipment_list):
        """Test admin equipment status update"""
        if not self.admin_token or not equipment_list:
            self.log_test("Admin Equipment Update API", False, "No admin token or equipment")
            return False
        
        try:
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            equipment_id = equipment_list[0]['id']
            update_data = {"status": "Under Maintenance"}
            
            response = requests.put(f"{self.api_url}/sports/equipment/{equipment_id}/status", 
                                  json=update_data, headers=headers)
            
            if response.status_code == 200:
                self.log_test("Admin Equipment Update API", True)
                return True
            else:
                self.log_test("Admin Equipment Update API", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Admin Equipment Update API", False, str(e))
        return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Campus Catalyst API Tests")
        print("=" * 50)
        
        # Test Authentication
        print("\n📋 Testing Authentication...")
        student_login = self.test_login("student@iiitd.ac.in", "student")
        admin_login = self.test_login("admin@iiitd.ac.in", "admin")
        
        # Test Mess Management
        print("\n🍽️ Testing Mess Management...")
        self.test_mess_menu()
        if student_login:
            self.test_mess_feedback()
        self.test_mess_ratings()
        
        # Test Sports Equipment
        print("\n🏃 Testing Sports Equipment...")
        equipment_list = self.test_sports_equipment()
        if student_login and equipment_list:
            self.test_sports_booking(equipment_list)
        
        # Test Lost & Found
        print("\n📦 Testing Lost & Found...")
        self.test_lost_found_items()
        if student_login:
            self.test_lost_found_post()
        
        # Test Complaints
        print("\n📝 Testing Complaints...")
        complaints_list = self.test_complaints_list()
        complaint_id = None
        if student_login:
            complaint_id = self.test_complaints_post()
        
        # Test Admin Functions
        print("\n👑 Testing Admin Functions...")
        if admin_login and complaint_id:
            self.test_admin_complaint_update(complaint_id)
        if admin_login and equipment_list:
            self.test_admin_equipment_update(equipment_list)
        
        # Print Results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = CampusCatalystAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())