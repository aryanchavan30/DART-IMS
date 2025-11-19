# DART-IMS Setup Guide

Complete step-by-step guide to set up the DART Intern Management System on your local machine.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Database Migrations](#database-migrations)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Ensure you have the following installed on your system:

- **Python 3.10+**
  ```bash
  python --version  # Should show 3.10 or higher
  ```

- **PostgreSQL 12+** (Recommended) or SQLite
  ```bash
  psql --version
  ```

- **Node.js 18+** and npm/pnpm
  ```bash
  node --version
  npm --version
  ```

- **Git**
  ```bash
  git --version
  ```

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd DART-IMS/Backend
```

### 2. Create Python Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Python Dependencies
```bash
pip install -r requirements.txt
```

The `requirements.txt` includes:
- Django==5.2.7
- djangorestframework==3.16.1
- djangorestframework_simplejwt==5.5.1
- django-cors-headers==4.9.0
- Pillow==11.3.0
- psycopg2-binary (for PostgreSQL, install separately if needed)

### 4. Database Configuration

#### Option A: PostgreSQL (Recommended for Production)

1. **Install PostgreSQL** (if not installed)
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Create Database**
   ```bash
   # Login to PostgreSQL
   sudo -u postgres psql

   # In PostgreSQL prompt:
   CREATE DATABASE IMS_DB;
   CREATE USER postgres WITH PASSWORD 'postgres';
   GRANT ALL PRIVILEGES ON DATABASE IMS_DB TO postgres;
   \q
   ```

3. **Configure Django Settings**

   The settings are already configured in `Backend/ims_backend/settings.py`:
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

   **Note**: For production, use environment variables for database credentials.

4. **Install PostgreSQL Python adapter**
   ```bash
   pip install psycopg2-binary
   ```

#### Option B: SQLite (Development Only)

If you prefer SQLite for quick setup:

1. Edit `Backend/ims_backend/settings.py`:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.sqlite3',
           'NAME': BASE_DIR / 'db.sqlite3',
       }
   }
   ```

### 5. Email Configuration (Optional)

For email notifications, create `.env.local` in project root:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

**For Gmail App Password**:
1. Go to Google Account > Security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate password for "Mail"
5. Use generated password in EMAIL_HOST_PASSWORD

## Database Migrations

This is the most important step! Run these commands in order:

### 1. Create Migrations for All Apps

```bash
cd Backend

# Create migrations for each app
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
```

### 2. Apply All Migrations

```bash
python manage.py migrate
```

**Expected Output**:
```
Operations to perform:
  Apply all migrations: admin, auth, candidates, contenttypes, departments,
  email_service, exits, extensions, holidays, interns, leaves, notifications,
  sessions, stipends, users, webhooks
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying auth.0001_initial... OK
  Applying users.0001_initial... OK
  Applying departments.0001_initial... OK
  Applying candidates.0001_initial... OK
  Applying interns.0001_initial... OK  ← Should include Attendance & AttendanceTicket models
  ...
```

**Important**: The `interns` app should now include migrations for:
- Intern model
- **Attendance model** (NEW)
- **AttendanceTicket model** (NEW)

### 3. Verify Migrations

```bash
# Check migration status
python manage.py showmigrations

# You should see all apps with [X] marks indicating applied migrations
```

### 4. Create Superuser

```bash
python manage.py createsuperuser
```

Enter details when prompted:
```
Email: admin@example.com
Name: Admin User
Password: ********
Password (again): ********
```

### 5. Create Test Data (Optional)

You can populate the database with test data using the provided scripts:

```bash
# Create test users with passwords
python create_test_users_with_passwords.py

# Or create full test dataset
python reset_and_seed_data.py
```

**Note**: These scripts may need modification based on your requirements.

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd ../Frontend  # From Backend directory
# OR
cd DART-IMS/Frontend  # From project root
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using pnpm (faster):
```bash
pnpm install
```

### 3. Configure API URL

The API URL is already configured in `Frontend/services/apiService.ts`:
```typescript
const API_BASE_URL = 'http://localhost:8000/api';
```

If your backend runs on a different port, update this value.

### 4. Environment Variables (Optional)

Create `Frontend/.env` if needed:
```env
VITE_API_URL=http://localhost:8000/api
```

## Running the Application

You need to run both backend and frontend simultaneously.

### Terminal 1: Backend Server

```bash
cd Backend

# Make sure virtual environment is activated
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows

# Run Django development server
python manage.py runserver
```

Server will start at: **http://localhost:8000**

**Verify Backend**:
- Admin panel: http://localhost:8000/admin
- API root: http://localhost:8000/api/
- Login endpoint: http://localhost:8000/api/auth/login/

### Terminal 2: Frontend Server

```bash
cd Frontend

# Run Vite development server
npm run dev
# OR
pnpm dev
```

Server will start at: **http://localhost:3000**

## First Time Login

### Using Superuser
- Email: The email you provided during `createsuperuser`
- Password: The password you set

### Using Test Users (if you ran test scripts)
Common test users:
- **HR User**: `hr@example.com` / `password123`
- **Intern User**: `intern@example.com` / `password123`
- **HOD User**: `hod@example.com` / `password123`

## Accessing the Application

1. **Frontend**: http://localhost:3000
2. **Backend API**: http://localhost:8000/api/
3. **Admin Panel**: http://localhost:8000/admin

## Features Available

After setup, you can access:

1. **Dashboard** - Overview and analytics
2. **Candidates** - Manage candidate applications
3. **Interviews** - Conduct interview assessments
4. **HOD Approvals** - Department head approvals
5. **Onboarding** - Onboard selected candidates
6. **Interns** - Manage active interns
7. **Stipends** - Handle monthly stipend approvals
8. **Leaves** - Process leave requests
9. **Extensions** - Manage extension requests
10. **Attendance** ⭐ NEW - Track daily attendance
11. **Exit Process** - Handle intern exits
12. **Profile** - Manage user profile

## New Attendance Feature

The attendance feature is now fully integrated:

### For Interns:
1. Navigate to **Attendance** page
2. View monthly calendar with attendance status
3. **Mark today as present** if pending
4. **Raise correction tickets** for wrong absents
5. View all submitted tickets and their status

### For HR:
1. Navigate to **Intern Attendance** page
2. Select intern from dropdown
3. View intern's monthly attendance
4. **Change attendance status** (absent to present)
5. **Review tickets**: Approve or reject correction requests
6. View pending tickets across all interns

### API Endpoints Available:

**Attendance**:
- `GET /api/interns/attendance/` - List attendance (filtered by role)
- `GET /api/interns/attendance/my_attendance/` - Intern's own attendance
- `POST /api/interns/attendance/mark_today/` - Mark today present
- `POST /api/interns/attendance/` - Create/update attendance
- `PATCH /api/interns/attendance/{id}/update_status/` - Update status (HR)

**Attendance Tickets**:
- `GET /api/interns/attendance-tickets/` - List tickets
- `GET /api/interns/attendance-tickets/my_tickets/` - Intern's tickets
- `GET /api/interns/attendance-tickets/pending/` - Pending tickets (HR)
- `POST /api/interns/attendance-tickets/` - Create ticket
- `POST /api/interns/attendance-tickets/{id}/review/` - Review ticket (HR)

## Troubleshooting

### Issue: Module Not Found Errors

**Solution**: Make sure all dependencies are installed
```bash
cd Backend
pip install -r requirements.txt

cd ../Frontend
npm install
```

### Issue: Migration Errors

**Solution 1**: Reset migrations (CAUTION: Deletes data)
```bash
python manage.py migrate --fake
python manage.py migrate --fake-initial
python manage.py migrate
```

**Solution 2**: Delete migration files and recreate
```bash
# Delete all migration files except __init__.py in each app/migrations/
# Then run:
python manage.py makemigrations
python manage.py migrate
```

### Issue: Port Already in Use

**Backend**:
```bash
# Use different port
python manage.py runserver 8001
```

**Frontend**:
Vite will automatically suggest an alternative port if 3000 is busy.

### Issue: CORS Errors

**Solution**: Check `Backend/ims_backend/settings.py`
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add your frontend URL
]
```

### Issue: Token Expired

**Solution**:
1. Clear browser localStorage
2. Logout and login again
3. Or use the refresh token endpoint

### Issue: Database Connection Error (PostgreSQL)

**Check PostgreSQL is running**:
```bash
# Linux
sudo service postgresql status

# Mac
brew services list

# Windows
# Check Services app for PostgreSQL
```

**Test connection**:
```bash
psql -U postgres -d IMS_DB
```

### Issue: Cannot Login / Authentication Fails

**Verify**:
1. Check if superuser was created: `python manage.py createsuperuser`
2. Verify JWT settings in `settings.py`
3. Check browser console for errors
4. Verify API is accessible: http://localhost:8000/api/auth/login/

### Issue: Frontend Build Errors

**Solution**:
```bash
cd Frontend

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or with pnpm
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: Attendance Not Showing

**Verify**:
1. Migrations were applied: `python manage.py showmigrations interns`
2. User has intern profile (check admin panel)
3. Check browser console for API errors
4. Verify attendance endpoints work: `curl http://localhost:8000/api/interns/attendance/`

## Production Deployment

For production deployment:

1. **Update Settings**:
   - Set `DEBUG = False`
   - Configure `ALLOWED_HOSTS`
   - Use environment variables for secrets
   - Set up proper database (PostgreSQL)
   - Configure static files serving

2. **Security**:
   - Change `SECRET_KEY`
   - Use HTTPS
   - Set secure cookie settings
   - Configure CORS properly

3. **Build Frontend**:
   ```bash
   cd Frontend
   npm run build
   ```

4. **Use Production Server**:
   - Backend: Gunicorn, uWSGI
   - Frontend: Nginx, Apache
   - Database: PostgreSQL, MySQL

## Next Steps

1. Explore the application
2. Create test data using admin panel
3. Test attendance feature
4. Customize for your needs
5. Add more features as required

## Support

For issues or questions:
1. Check this documentation
2. Review `claude.md` for detailed architecture
3. Check Django/React documentation
4. Review API responses for error messages
5. Check browser console for frontend errors
6. Check Django logs for backend errors

---

**Version**: 1.0.0
**Last Updated**: November 2024
**Attendance Feature**: ✅ Fully Integrated
