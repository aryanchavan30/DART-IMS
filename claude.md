# DART-IMS (Intern Management System) - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Backend Documentation](#backend-documentation)
4. [Frontend Documentation](#frontend-documentation)
5. [Setup Instructions](#setup-instructions)
6. [Attendance Feature](#attendance-feature)
7. [API Reference](#api-reference)

---

## Project Overview

DART-IMS is a comprehensive Intern Management System built with Django REST Framework (backend) and React with TypeScript (frontend). The system manages the complete intern lifecycle from candidate application to exit process.

### Key Features
- **Candidate Management**: Track candidates from application through interview and onboarding
- **Intern Management**: Manage active interns with profiles, documents, and status tracking
- **Stipend Management**: Handle monthly stipend approvals with multi-level authorization
- **Leave Management**: Process leave requests with approval workflows
- **Extension Requests**: Manage internship extensions with multi-stakeholder approvals
- **Exit Process**: Handle intern exits with feedback and certificate generation
- **Attendance Tracking**: Monitor daily attendance with ticket-based correction system
- **Role-Based Access**: Support for Intern, HR, Mentor, and HOD roles

---

## Architecture

### Tech Stack

#### Backend
- **Framework**: Django 5.2.7
- **Database**: PostgreSQL (configured) / SQLite (fallback)
- **API**: Django REST Framework 3.16.1
- **Authentication**: JWT (Simple JWT 5.5.1)
- **CORS**: django-cors-headers 4.9.0
- **Image Processing**: Pillow 11.3.0

#### Frontend
- **Framework**: React 19.1.1
- **Language**: TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **Routing**: React Router DOM 7.7.1
- **Date Handling**: date-fns 4.1.0
- **PDF Generation**: jsPDF 2.5.1
- **Icons**: Heroicons 2.2.0, Lucide React 0.536.0
- **HTTP Client**: Fetch API (native)

### Project Structure

```
DART-IMS/
├── Backend/                    # Django backend
│   ├── ims_backend/           # Main Django project settings
│   │   ├── settings.py        # Configuration
│   │   ├── urls.py            # Root URL routing
│   │   └── wsgi.py            # WSGI entry point
│   ├── users/                 # User management app
│   ├── departments/           # Department management
│   ├── candidates/            # Candidate tracking
│   ├── interns/              # Intern management
│   ├── stipends/             # Stipend processing
│   ├── leaves/               # Leave requests
│   ├── extensions/           # Extension requests
│   ├── exits/                # Exit process
│   ├── holidays/             # Holiday management
│   ├── email_service/        # Email notifications
│   ├── webhooks/             # JotForm integration
│   ├── notifications/        # Notification system
│   ├── dashboard/            # Dashboard analytics
│   ├── media/                # Uploaded files
│   ├── db.sqlite3            # SQLite database (default)
│   ├── requirements.txt      # Python dependencies
│   └── manage.py             # Django management
│
└── Frontend/                  # React frontend
    ├── pages/                # Page components
    ├── components/           # Reusable components
    │   ├── layout/          # Layout components
    │   ├── ui/              # UI components
    │   ├── dashboard/       # Dashboard widgets
    │   ├── candidates/      # Candidate components
    │   ├── interns/         # Intern components
    │   ├── stipends/        # Stipend components
    │   └── exit/            # Exit components
    ├── services/            # API services
    ├── contexts/            # React contexts
    ├── hooks/               # Custom hooks
    ├── types.ts             # TypeScript definitions
    ├── App.tsx              # Main app component
    └── package.json         # Node dependencies
```

---

## Backend Documentation

### Application Modules

#### 1. Users Module (`users/`)

**Purpose**: Core authentication and user management

**Models**: `User`
```python
class User(AbstractUser):
    email = models.EmailField(unique=True)        # Primary identifier
    login_id = models.CharField(...)              # Optional login ID
    solar_email = models.EmailField(...)          # Work email
    name = models.CharField(...)                  # Full name
    role = models.CharField(...)                  # Intern/HR/Mentor/HOD
    department = models.ForeignKey(Department)    # Department assignment
    dob = models.DateField(...)                   # Date of birth
    shift = models.CharField(...)                 # Morning/General/Night
    week_offs = models.JSONField(...)             # Array of weekday numbers
```

**Key Features**:
- JWT-based authentication
- Custom user manager for email-based login
- Role-based access control
- Password management

**API Endpoints**:
- `POST /api/auth/login/` - User login
- `GET /api/auth/user/` - Get current user
- `POST /api/auth/change-password/` - Change password
- `POST /api/auth/token/refresh/` - Refresh access token
- `GET /api/users/` - List all users
- `GET /api/users/{id}/` - Get user details
- `POST /api/users/` - Create new user
- `PUT /api/users/{id}/` - Update user

#### 2. Departments Module (`departments/`)

**Purpose**: Manage organizational departments

**Models**: `Department`
```python
class Department(models.Model):
    id = models.CharField(primary_key=True)
    name = models.CharField(...)                  # Department name
    hod = models.ForeignKey(User)                 # Head of Department
    mentors = models.ManyToManyField(User)        # Department mentors
```

**Department Types**:
- Web Development
- SAP BTP Development
- RPA
- Gen AI & LLM
- IIoT Development
- IIoT Field
- SCM
- Project Management

**API Endpoints**:
- `GET /api/departments/` - List departments
- `GET /api/departments/{id}/` - Get department details

#### 3. Candidates Module (`candidates/`)

**Purpose**: Track candidates from application to onboarding

**Models**:
- `Candidate` - Main candidate model
- `JotFormCandidate` - Synced from JotForm submissions
- `JobApplication` - Alternative application format
- `SyncLog` - Track JotForm sync operations

**Candidate Model**:
```python
class Candidate(models.Model):
    id = models.CharField(primary_key=True)
    name = models.CharField(...)
    email = models.EmailField(...)
    resume = models.FileField(...)
    photo = models.ImageField(...)
    signature = models.ImageField(...)
    last_project_report = models.FileField(...)
    quest_data = models.JSONField(...)            # Application questionnaire
    status = models.CharField(...)                # Workflow status
    assigned_mentor = models.ForeignKey(User)
    department = models.ForeignKey(Department)
    interview_feedback = models.JSONField(...)
    hod_feedback = models.TextField(...)
    joining_date = models.DateField(...)
```

**Workflow Statuses**:
1. Pending Mentor Assignment
2. Pending Interview Assessment
3. Pending HOD Approval
4. Selected
5. Rejected
6. Onboarded

**API Endpoints**:
- `GET /api/candidates/` - List all candidates
- `POST /api/candidates/` - Create candidate
- `GET /api/candidates/{id}/` - Get candidate details
- `POST /api/candidates/{id}/assign_mentor/` - Assign mentor
- `POST /api/candidates/{id}/submit_interview/` - Submit interview feedback
- `POST /api/candidates/{id}/process_approval/` - HOD approval
- `POST /api/candidates/{id}/onboard/` - Onboard candidate
- `POST /api/candidates/{id}/reject/` - Reject candidate
- `GET /api/candidates/statistics/` - Get candidate stats

**JotForm Integration**:
- `GET /api/webhooks/candidates/local/` - Get synced candidates
- `POST /api/webhooks/sync/trigger/` - Trigger sync
- `GET /api/webhooks/sync/info/` - Get sync status

#### 4. Interns Module (`interns/`)

**Purpose**: Manage active intern profiles and documents

**Models**: `Intern`
```python
class Intern(models.Model):
    id = models.CharField(primary_key=True)
    user = models.OneToOneField(User)             # Associated user account
    candidate = models.OneToOneField(Candidate)   # Original candidate
    joining_date = models.DateField(...)
    mentor = models.ForeignKey(User)              # Assigned mentor
    offer_letter = models.FileField(...)
    bank_details = models.JSONField(...)
    extension_allowed = models.BooleanField(...)
    status = models.CharField(...)                # Active/Completed/Left
    # Onboarding documents
    aadhar_card = models.FileField(...)
    pan_card = models.FileField(...)
    bank_passbook = models.FileField(...)
    noc = models.FileField(...)
```

**Bank Details Structure**:
```json
{
  "account_number": "string",
  "ifsc_code": "string",
  "bank_name": "string",
  "pan_number": "string"
}
```

**API Endpoints**:
- `GET /api/interns/` - List all interns
- `GET /api/interns/{id}/` - Get intern details
- `PATCH /api/interns/{id}/` - Update intern
- `PATCH /api/interns/{id}/upload_offer_letter/` - Upload offer letter
- `PATCH /api/interns/{id}/upload_documents/` - Upload documents

#### 5. Stipends Module (`stipends/`)

**Purpose**: Handle monthly stipend approvals

**Models**: `Stipend`
```python
class Stipend(models.Model):
    id = models.CharField(primary_key=True)
    intern = models.ForeignKey(Intern)
    month = models.CharField(...)                 # Format: YYYY-MM
    amount = models.DecimalField(...)
    working_days = models.PositiveIntegerField(...)
    leaves_taken = models.PositiveIntegerField(...)
    comments = models.TextField(...)
    intern_approval = models.CharField(...)       # Pending/Approved/Rejected
    hr_approval = models.CharField(...)
    hod_approval = models.CharField(...)
    invoice_url = models.URLField(...)
    intern_signature_url = models.TextField(...)
    hr_signature_url = models.TextField(...)
```

**Approval Workflow**:
1. Intern approves their stipend
2. HR reviews and approves
3. HOD provides final approval

**API Endpoints**:
- `GET /api/stipends/` - List stipends
- `POST /api/stipends/` - Create stipend
- `GET /api/stipends/{id}/` - Get stipend details
- `POST /api/stipends/{id}/approve/` - Approve stipend
- `POST /api/stipends/bulk_approve/` - Bulk approve
- `POST /api/stipends/{id}/send_creation_email/` - Email invoice

#### 6. Leaves Module (`leaves/`)

**Purpose**: Process leave requests

**Models**: `LeaveRequest`
```python
class LeaveRequest(models.Model):
    id = models.CharField(primary_key=True)
    intern = models.ForeignKey(Intern)
    start_date = models.DateField(...)
    end_date = models.DateField(...)
    leave_type = models.CharField(...)            # Full Day/Half Day/Other
    leave_half = models.CharField(...)            # 1st Half/2nd Half
    reason = models.TextField(...)
    status = models.CharField(...)                # Pending/Approved/Rejected
    mail_sent = models.BooleanField(...)
```

**API Endpoints**:
- `GET /api/leaves/` - List leave requests
- `POST /api/leaves/` - Create leave request
- `PATCH /api/leaves/{id}/` - Update leave status

#### 7. Extensions Module (`extensions/`)

**Purpose**: Manage internship extension requests and permissions

**Models**:
- `ExtensionRequest` - Extension requests
- `ExtensionPermission` - Permission to request extensions

**ExtensionRequest Model**:
```python
class ExtensionRequest(models.Model):
    id = models.CharField(primary_key=True)
    intern = models.ForeignKey(Intern)
    months_requested = models.PositiveIntegerField(...)
    reason = models.TextField(...)
    status = models.CharField(...)
    hr_approval = models.CharField(...)
    mentor_approval = models.CharField(...)
    hod_approval = models.CharField(...)
    mhr_approval = models.CharField(...)
    hr_comments = models.TextField(...)
    mentor_comments = models.TextField(...)
    hod_comments = models.TextField(...)
```

**ExtensionPermission Model**:
```python
class ExtensionPermission(models.Model):
    id = models.CharField(primary_key=True)
    intern = models.OneToOneField(Intern)
    hr_approved = models.BooleanField(...)
    hr_approved_by = models.ForeignKey(User)
    hod_approved = models.BooleanField(...)
    hod_approved_by = models.ForeignKey(User)

    @property
    def is_approved(self):
        return self.hr_approved and self.hod_approved
```

**API Endpoints**:
- `GET /api/extensions/extension-requests/` - List requests
- `POST /api/extensions/extension-requests/` - Create request
- `GET /api/extensions/extension-permissions/` - List permissions
- `POST /api/extensions/extension-permissions/create_for_intern/` - Create permission
- `POST /api/extensions/extension-permissions/{id}/hr_approve/` - HR approval
- `POST /api/extensions/extension-permissions/{id}/hod_approve/` - HOD approval

#### 8. Exits Module (`exits/`)

**Purpose**: Handle intern exit process

**Models**: `ExitRequest`
```python
class ExitRequest(models.Model):
    id = models.CharField(primary_key=True)
    intern = models.ForeignKey(Intern)
    feedback = models.JSONField(...)              # Exit feedback form
    internship_report = models.TextField(...)     # Final report
    certificate = models.TextField(...)           # Certificate data URL
    status = models.CharField(...)
    hr_approval = models.CharField(...)
    mentor_approval = models.CharField(...)
    hod_approval = models.CharField(...)
    hr_comments = models.TextField(...)
    mentor_comments = models.TextField(...)
    hod_comments = models.TextField(...)
```

**API Endpoints**:
- `GET /api/exits/` - List exit requests
- `POST /api/exits/` - Create exit request
- `PATCH /api/exits/{id}/` - Update exit request

#### 9. Holidays Module (`holidays/`)

**Purpose**: Manage company holidays

**Models**: `Holiday`
```python
class Holiday(models.Model):
    date = models.DateField(...)
    name = models.CharField(...)
    type = models.CharField(...)
```

**API Endpoints**:
- `GET /api/holidays/` - List holidays

#### 10. Email Service Module (`email_service/`)

**Purpose**: Send email notifications

**Configuration** (from settings.py):
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
```

**API Endpoints**:
- `POST /api/email/send/` - Send email
- `POST /api/email/notifications/` - Send notification email

#### 11. Webhooks Module (`webhooks/`)

**Purpose**: JotForm integration for candidate applications

**Models**:
- `JobApplication` - Job application data
- `JotFormCandidate` - Synced candidate data
- `SyncLog` - Sync operation tracking

**Key Features**:
- Automatic sync from JotForm
- Local caching for fast access
- Incremental and full sync support
- Search and pagination

#### 12. Dashboard Module (`dashboard/`)

**Purpose**: Analytics and statistics

**API Endpoints**:
- `GET /api/dashboard/stats/` - Get dashboard statistics

**Response Structure**:
```json
{
  "candidate_stats": {
    "total": 100,
    "by_status": {
      "Pending Mentor Assignment": 20,
      "Pending Interview Assessment": 15,
      "Selected": 10
    }
  },
  "intern_stats": {
    "total": 50,
    "by_department": {
      "Web Development": 15,
      "IIoT Development": 10
    }
  },
  "recent_activity": []
}
```

### Authentication & Authorization

**JWT Authentication**:
- Access token lifetime: 1 hour
- Refresh token lifetime: 1 day
- Token rotation enabled
- Blacklist after rotation

**CORS Configuration**:
- Allowed origins: localhost:3000, 3001
- Credentials allowed: true

**Permissions**:
- Default: `IsAuthenticated` for all endpoints
- Role-based access implemented at view level

---

## Frontend Documentation

### Application Structure

#### Core Files

**App.tsx** (Frontend/App.tsx:1)
- Main application component
- Routing configuration
- Protected route wrapper
- Authentication guard

**types.ts** (Frontend/types.ts:1)
- TypeScript type definitions
- Enums for statuses and roles
- Interface definitions for all models

#### Contexts

**AuthContext** (Frontend/contexts/AuthContext.tsx:1)
- User authentication state
- Intern profile management
- Auto-refresh for intern permissions
- Login/logout handlers

**ToastContext** (Frontend/contexts/ToastContext.tsx:1)
- Global notification system
- Success/error message handling

#### Services

**apiService.ts** (Frontend/services/apiService.ts:1)
- Complete API client
- JWT token management
- Auto token refresh
- FormData handling for file uploads
- Paginated response handling

**Key Methods**:
```typescript
// Authentication
login(email, password): Promise<{ access, refresh, user }>
refreshToken(): Promise<{ access }>
getCurrentUser(): Promise<User>

// Users
getUsers(): Promise<User[]>
createUser(userData): Promise<User>

// Candidates
getCandidates(): Promise<Candidate[]>
assignMentorToCandidate(candidateId, mentorId): Promise<Candidate>
submitInterview(candidateId, feedback, approved): Promise<Candidate>
onboardCandidate(candidateId, userData, internData, documents): Promise<{...}>

// Interns
getInterns(): Promise<Intern[]>
updateIntern(id, internData): Promise<Intern>
uploadInternDocuments(id, documents): Promise<{...}>

// Stipends
getStipends(): Promise<Stipend[]>
approveStipend(id, signatureUrl, pdfDataUri): Promise<Stipend>

// Leaves
getLeaveRequests(): Promise<LeaveRequest[]>
createLeaveRequest(leaveData): Promise<LeaveRequest>

// Extensions
getExtensionRequests(): Promise<ExtensionRequest[]>
getExtensionPermissions(): Promise<ExtensionPermission[]>
hrApproveExtensionPermission(id, approved, comments): Promise<ExtensionPermission>

// Exits
getExitRequests(): Promise<ExitRequest[]>
createExitRequest(exitData): Promise<ExitRequest>
```

#### Pages

1. **Login** (Frontend/pages/Login.tsx) - Authentication
2. **Dashboard** (Frontend/pages/Dashboard.tsx) - Overview and quick actions
3. **Candidates** (Frontend/pages/Candidates.tsx) - Candidate management
4. **InterviewAssessment** (Frontend/pages/InterviewAssessment.tsx) - Interview evaluations
5. **HodApprovals** (Frontend/pages/HodApprovals.tsx) - HOD approval queue
6. **Onboarding** (Frontend/pages/Onboarding.tsx) - Candidate onboarding
7. **Interns** (Frontend/pages/Interns.tsx) - Intern listing
8. **Stipends** (Frontend/pages/Stipends.tsx) - Stipend management
9. **LeaveRequests** (Frontend/pages/LeaveRequests.tsx) - Leave management
10. **ExtensionRequests** (Frontend/pages/ExtensionRequests.tsx) - Extension requests
11. **ExtensionPermissions** (Frontend/pages/ExtensionPermissions.tsx) - Extension permissions
12. **ExitProcess** (Frontend/pages/ExitProcess.tsx) - Exit handling
13. **Profile** (Frontend/pages/Profile.tsx) - User profile
14. **Attendance** (Frontend/pages/Attendance.tsx) - Attendance tracking

#### Component Categories

**Layout Components** (Frontend/components/layout/):
- `Layout.tsx` - Main layout wrapper
- `Sidebar.tsx` - Navigation sidebar
- `Header.tsx` - Top header bar

**UI Components** (Frontend/components/ui/):
- `Button.tsx` - Reusable button
- `Input.tsx` - Form input
- `Modal.tsx` - Modal dialog
- `Table.tsx` - Data table
- `Card.tsx` - Card container
- `Badge.tsx` - Status badge
- `Spinner.tsx` - Loading spinner
- `Toast.tsx` - Notification toast
- And more...

**Dashboard Widgets** (Frontend/components/dashboard/):
- `QuickActions.tsx` - Quick action buttons
- `PendingTasksWidget.tsx` - Pending tasks
- `BirthdayWidget.tsx` - Birthday reminders
- `ClockInWidget.tsx` - Clock in/out
- `AnalyticsChart.tsx` - Charts
- `PerformanceMetrics.tsx` - Metrics display

### Routing

**Public Routes**:
- `/login` - Login page

**Protected Routes** (requires authentication):
- `/dashboard` - Dashboard
- `/candidates` - Candidates list
- `/candidates/new` - Add candidate
- `/interviews` - Interview assessments
- `/hod-approvals` - HOD approvals
- `/onboarding` - Onboarding page
- `/interns` - Interns list
- `/stipends` - Stipends management
- `/leaves` - Leave requests
- `/extensions` - Extension requests
- `/extension-permissions` - Extension permissions
- `/exit` - Exit process
- `/profile` - User profile
- `/attendance` - Attendance (NEW)

---

## Setup Instructions

### Prerequisites

**Required Software**:
- Python 3.10 or higher
- PostgreSQL 12 or higher (recommended) or SQLite
- Node.js 18 or higher
- npm or pnpm package manager
- Git

### Backend Setup

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd DART-IMS/Backend
```

#### 2. Create Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

#### 3. Install Python Dependencies
```bash
pip install -r requirements.txt
```

**Dependencies** (requirements.txt):
```
asgiref==3.10.0
Django==5.2.7
django-cors-headers==4.9.0
djangorestframework==3.16.1
djangorestframework_simplejwt==5.5.1
pillow==11.3.0
PyJWT==2.10.1
sqlparse==0.5.3
tzdata==2025.2
```

#### 4. Database Setup

**Option A: PostgreSQL (Recommended for Production)**

1. Install PostgreSQL and create database:
```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE IMS_DB;

# Create user
CREATE USER postgres WITH PASSWORD 'postgres';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE IMS_DB TO postgres;

# Exit
\q
```

2. The settings are already configured in `Backend/ims_backend/settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'IMS_DB',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

**Option B: SQLite (Development Only)**

Modify `Backend/ims_backend/settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

#### 5. Run Migrations

```bash
# Navigate to Backend directory
cd Backend

# Create migrations for all apps
python manage.py makemigrations users
python manage.py makemigrations departments
python manage.py makemigrations candidates
python manage.py makemigrations interns
python manage.py makemigrations stipends
python manage.py makemigrations leaves
python manage.py makemigrations extensions
python manage.py makemigrations exits
python manage.py makemigrations holidays
python manage.py makemigrations webhooks
python manage.py makemigrations notifications
python manage.py makemigrations dashboard
python manage.py makemigrations email_service

# Run all migrations
python manage.py migrate
```

**Expected Output**:
```
Operations to perform:
  Apply all migrations: admin, auth, candidates, contenttypes,
  departments, email_service, exits, extensions, holidays,
  interns, leaves, notifications, sessions, stipends, users, webhooks
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying contenttypes.0002_remove_content_type_name... OK
  Applying auth.0001_initial... OK
  ...
  Applying users.0001_initial... OK
  ...
```

#### 6. Create Superuser

```bash
python manage.py createsuperuser
```

**Prompts**:
```
Email: admin@example.com
Name: Admin User
Password: ********
Password (again): ********
```

#### 7. Create Initial Data (Optional)

You can use the existing scripts to populate test data:

```bash
# Create test users
python create_test_users_with_passwords.py

# Create departments and other data
python reset_and_seed_data.py
```

#### 8. Configure Email (Optional)

Create `.env.local` file in the root directory:
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

**Note**: For Gmail, create an App Password:
1. Go to Google Account settings
2. Security > 2-Step Verification > App passwords
3. Generate new app password
4. Use this password in EMAIL_HOST_PASSWORD

#### 9. Run Development Server

```bash
python manage.py runserver
```

Server will start at: `http://localhost:8000`

**Test the API**:
- Admin panel: `http://localhost:8000/admin`
- API root: `http://localhost:8000/api/`

### Frontend Setup

#### 1. Navigate to Frontend Directory
```bash
cd ../Frontend
```

#### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using pnpm:
```bash
pnpm install
```

**Dependencies** (package.json):
```json
{
  "dependencies": {
    "@heroicons/react": "^2.2.0",
    "date-fns": "^4.1.0",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "lucide-react": "^0.536.0",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^7.7.1",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

#### 3. Configure API URL

Check `Frontend/services/apiService.ts`:
```typescript
const API_BASE_URL = 'http://localhost:8000/api';
```

#### 4. Run Development Server

```bash
npm run dev
# or
pnpm dev
```

Server will start at: `http://localhost:3000`

#### 5. Build for Production

```bash
npm run build
# or
pnpm build
```

Build output will be in `Frontend/dist/`

### First Time Login

**Default Credentials** (if you created test users):
- Email: `admin@example.com`
- Password: `password123`

Or use the superuser credentials you created.

### Troubleshooting

**Issue**: Migration errors
```bash
# Reset migrations
python manage.py migrate --fake
python manage.py migrate --fake-initial
```

**Issue**: CORS errors
- Check `CORS_ALLOWED_ORIGINS` in `settings.py`
- Ensure frontend URL is included

**Issue**: Token expired
- Clear localStorage in browser
- Login again

**Issue**: Port already in use
```bash
# Backend - use different port
python manage.py runserver 8001

# Frontend - Vite will automatically suggest alternative port
```

---

## Attendance Feature

### Overview

The attendance feature allows:
- **Interns**: Mark daily attendance, view attendance history, raise correction tickets
- **HR**: View intern attendance, manage correction requests, modify attendance

### Backend Implementation

#### Database Models

**File**: `Backend/interns/models.py` (to be updated)

Two new models will be added:

1. **Attendance**: Daily attendance records
2. **AttendanceTicket**: Correction requests

```python
class Attendance(models.Model):
    class AttendanceStatus(models.TextChoices):
        PRESENT = 'Present', 'Present'
        ABSENT = 'Absent', 'Absent'
        HALF_DAY = 'Half Day', 'Half Day'
        HOLIDAY = 'Holiday', 'Holiday'
        WEEK_OFF = 'Week Off', 'Week Off'

    id = models.CharField(primary_key=True, max_length=255)
    intern = models.ForeignKey(Intern, on_delete=models.CASCADE,
                              related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=AttendanceStatus.choices,
                             default=AttendanceStatus.ABSENT)
    marked_by = models.ForeignKey(User, on_delete=models.SET_NULL,
                                  null=True, related_name='attendance_marked')
    marked_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ['intern', 'date']
        ordering = ['-date']

    def save(self, *args, **kwargs):
        if not self.id:
            import time
            self.id = f"att_{int(time.time() * 1000000)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.intern.user.name} - {self.date} - {self.status}"


class AttendanceTicket(models.Model):
    class TicketStatus(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        APPROVED = 'Approved', 'Approved'
        REJECTED = 'Rejected', 'Rejected'

    id = models.CharField(primary_key=True, max_length=255)
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE,
                                  related_name='tickets')
    intern = models.ForeignKey(Intern, on_delete=models.CASCADE,
                              related_name='attendance_tickets')
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=TicketStatus.choices,
                             default=TicketStatus.PENDING)
    requested_status = models.CharField(max_length=10,
                                       choices=Attendance.AttendanceStatus.choices)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                   related_name='reviewed_tickets')
    review_comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.id:
            import time
            self.id = f"ticket_{int(time.time() * 1000000)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.intern.user.name} - {self.attendance.date} - {self.status}"
```

### Frontend Implementation

#### 1. Intern Attendance Page

**File**: `Frontend/pages/Attendance.tsx` (already exists, will be enhanced)

Features:
- Monthly calendar view
- Mark today's attendance
- View attendance history
- Raise correction tickets for wrong absents
- View ticket status

#### 2. HR Attendance Management Page

**File**: `Frontend/pages/AttendanceHistory.tsx` (already exists, will be enhanced)

Features:
- Select intern from dropdown
- View selected intern's monthly attendance
- Modify attendance (change absent to present)
- View and process correction tickets
- Approve/reject ticket requests

### API Integration

New endpoints will be added to `apiService.ts`:

```typescript
// Attendance APIs
async getAttendance(internId?: string, month?: string): Promise<Attendance[]>
async markAttendance(date: string, status: string): Promise<Attendance>
async getMyAttendance(month?: string): Promise<Attendance[]>

// Attendance Tickets
async getAttendanceTickets(internId?: string): Promise<AttendanceTicket[]>
async createAttendanceTicket(attendanceId: string, reason: string,
                             requestedStatus: string): Promise<AttendanceTicket>
async reviewAttendanceTicket(ticketId: string, approved: boolean,
                            comments?: string): Promise<AttendanceTicket>
```

### Workflow

**Intern Side**:
1. Intern opens `/attendance`
2. Views current month calendar with attendance status
3. If today is pending, clicks "Mark Present"
4. If a date shows incorrect absence:
   - Click on the date
   - Click "Raise Ticket"
   - Provide reason
   - Submit ticket

**HR Side**:
1. HR opens `/attendance-history` (or new HR attendance page)
2. Selects intern from dropdown
3. Selects month to view
4. Views intern's attendance calendar with:
   - Present days (green)
   - Absent days (red)
   - Tickets raised (orange badge)
5. To modify attendance:
   - Click on absent day
   - Change to present
   - Add notes (optional)
6. To process tickets:
   - View pending tickets list
   - Review reason
   - Approve (changes attendance) or Reject (keeps as absent)
   - Add review comments

### Migration Steps

After implementing the attendance feature:

```bash
# Create migrations
python manage.py makemigrations interns

# Run migrations
python manage.py migrate interns
```

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login/` | Login | No |
| GET | `/api/auth/user/` | Get current user | Yes |
| POST | `/api/auth/change-password/` | Change password | Yes |
| POST | `/api/auth/token/refresh/` | Refresh token | No |

### User Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/` | List users | Yes |
| POST | `/api/users/` | Create user | Yes |
| GET | `/api/users/{id}/` | Get user | Yes |
| PUT | `/api/users/{id}/` | Update user | Yes |

### Department Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/departments/` | List departments | Yes |
| GET | `/api/departments/{id}/` | Get department | Yes |

### Candidate Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/candidates/` | List candidates | Yes |
| POST | `/api/candidates/` | Create candidate | Yes |
| GET | `/api/candidates/{id}/` | Get candidate | Yes |
| PATCH | `/api/candidates/{id}/` | Update candidate | Yes |
| POST | `/api/candidates/{id}/assign_mentor/` | Assign mentor | Yes |
| POST | `/api/candidates/{id}/submit_interview/` | Submit interview | Yes |
| POST | `/api/candidates/{id}/process_approval/` | HOD approval | Yes |
| POST | `/api/candidates/{id}/onboard/` | Onboard candidate | Yes |
| POST | `/api/candidates/{id}/reject/` | Reject candidate | Yes |
| GET | `/api/candidates/statistics/` | Get stats | Yes |

### Intern Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/interns/` | List interns | Yes |
| GET | `/api/interns/{id}/` | Get intern | Yes |
| PATCH | `/api/interns/{id}/` | Update intern | Yes |
| PATCH | `/api/interns/{id}/upload_documents/` | Upload docs | Yes |

### Stipend Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/stipends/` | List stipends | Yes |
| POST | `/api/stipends/` | Create stipend | Yes |
| GET | `/api/stipends/{id}/` | Get stipend | Yes |
| POST | `/api/stipends/{id}/approve/` | Approve stipend | Yes |

### Leave Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/leaves/` | List leaves | Yes |
| POST | `/api/leaves/` | Create leave | Yes |
| PATCH | `/api/leaves/{id}/` | Update leave | Yes |

### Extension Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/extensions/extension-requests/` | List requests | Yes |
| POST | `/api/extensions/extension-requests/` | Create request | Yes |
| GET | `/api/extensions/extension-permissions/` | List permissions | Yes |
| POST | `/api/extensions/extension-permissions/{id}/hr_approve/` | HR approve | Yes |
| POST | `/api/extensions/extension-permissions/{id}/hod_approve/` | HOD approve | Yes |

### Exit Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/exits/` | List exits | Yes |
| POST | `/api/exits/` | Create exit | Yes |
| PATCH | `/api/exits/{id}/` | Update exit | Yes |

### Holiday Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/holidays/` | List holidays | Yes |

### Dashboard Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/stats/` | Get statistics | Yes |

---

## Development Notes

### Code Quality
- Backend follows Django best practices
- Frontend uses TypeScript for type safety
- RESTful API design
- JWT authentication
- Role-based access control

### Security Considerations
- CSRF protection enabled
- CORS configured
- Password hashing
- Token-based authentication
- File upload validation

### Performance
- Pagination implemented for large datasets
- Database indexing on key fields
- Efficient queries with select_related/prefetch_related
- Frontend lazy loading

### Future Enhancements
- Real-time notifications (WebSocket)
- Advanced analytics and reporting
- Mobile app support
- Integration with HR systems
- Automated email reminders
- Performance review module
- Project assignment tracking
- Skill assessment system

---

## Support

For issues or questions:
1. Check this documentation
2. Review Django/React documentation
3. Check API responses for error messages
4. Review browser console for frontend errors
5. Check Django logs for backend errors

---

**Last Updated**: November 2024
**Version**: 1.0.0
