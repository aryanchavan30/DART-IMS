"""
Comprehensive tests for Attendance feature APIs and functionality.

Tests all 10 attendance endpoints for both Intern and HR roles.
"""
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import datetime, timedelta
from users.models import User
from interns.models import Intern, Attendance, AttendanceTicket
from departments.models import Department


class AttendanceAPITestCase(TestCase):
    """Test suite for Attendance APIs"""

    def setUp(self):
        """Set up test data"""
        # Create department
        self.department = Department.objects.create(
            id='dept_test',
            name='Test Department'
        )

        # Create HR user
        self.hr_user = User.objects.create_user(
            email='hr@test.com',
            password='testpass123',
            name='HR User',
            role=User.Role.HR
        )

        # Create Mentor user
        self.mentor_user = User.objects.create_user(
            email='mentor@test.com',
            password='testpass123',
            name='Mentor User',
            role=User.Role.MENTOR
        )

        # Create Intern user
        self.intern_user = User.objects.create_user(
            email='intern@test.com',
            password='testpass123',
            name='Intern User',
            role=User.Role.INTERN
        )

        # Create second intern user
        self.intern_user2 = User.objects.create_user(
            email='intern2@test.com',
            password='testpass123',
            name='Intern User 2',
            role=User.Role.INTERN
        )

        # Create candidate for first intern
        from candidates.models import Candidate
        self.candidate1 = Candidate.objects.create(
            id='cand_test_001',
            name='Test Candidate 1',
            email='candidate1@test.com',
            department=self.department,
            assigned_mentor=self.mentor_user,
            status='Selected'
        )

        # Create candidate for second intern
        self.candidate2 = Candidate.objects.create(
            id='cand_test_002',
            name='Test Candidate 2',
            email='candidate2@test.com',
            department=self.department,
            assigned_mentor=self.mentor_user,
            status='Selected'
        )

        # Create intern profile
        self.intern = Intern.objects.create(
            id='intern_test_001',
            user=self.intern_user,
            candidate=self.candidate1,
            mentor=self.mentor_user,
            status='Active',
            joining_date=timezone.now().date() - timedelta(days=30)
        )

        # Create second intern profile
        self.intern2 = Intern.objects.create(
            id='intern_test_002',
            user=self.intern_user2,
            candidate=self.candidate2,
            mentor=self.mentor_user,
            status='Active',
            joining_date=timezone.now().date() - timedelta(days=30)
        )

        # Create API clients
        self.intern_client = APIClient()
        self.hr_client = APIClient()
        self.mentor_client = APIClient()

        # Authenticate clients
        self.intern_client.force_authenticate(user=self.intern_user)
        self.hr_client.force_authenticate(user=self.hr_user)
        self.mentor_client.force_authenticate(user=self.mentor_user)

        # Create some test attendance records
        today = timezone.now().date()
        for i in range(5):
            date = today - timedelta(days=i)
            Attendance.objects.create(
                id=f'att_{self.intern.id}_{date}',
                intern=self.intern,
                date=date,
                status='Present' if i % 2 == 0 else 'Absent',
                marked_by=self.hr_user
            )

    # ========== API 1: GET /api/interns/attendance/ ==========
    def test_get_attendance_as_hr(self):
        """Test HR can view all attendance records"""
        response = self.hr_client.get('/api/interns/attendance/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertGreater(len(response.data['results']), 0)

    def test_get_attendance_with_intern_filter(self):
        """Test filtering attendance by intern_id"""
        response = self.hr_client.get(
            f'/api/interns/attendance/?intern_id={self.intern.id}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # All results should belong to the specified intern
        for record in response.data['results']:
            self.assertEqual(record['intern_id'], self.intern.id)

    def test_get_attendance_with_month_filter(self):
        """Test filtering attendance by month"""
        month = timezone.now().strftime('%Y-%m')
        response = self.hr_client.get(
            f'/api/interns/attendance/?month={month}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_intern_cannot_view_all_attendance(self):
        """Test intern cannot access general attendance endpoint"""
        response = self.intern_client.get('/api/interns/attendance/')
        # Should only see their own records
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for record in response.data['results']:
            self.assertEqual(record['intern_id'], self.intern.id)

    # ========== API 2: GET /api/interns/attendance/my_attendance/ ==========
    def test_get_my_attendance_as_intern(self):
        """Test intern can view their own attendance"""
        response = self.intern_client.get('/api/interns/attendance/my_attendance/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        # Verify all records belong to this intern
        for record in response.data:
            self.assertEqual(record['intern_id'], self.intern.id)

    def test_get_my_attendance_with_month_filter(self):
        """Test filtering own attendance by month"""
        month = timezone.now().strftime('%Y-%m')
        response = self.intern_client.get(
            f'/api/interns/attendance/my_attendance/?month={month}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_hr_cannot_use_my_attendance_endpoint(self):
        """Test HR user gets empty result on my_attendance (no intern profile)"""
        response = self.hr_client.get('/api/interns/attendance/my_attendance/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # HR has no intern profile, should get empty list
        self.assertEqual(response.data, [])

    # ========== API 3: POST /api/interns/attendance/mark_today/ ==========
    def test_mark_today_as_intern(self):
        """Test intern can mark today as present"""
        # Delete today's record if exists
        today = timezone.now().date()
        Attendance.objects.filter(intern=self.intern, date=today).delete()

        response = self.intern_client.post('/api/interns/attendance/mark_today/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'Present')
        self.assertEqual(response.data['date'], str(today))

        # Verify record was created
        attendance = Attendance.objects.get(intern=self.intern, date=today)
        self.assertEqual(attendance.status, 'Present')

    def test_mark_today_already_marked(self):
        """Test marking today when already marked"""
        today = timezone.now().date()
        # Ensure today is already marked
        Attendance.objects.get_or_create(
            intern=self.intern,
            date=today,
            defaults={'status': 'Present', 'marked_by': self.intern_user}
        )

        response = self.intern_client.post('/api/interns/attendance/mark_today/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_hr_cannot_mark_today(self):
        """Test HR cannot use mark_today (no intern profile)"""
        response = self.hr_client.post('/api/interns/attendance/mark_today/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ========== API 4: POST /api/interns/attendance/ ==========
    def test_create_attendance_as_hr(self):
        """Test HR can create attendance record"""
        future_date = timezone.now().date() + timedelta(days=10)
        data = {
            'intern_id': self.intern.id,
            'date': str(future_date),
            'status': 'Present',
            'notes': 'Marked by HR'
        }
        response = self.hr_client.post('/api/interns/attendance/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'Present')

        # Verify record was created
        attendance = Attendance.objects.get(intern=self.intern, date=future_date)
        self.assertEqual(attendance.status, 'Present')
        self.assertEqual(attendance.marked_by, self.hr_user)

    def test_intern_cannot_create_attendance_for_others(self):
        """Test intern cannot create attendance for other interns"""
        future_date = timezone.now().date() + timedelta(days=10)
        data = {
            'intern_id': self.intern2.id,  # Different intern
            'date': str(future_date),
            'status': 'Present'
        }
        response = self.intern_client.post('/api/interns/attendance/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ========== API 5: PATCH /api/interns/attendance/{id}/update_status/ ==========
    def test_update_attendance_status_as_hr(self):
        """Test HR can update attendance status"""
        attendance = Attendance.objects.filter(intern=self.intern).first()
        data = {
            'status': 'Half Day',
            'notes': 'Updated by HR'
        }
        response = self.hr_client.patch(
            f'/api/interns/attendance/{attendance.id}/update_status/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'Half Day')

        # Verify update
        attendance.refresh_from_db()
        self.assertEqual(attendance.status, 'Half Day')
        self.assertEqual(attendance.notes, 'Updated by HR')

    def test_intern_cannot_update_attendance(self):
        """Test intern cannot use update_status endpoint"""
        attendance = Attendance.objects.filter(intern=self.intern).first()
        data = {'status': 'Present'}
        response = self.intern_client.patch(
            f'/api/interns/attendance/{attendance.id}/update_status/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ========== API 6: GET /api/interns/attendance-tickets/ ==========
    def test_get_attendance_tickets_as_hr(self):
        """Test HR can view all tickets"""
        # Create test ticket
        attendance = Attendance.objects.filter(intern=self.intern, status='Absent').first()
        AttendanceTicket.objects.create(
            id=f'ticket_test_001',
            attendance=attendance,
            intern=self.intern,
            reason='Wrong marking',
            requested_status='Present',
            created_by=self.intern_user
        )

        response = self.hr_client.get('/api/interns/attendance-tickets/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_get_tickets_with_intern_filter(self):
        """Test filtering tickets by intern_id"""
        response = self.hr_client.get(
            f'/api/interns/attendance-tickets/?intern_id={self.intern.id}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ========== API 7: GET /api/interns/attendance-tickets/my_tickets/ ==========
    def test_get_my_tickets_as_intern(self):
        """Test intern can view their own tickets"""
        # Create ticket for this intern
        attendance = Attendance.objects.filter(intern=self.intern, status='Absent').first()
        AttendanceTicket.objects.create(
            id=f'ticket_test_002',
            attendance=attendance,
            intern=self.intern,
            reason='I was present',
            requested_status='Present',
            created_by=self.intern_user
        )

        response = self.intern_client.get('/api/interns/attendance-tickets/my_tickets/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        # All tickets should belong to this intern
        for ticket in response.data:
            self.assertEqual(ticket['intern_id'], self.intern.id)

    # ========== API 8: GET /api/interns/attendance-tickets/pending/ ==========
    def test_get_pending_tickets_as_hr(self):
        """Test HR can view pending tickets"""
        # Create pending ticket
        attendance = Attendance.objects.filter(intern=self.intern, status='Absent').first()
        AttendanceTicket.objects.create(
            id=f'ticket_test_003',
            attendance=attendance,
            intern=self.intern,
            reason='Incorrect marking',
            requested_status='Present',
            status='Pending',
            created_by=self.intern_user
        )

        response = self.hr_client.get('/api/interns/attendance-tickets/pending/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        # All tickets should be pending
        for ticket in response.data:
            self.assertEqual(ticket['status'], 'Pending')

    def test_intern_cannot_access_pending_tickets(self):
        """Test intern cannot access pending tickets endpoint"""
        response = self.intern_client.get('/api/interns/attendance-tickets/pending/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ========== API 9: POST /api/interns/attendance-tickets/ ==========
    def test_create_ticket_as_intern(self):
        """Test intern can create correction ticket"""
        # Get an absent attendance record
        attendance = Attendance.objects.filter(intern=self.intern, status='Absent').first()

        data = {
            'attendance_id': attendance.id,
            'reason': 'I was actually present that day',
            'requested_status': 'Present'
        }
        response = self.intern_client.post(
            '/api/interns/attendance-tickets/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'Pending')

        # Verify ticket was created
        ticket = AttendanceTicket.objects.get(id=response.data['id'])
        self.assertEqual(ticket.intern, self.intern)
        self.assertEqual(ticket.reason, data['reason'])

    def test_create_ticket_for_present_attendance(self):
        """Test cannot create ticket for already present attendance"""
        attendance = Attendance.objects.filter(intern=self.intern, status='Present').first()

        data = {
            'attendance_id': attendance.id,
            'reason': 'Test',
            'requested_status': 'Absent'
        }
        response = self.intern_client.post(
            '/api/interns/attendance-tickets/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_ticket(self):
        """Test cannot create duplicate ticket for same attendance"""
        attendance = Attendance.objects.filter(intern=self.intern, status='Absent').first()

        # Create first ticket
        AttendanceTicket.objects.create(
            id=f'ticket_dup_test',
            attendance=attendance,
            intern=self.intern,
            reason='First ticket',
            requested_status='Present',
            created_by=self.intern_user
        )

        # Try to create second ticket
        data = {
            'attendance_id': attendance.id,
            'reason': 'Second ticket',
            'requested_status': 'Present'
        }
        response = self.intern_client.post(
            '/api/interns/attendance-tickets/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ========== API 10: POST /api/interns/attendance-tickets/{id}/review/ ==========
    def test_approve_ticket_as_hr(self):
        """Test HR can approve ticket and attendance is updated"""
        # Create pending ticket
        attendance = Attendance.objects.filter(intern=self.intern, status='Absent').first()
        ticket = AttendanceTicket.objects.create(
            id=f'ticket_approve_test',
            attendance=attendance,
            intern=self.intern,
            reason='Wrong marking',
            requested_status='Present',
            status='Pending',
            created_by=self.intern_user
        )

        data = {
            'approved': True,
            'comments': 'Approved by HR'
        }
        response = self.hr_client.post(
            f'/api/interns/attendance-tickets/{ticket.id}/review/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify ticket was approved
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, 'Approved')
        self.assertEqual(ticket.review_comments, 'Approved by HR')

        # Verify attendance was updated
        attendance.refresh_from_db()
        self.assertEqual(attendance.status, 'Present')

    def test_reject_ticket_as_hr(self):
        """Test HR can reject ticket and attendance remains unchanged"""
        attendance = Attendance.objects.filter(intern=self.intern, status='Absent').first()
        original_status = attendance.status

        ticket = AttendanceTicket.objects.create(
            id=f'ticket_reject_test',
            attendance=attendance,
            intern=self.intern,
            reason='Wrong marking',
            requested_status='Present',
            status='Pending',
            created_by=self.intern_user
        )

        data = {
            'approved': False,
            'comments': 'Rejected - insufficient proof'
        }
        response = self.hr_client.post(
            f'/api/interns/attendance-tickets/{ticket.id}/review/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify ticket was rejected
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, 'Rejected')
        self.assertEqual(ticket.review_comments, 'Rejected - insufficient proof')

        # Verify attendance was NOT updated
        attendance.refresh_from_db()
        self.assertEqual(attendance.status, original_status)

    def test_intern_cannot_review_ticket(self):
        """Test intern cannot review tickets"""
        attendance = Attendance.objects.filter(intern=self.intern, status='Absent').first()
        ticket = AttendanceTicket.objects.create(
            id=f'ticket_intern_review_test',
            attendance=attendance,
            intern=self.intern,
            reason='Test',
            requested_status='Present',
            created_by=self.intern_user
        )

        data = {'approved': True}
        response = self.intern_client.post(
            f'/api/interns/attendance-tickets/{ticket.id}/review/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_review_already_reviewed_ticket(self):
        """Test cannot review already reviewed ticket"""
        attendance = Attendance.objects.filter(intern=self.intern, status='Absent').first()
        ticket = AttendanceTicket.objects.create(
            id=f'ticket_already_reviewed',
            attendance=attendance,
            intern=self.intern,
            reason='Test',
            requested_status='Present',
            status='Approved',  # Already approved
            created_by=self.intern_user,
            reviewed_by=self.hr_user
        )

        data = {'approved': False}
        response = self.hr_client.post(
            f'/api/interns/attendance-tickets/{ticket.id}/review/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AttendanceBusinessLogicTestCase(TestCase):
    """Test business logic and edge cases"""

    def setUp(self):
        """Set up test data"""
        self.department = Department.objects.create(
            id='dept_logic',
            name='Logic Dept'
        )

        self.hr_user = User.objects.create_user(
            email='hr.logic@test.com',
            password='testpass123',
            name='HR Logic',
            role=User.Role.HR
        )

        self.intern_user = User.objects.create_user(
            email='intern.logic@test.com',
            password='testpass123',
            name='Intern Logic',
            role=User.Role.INTERN
        )

        # Create candidate for intern
        from candidates.models import Candidate
        self.candidate = Candidate.objects.create(
            id='cand_logic_001',
            name='Logic Candidate',
            email='candidate.logic@test.com',
            department=self.department,
            status='Selected'
        )

        self.intern = Intern.objects.create(
            id='intern_logic_001',
            user=self.intern_user,
            candidate=self.candidate,
            status='Active',
            joining_date=timezone.now().date()
        )

        self.intern_client = APIClient()
        self.hr_client = APIClient()
        self.intern_client.force_authenticate(user=self.intern_user)
        self.hr_client.force_authenticate(user=self.hr_user)

    def test_unique_attendance_per_day(self):
        """Test only one attendance record per intern per day"""
        today = timezone.now().date()

        # Create first attendance
        att1 = Attendance.objects.create(
            id=f'att_unique_1',
            intern=self.intern,
            date=today,
            status='Present'
        )

        # Try to create duplicate
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Attendance.objects.create(
                id=f'att_unique_2',
                intern=self.intern,
                date=today,
                status='Absent'
            )

    def test_attendance_id_generation(self):
        """Test attendance ID is auto-generated correctly"""
        today = timezone.now().date()
        data = {
            'intern_id': self.intern.id,
            'date': str(today),
            'status': 'Present'
        }
        response = self.hr_client.post('/api/interns/attendance/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify ID format contains timestamp
        self.assertIn('att_', response.data['id'])

    def test_has_pending_ticket_field(self):
        """Test has_pending_ticket computed field"""
        # Create attendance with absent status
        attendance = Attendance.objects.create(
            id='att_pending_test',
            intern=self.intern,
            date=timezone.now().date() - timedelta(days=1),
            status='Absent'
        )

        # Get attendance via API
        response = self.intern_client.get('/api/interns/attendance/my_attendance/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Initially no ticket
        record = next(r for r in response.data if r['id'] == attendance.id)
        self.assertFalse(record['has_pending_ticket'])

        # Create pending ticket
        AttendanceTicket.objects.create(
            id='ticket_pending_field',
            attendance=attendance,
            intern=self.intern,
            reason='Test',
            requested_status='Present',
            status='Pending',
            created_by=self.intern_user
        )

        # Check again
        response = self.intern_client.get('/api/interns/attendance/my_attendance/')
        record = next(r for r in response.data if r['id'] == attendance.id)
        self.assertTrue(record['has_pending_ticket'])


# Run tests with: python manage.py test interns.tests.test_attendance
