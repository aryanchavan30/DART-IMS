#!/usr/bin/env python
"""
Quick API validation script for Attendance feature.
Run this after starting the Django server to validate all endpoints.

Usage:
    python test_attendance_apis.py --email intern@test.com --password yourpass
"""
import requests
import sys
import argparse
from datetime import datetime, timedelta

# Base URL
BASE_URL = "http://localhost:8000"

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


def print_success(msg):
    print(f"{GREEN}✓{RESET} {msg}")


def print_error(msg):
    print(f"{RED}✗{RESET} {msg}")


def print_info(msg):
    print(f"{BLUE}ℹ{RESET} {msg}")


def print_warning(msg):
    print(f"{YELLOW}⚠{RESET} {msg}")


class AttendanceAPITester:
    def __init__(self, email, password):
        self.email = email
        self.password = password
        self.token = None
        self.headers = {}
        self.results = {
            'passed': 0,
            'failed': 0,
            'total': 0
        }

    def login(self):
        """Get authentication token"""
        print_info("Logging in...")
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/login/",
                json={"email": self.email, "password": self.password}
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access')
                self.headers = {'Authorization': f'Bearer {self.token}'}
                print_success(f"Logged in as {self.email}")
                return True
            else:
                print_error(f"Login failed: {response.status_code}")
                print_error(response.text)
                return False
        except Exception as e:
            print_error(f"Login error: {e}")
            return False

    def test_endpoint(self, name, method, url, data=None, expected_status=200, description=""):
        """Test a single API endpoint"""
        self.results['total'] += 1
        print(f"\n{'='*60}")
        print(f"Test: {name}")
        if description:
            print(f"Description: {description}")
        print(f"Method: {method} {url}")

        try:
            if method == 'GET':
                response = requests.get(url, headers=self.headers)
            elif method == 'POST':
                response = requests.post(url, headers=self.headers, json=data)
            elif method == 'PATCH':
                response = requests.patch(url, headers=self.headers, json=data)
            elif method == 'DELETE':
                response = requests.delete(url, headers=self.headers)
            else:
                print_error(f"Unknown method: {method}")
                self.results['failed'] += 1
                return False

            print(f"Status: {response.status_code}")

            if response.status_code == expected_status:
                print_success(f"PASS - Got expected status {expected_status}")
                if response.text:
                    try:
                        data = response.json()
                        if isinstance(data, dict) and 'results' in data:
                            print_info(f"  Results count: {len(data['results'])}")
                        elif isinstance(data, list):
                            print_info(f"  Results count: {len(data)}")
                    except:
                        pass
                self.results['passed'] += 1
                return True
            else:
                print_error(f"FAIL - Expected {expected_status}, got {response.status_code}")
                print_error(f"Response: {response.text[:200]}")
                self.results['failed'] += 1
                return False
        except Exception as e:
            print_error(f"FAIL - Exception: {e}")
            self.results['failed'] += 1
            return False

    def run_all_tests(self):
        """Run all attendance API tests"""
        print("\n" + "="*60)
        print("ATTENDANCE API VALIDATION TEST SUITE")
        print("="*60)

        if not self.login():
            print_error("Cannot proceed without authentication")
            return False

        # Get current month
        today = datetime.now()
        month = today.strftime('%Y-%m')

        print_info(f"Testing for month: {month}")

        # ============ ATTENDANCE APIs ============
        print("\n" + "="*60)
        print("TESTING ATTENDANCE APIs")
        print("="*60)

        # API 1: List all attendance
        self.test_endpoint(
            "API 1: List All Attendance",
            "GET",
            f"{BASE_URL}/api/interns/attendance/",
            description="Get paginated list of attendance records"
        )

        # API 1b: List with filters
        self.test_endpoint(
            "API 1b: List Attendance with Month Filter",
            "GET",
            f"{BASE_URL}/api/interns/attendance/?month={month}",
            description="Filter attendance by month"
        )

        # API 2: Get my attendance
        self.test_endpoint(
            "API 2: Get My Attendance",
            "GET",
            f"{BASE_URL}/api/interns/attendance/my_attendance/",
            description="Get logged-in user's attendance records"
        )

        # API 2b: Get my attendance with month
        self.test_endpoint(
            "API 2b: Get My Attendance (with month)",
            "GET",
            f"{BASE_URL}/api/interns/attendance/my_attendance/?month={month}",
            description="Get own attendance for specific month"
        )

        # API 3: Mark today present
        print_warning("API 3 may fail if today is already marked")
        self.test_endpoint(
            "API 3: Mark Today Present",
            "POST",
            f"{BASE_URL}/api/interns/attendance/mark_today/",
            description="Quick mark present for today",
            expected_status=201  # May be 400 if already marked
        )

        # API 4: Create attendance (usually HR only)
        future_date = (today + timedelta(days=30)).strftime('%Y-%m-%d')
        print_warning("API 4 may fail if user is not HR/HOD")
        self.test_endpoint(
            "API 4: Create Attendance Record",
            "POST",
            f"{BASE_URL}/api/interns/attendance/",
            data={
                "date": future_date,
                "status": "Present",
                "notes": "API test"
            },
            expected_status=201,
            description="Create new attendance record"
        )

        # API 5: Update attendance status (HR only)
        print_warning("API 5 requires HR role and valid attendance ID")
        print_info("Skipping update test (requires existing attendance ID)")

        # ============ TICKET APIs ============
        print("\n" + "="*60)
        print("TESTING TICKET APIs")
        print("="*60)

        # API 6: List all tickets
        self.test_endpoint(
            "API 6: List All Tickets",
            "GET",
            f"{BASE_URL}/api/interns/attendance-tickets/",
            description="Get paginated list of tickets"
        )

        # API 7: Get my tickets
        self.test_endpoint(
            "API 7: Get My Tickets",
            "GET",
            f"{BASE_URL}/api/interns/attendance-tickets/my_tickets/",
            description="Get logged-in intern's tickets"
        )

        # API 8: Get pending tickets (HR only)
        print_warning("API 8 may fail if user is not HR/HOD")
        self.test_endpoint(
            "API 8: Get Pending Tickets",
            "GET",
            f"{BASE_URL}/api/interns/attendance-tickets/pending/",
            description="Get all pending tickets (HR only)",
            expected_status=200  # May be 403 for non-HR
        )

        # API 9: Create ticket
        print_warning("API 9 requires an absent attendance record")
        print_info("Skipping ticket creation (requires absent attendance ID)")

        # API 10: Review ticket (HR only)
        print_warning("API 10 requires HR role and pending ticket ID")
        print_info("Skipping ticket review (requires HR role and ticket ID)")

        # ============ RESULTS ============
        print("\n" + "="*60)
        print("TEST RESULTS")
        print("="*60)
        print(f"Total Tests: {self.results['total']}")
        print_success(f"Passed: {self.results['passed']}")
        print_error(f"Failed: {self.results['failed']}")

        success_rate = (self.results['passed'] / self.results['total'] * 100) if self.results['total'] > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")

        if self.results['failed'] == 0:
            print_success("\n🎉 ALL TESTS PASSED! 🎉")
            return True
        else:
            print_warning(f"\n⚠️  {self.results['failed']} tests failed")
            print_info("Some failures may be expected (e.g., permission errors for non-HR users)")
            return False


def main():
    parser = argparse.ArgumentParser(description='Test Attendance APIs')
    parser.add_argument('--email', required=True, help='User email for login')
    parser.add_argument('--password', required=True, help='User password')
    parser.add_argument('--url', default='http://localhost:8000', help='Base URL (default: http://localhost:8000)')

    args = parser.parse_args()

    global BASE_URL
    BASE_URL = args.url

    tester = AttendanceAPITester(args.email, args.password)
    success = tester.run_all_tests()

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
