# Attendance Feature - Complete Testing Guide

## Prerequisites

Before testing, ensure:
1. ✅ Database migration completed: `python manage.py migrate`
2. ✅ Backend server running: `python manage.py runserver`
3. ✅ Frontend server running: `npm run dev`
4. ✅ Test users created (Intern and HR roles)

---

## Quick Start: Run Automated Tests

```bash
# Run all attendance tests
cd Backend
python manage.py test interns.tests.test_attendance

# Run specific test class
python manage.py test interns.tests.test_attendance.AttendanceAPITestCase

# Run with verbose output
python manage.py test interns.tests.test_attendance --verbosity=2

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test interns.tests.test_attendance
coverage report
```

**Expected Result**: All 40+ tests should PASS ✅

---

## Manual Testing Guide

### Setup Test Data

First, create test users if you haven't already:

```bash
python manage.py createsuperuser
# Then login to Django admin: http://localhost:8000/admin
# Create:
# - 1 HR user (role=HR)
# - 2-3 Intern users (role=INTERN)
# - Intern profiles for each intern user
```

---

## PART 1: INTERN FUNCTIONALITY TESTING

### Test 1: View Monthly Attendance Calendar 📅

**Steps:**
1. Login as an **Intern** user
2. Navigate to **"My Attendance"** page
3. Observe the monthly calendar

**Expected Results:**
- ✅ Calendar displays current month
- ✅ Each day shows attendance status with color coding:
  - 🟢 **Green** = Present
  - 🔴 **Red** = Absent
  - 🟡 **Yellow** = Half Day
  - 🔵 **Blue** = Holiday/Week Off
  - ⚪ **Gray** = Not yet marked
- ✅ Previous/Next month navigation buttons work
- ✅ Today's date is highlighted
- ✅ Can see attendance for any month

**API Used:** `GET /api/interns/attendance/my_attendance/?month=YYYY-MM`

**Verify in Browser Console:**
```javascript
// Should see 200 response with attendance array
// Network tab: GET /api/interns/attendance/my_attendance/?month=2025-11
```

---

### Test 2: Mark Today as Present ✅

**Steps:**
1. As Intern, on **"My Attendance"** page
2. Locate the **"Mark Present"** button (should be visible if today not marked)
3. Click the button

**Expected Results:**
- ✅ Success toast message appears: "Attendance marked successfully"
- ✅ Today's date changes to **Green (Present)**
- ✅ Button disappears or shows "Already marked"
- ✅ Calendar refreshes automatically

**API Used:** `POST /api/interns/attendance/mark_today/`

**Test Edge Cases:**
- Try clicking button twice → Should show error "Already marked for today"
- Refresh page → Should still show Present
- Check different months → Only current month's today should be marked

---

### Test 3: Raise Correction Ticket 🎫

**Steps:**
1. As Intern, on **"My Attendance"** page
2. Find a day marked as **Absent** (red)
3. Click on the absent date
4. Modal should open: "Raise Attendance Correction Ticket"
5. Fill in:
   - **Reason:** "I was present but attendance not marked"
   - **Requested Status:** "Present"
6. Click **"Submit Ticket"**

**Expected Results:**
- ✅ Success message: "Ticket raised successfully"
- ✅ Modal closes
- ✅ That date now shows a **yellow warning icon** (has pending ticket)
- ✅ Ticket appears in "My Tickets" section below calendar

**API Used:** `POST /api/interns/attendance-tickets/`

**Request Body:**
```json
{
  "attendance_id": "att_...",
  "reason": "I was present but attendance not marked",
  "requested_status": "Present"
}
```

**Test Edge Cases:**
- Try raising ticket for **Present** day → Should show error
- Try raising 2nd ticket for same day → Should show error "Ticket already exists"
- Click on date with pending ticket → Should show ticket status

---

### Test 4: View Raised Tickets 📋

**Steps:**
1. As Intern, scroll down on **"My Attendance"** page
2. View **"My Tickets"** section

**Expected Results:**
- ✅ All raised tickets are displayed in a table
- ✅ Each ticket shows:
  - Date
  - Current status (Absent)
  - Requested status (Present)
  - Reason
  - Status badge (Pending/Approved/Rejected)
  - Submission date
- ✅ Tickets are sorted by newest first
- ✅ Can see status colors:
  - 🟡 **Yellow** = Pending
  - 🟢 **Green** = Approved
  - 🔴 **Red** = Rejected

**API Used:** `GET /api/interns/attendance-tickets/my_tickets/`

**Verify:**
- Refresh page → Tickets still show
- Raise new ticket → Appears at top immediately

---

## PART 2: HR FUNCTIONALITY TESTING

### Test 5: Navigate to Intern Attendance Page 👥

**Steps:**
1. Login as **HR** user
2. In sidebar, click **"Intern Attendance"**

**Expected Results:**
- ✅ Page loads successfully
- ✅ Shows dropdown: "Select Intern"
- ✅ Shows pending tickets panel on right
- ✅ Calendar area is empty (no intern selected)

---

### Test 6: Select Intern and View Attendance 🔍

**Steps:**
1. As HR, on **"Intern Attendance"** page
2. Click **"Select Intern"** dropdown
3. Select an intern from the list

**Expected Results:**
- ✅ Dropdown shows list of **active interns only**
- ✅ After selection, calendar loads for that intern
- ✅ Shows intern's monthly attendance
- ✅ Can navigate months using arrows
- ✅ Attendance colors match intern's records

**API Used:**
- `GET /api/interns/` - Get list of interns
- `GET /api/interns/attendance/?intern_id=XXX&month=YYYY-MM` - Get attendance

**Test Different Scenarios:**
- Select different interns → Calendar updates
- Navigate months → Shows correct data
- Intern with no attendance → Shows empty calendar

---

### Test 7: Modify Attendance Directly ✏️

**Steps:**
1. As HR, with an intern selected
2. Click on any **Absent** (red) date in the calendar
3. Modal opens: "Edit Attendance"
4. Change **Status** from "Absent" to "Present"
5. Add **Notes**: "Marked present by HR"
6. Click **"Update"**

**Expected Results:**
- ✅ Success message: "Attendance updated"
- ✅ Modal closes
- ✅ Date changes from **Red to Green**
- ✅ Calendar refreshes automatically
- ✅ If there was a pending ticket for this date, ticket should still exist

**API Used:** `PATCH /api/interns/attendance/{id}/update_status/`

**Request Body:**
```json
{
  "status": "Present",
  "notes": "Marked present by HR"
}
```

**Test All Statuses:**
- Change to "Half Day" → Shows yellow
- Change to "Holiday" → Shows blue
- Change to "Week Off" → Shows blue
- Add long notes → Should save correctly

---

### Test 8: Create New Attendance Record 📝

**Steps:**
1. As HR, with intern selected
2. Click on a date with **no attendance** (gray/white)
3. Modal opens: "Mark Attendance"
4. Select **Status**: "Present"
5. Add **Notes**: "Late marking by HR"
6. Click **"Mark Attendance"**

**Expected Results:**
- ✅ Success message: "Attendance marked"
- ✅ Date now shows selected status color
- ✅ New record created in database

**API Used:** `POST /api/interns/attendance/`

**Request Body:**
```json
{
  "intern_id": "intern_xxx",
  "date": "2025-11-19",
  "status": "Present",
  "notes": "Late marking by HR"
}
```

---

### Test 9: View All Pending Tickets 📨

**Steps:**
1. As HR, on **"Intern Attendance"** page
2. Look at **"Pending Tickets"** panel on the right side

**Expected Results:**
- ✅ Shows all pending tickets from **all interns**
- ✅ Each ticket displays:
  - Intern name
  - Date
  - Current status
  - Requested status
  - Reason
  - Submission date
- ✅ Sorted by newest first
- ✅ **No approved or rejected tickets shown**

**API Used:** `GET /api/interns/attendance-tickets/pending/`

**Verify:**
- Create ticket as intern → Appears immediately in HR panel
- Approve ticket → Disappears from pending panel

---

### Test 10: Approve Correction Ticket ✅

**Steps:**
1. As HR, in **"Pending Tickets"** panel
2. Click on a pending ticket
3. Modal opens: "Review Ticket"
4. Review the ticket details
5. Add **Comments**: "Approved - verified with records"
6. Click **"Approve"** button

**Expected Results:**
- ✅ Success message: "Ticket approved"
- ✅ Ticket disappears from pending panel
- ✅ **Attendance automatically updated** to requested status
- ✅ Calendar shows updated attendance
- ✅ Intern sees ticket status as "Approved" with HR comments

**API Used:** `POST /api/interns/attendance-tickets/{id}/review/`

**Request Body:**
```json
{
  "approved": true,
  "comments": "Approved - verified with records"
}
```

**Critical Test:**
- Verify attendance record actually changed in database
- Check intern's view → Should see green status now
- Ticket status should be "Approved" not "Pending"

---

### Test 11: Reject Correction Ticket ❌

**Steps:**
1. As HR, click on another pending ticket
2. Add **Comments**: "Rejected - no proof provided"
3. Click **"Reject"** button

**Expected Results:**
- ✅ Success message: "Ticket rejected"
- ✅ Ticket disappears from pending panel
- ✅ **Attendance remains unchanged** (still Absent)
- ✅ Intern sees ticket as "Rejected" with HR comments

**API Used:** `POST /api/interns/attendance-tickets/{id}/review/`

**Request Body:**
```json
{
  "approved": false,
  "comments": "Rejected - no proof provided"
}
```

**Verify:**
- Attendance status NOT changed
- Intern cannot raise another ticket for same date (unless...)
- Check if intern can re-raise after rejection (depends on business logic)

---

## PART 3: API ENDPOINT TESTING

### Using Postman / cURL / HTTPie

Get authentication token first:

```bash
# Login to get JWT token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "intern@test.com",
    "password": "yourpassword"
  }'

# Save the access token from response
TOKEN="your_access_token_here"
```

---

### API 1: List All Attendance (HR)

```bash
curl -X GET "http://localhost:8000/api/interns/attendance/" \
  -H "Authorization: Bearer $TOKEN"

# With filters
curl -X GET "http://localhost:8000/api/interns/attendance/?intern_id=intern_001&month=2025-11" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** 200 OK, paginated list of attendance records

---

### API 2: Get My Attendance (Intern)

```bash
curl -X GET "http://localhost:8000/api/interns/attendance/my_attendance/?month=2025-11" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** 200 OK, array of attendance records for logged-in intern

---

### API 3: Mark Today Present (Intern)

```bash
curl -X POST "http://localhost:8000/api/interns/attendance/mark_today/" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** 201 Created, attendance record with status="Present"

---

### API 4: Create Attendance (HR)

```bash
curl -X POST "http://localhost:8000/api/interns/attendance/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "intern_id": "intern_001",
    "date": "2025-11-20",
    "status": "Present",
    "notes": "Late mark"
  }'
```

**Expected:** 201 Created, new attendance record

---

### API 5: Update Attendance Status (HR)

```bash
curl -X PATCH "http://localhost:8000/api/interns/attendance/att_xxx/update_status/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Half Day",
    "notes": "Updated by HR"
  }'
```

**Expected:** 200 OK, updated attendance

---

### API 6: List All Tickets (HR)

```bash
curl -X GET "http://localhost:8000/api/interns/attendance-tickets/" \
  -H "Authorization: Bearer $TOKEN"

# With filter
curl -X GET "http://localhost:8000/api/interns/attendance-tickets/?intern_id=intern_001" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** 200 OK, paginated tickets

---

### API 7: Get My Tickets (Intern)

```bash
curl -X GET "http://localhost:8000/api/interns/attendance-tickets/my_tickets/" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** 200 OK, array of intern's tickets

---

### API 8: Get Pending Tickets (HR)

```bash
curl -X GET "http://localhost:8000/api/interns/attendance-tickets/pending/" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** 200 OK, array of pending tickets only

---

### API 9: Create Ticket (Intern)

```bash
curl -X POST "http://localhost:8000/api/interns/attendance-tickets/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attendance_id": "att_xxx",
    "reason": "I was present but marked absent",
    "requested_status": "Present"
  }'
```

**Expected:** 201 Created, new ticket with status="Pending"

---

### API 10: Review Ticket (HR)

```bash
# Approve
curl -X POST "http://localhost:8000/api/interns/attendance-tickets/ticket_xxx/review/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "comments": "Approved"
  }'

# Reject
curl -X POST "http://localhost:8000/api/interns/attendance-tickets/ticket_xxx/review/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": false,
    "comments": "Rejected - no proof"
  }'
```

**Expected:** 200 OK, updated ticket

---

## PART 4: EDGE CASES & ERROR TESTING

### Scenario 1: Duplicate Prevention

**Test:** Try marking attendance twice for same day
- Mark today as present
- Try mark_today API again
- **Expected:** 400 Bad Request

**Test:** Try creating duplicate ticket
- Raise ticket for a date
- Raise another ticket for same date
- **Expected:** 400 Bad Request

---

### Scenario 2: Permission Checks

**Test:** Intern trying HR-only operations
- As Intern, call `PATCH /attendance/{id}/update_status/`
- **Expected:** 403 Forbidden

**Test:** Intern trying to access pending tickets
- As Intern, call `GET /attendance-tickets/pending/`
- **Expected:** 403 Forbidden

---

### Scenario 3: Invalid Data

**Test:** Create ticket for Present attendance
- Try raising ticket for already present date
- **Expected:** 400 Bad Request

**Test:** Invalid status value
- POST attendance with status="InvalidStatus"
- **Expected:** 400 Bad Request

---

### Scenario 4: Non-existent Resources

**Test:** Update non-existent attendance
- PATCH /attendance/fake_id/update_status/
- **Expected:** 404 Not Found

---

## PART 5: INTEGRATION TESTING

### Full Workflow: Intern → Ticket → HR Approval

1. **Intern raises ticket:**
   - Login as intern
   - Mark attendance absent for yesterday (or create absent record)
   - Raise correction ticket
   - Verify ticket shows in My Tickets as Pending

2. **HR reviews and approves:**
   - Login as HR
   - See ticket in Pending Tickets panel
   - Review and approve
   - Add comments

3. **Verify automatic update:**
   - Check attendance record → Should be Present now
   - Intern's calendar → Should show green
   - Ticket status → Should be Approved

4. **Intern sees result:**
   - Login as intern again
   - Calendar shows updated status
   - Ticket shows as Approved with HR comments

**Success Criteria:**
- ✅ Ticket created successfully
- ✅ HR can see and review
- ✅ Attendance auto-updated on approval
- ✅ Both users see consistent data

---

## PART 6: PERFORMANCE TESTING

### Load Testing (Optional)

```bash
# Install locust
pip install locust

# Create locustfile.py with attendance API calls
# Run: locust -f locustfile.py --host=http://localhost:8000
```

**Test:**
- 100 concurrent users
- Mark attendance
- Raise tickets
- View calendars

**Expected:**
- Response time < 500ms for most requests
- No database deadlocks
- No timeout errors

---

## TROUBLESHOOTING

### Issue: 404 on attendance endpoints

**Solution:**
```bash
python manage.py migrate
# Restart server
```

### Issue: Frontend not showing data

**Checks:**
1. Browser console for errors
2. Network tab - check API responses
3. Verify user role and permissions
4. Clear cache and reload

### Issue: Tickets not appearing

**Checks:**
1. Verify ticket was created in database
2. Check ticket status (Pending/Approved/Rejected)
3. Verify HR is calling pending endpoint correctly

---

## SUCCESS CHECKLIST

### Backend Tests
- [ ] All 40+ unit tests pass
- [ ] All 10 API endpoints return correct status codes
- [ ] Role-based permissions enforced
- [ ] Database constraints working (unique, foreign keys)

### Intern Features
- [ ] Can view monthly calendar
- [ ] Can mark today present
- [ ] Can raise tickets for absent dates
- [ ] Can view all raised tickets
- [ ] Cannot raise duplicate tickets

### HR Features
- [ ] Can select any intern
- [ ] Can view intern's attendance
- [ ] Can modify attendance directly
- [ ] Can view all pending tickets
- [ ] Can approve tickets (auto-updates attendance)
- [ ] Can reject tickets (attendance unchanged)

### Integration
- [ ] Ticket approval updates attendance automatically
- [ ] Both users see consistent data
- [ ] Realtime updates work
- [ ] No permission leaks

---

## Test Report Template

After testing, document results:

```
Attendance Feature Test Report
Date: _______________
Tester: _______________

Automated Tests:
- Tests Run: ___
- Passed: ___
- Failed: ___
- Coverage: ___%

Manual Tests:
- Intern Features: ✅ / ❌
- HR Features: ✅ / ❌
- API Endpoints: ✅ / ❌
- Edge Cases: ✅ / ❌

Issues Found:
1. _______________
2. _______________

Overall Status: PASS / FAIL
```

---

**All tests passing? You're ready for production! 🚀**
