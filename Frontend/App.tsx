
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import AddNewCandidate from './pages/AddNewCandidate';
import InterviewAssessment from './pages/InterviewAssessment';
import Interns from './pages/Interns';
import Stipends from './pages/Stipends';
import LeaveRequests from './pages/LeaveRequests';
import ExtensionRequests from './pages/ExtensionRequests';
import ExitProcess from './pages/ExitProcess';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Onboarding from './pages/Onboarding';
import ExtensionPermissions from './pages/ExtensionPermissions';
import HodApprovals from './pages/HodApprovals';
import TestNewDB from './components/TestNewDB';
import TypeTest from './components/TypeTest';
import Attendance from './pages/Attendance';
import AttendanceHistory from './pages/AttendanceHistory';


const ProtectedRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <ReactRouterDOM.Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <ReactRouterDOM.Routes>
        <ReactRouterDOM.Route path="/" element={<ReactRouterDOM.Navigate to="/dashboard" replace />} />
        <ReactRouterDOM.Route path="/dashboard" element={<Dashboard />} />
        <ReactRouterDOM.Route path="/onboarding" element={<Onboarding />} />
        <ReactRouterDOM.Route path="/candidates" element={<Candidates />} />
        <ReactRouterDOM.Route path="/candidates/new" element={<AddNewCandidate />} />
        <ReactRouterDOM.Route path="/interviews" element={<InterviewAssessment />} />
        <ReactRouterDOM.Route path="/hod-approvals" element={<HodApprovals />} />
        <ReactRouterDOM.Route path="/interns" element={<Interns />} />
        <ReactRouterDOM.Route path="/stipends" element={<Stipends />} />
        <ReactRouterDOM.Route path="/leaves" element={<LeaveRequests />} />
        <ReactRouterDOM.Route path="/extensions" element={<ExtensionRequests />} />
        <ReactRouterDOM.Route path="/extension-permissions" element={<ExtensionPermissions />} />
        <ReactRouterDOM.Route path="/exit" element={<ExitProcess />} />
        <ReactRouterDOM.Route path="/profile" element={<Profile />} />
        <ReactRouterDOM.Route path="/attendance" element={<Attendance />} />
        <ReactRouterDOM.Route path="/attendance-history" element={<AttendanceHistory />} />
        <ReactRouterDOM.Route path="/test-db" element={<TestNewDB />} />
        <ReactRouterDOM.Route path="/type-test" element={<TypeTest />} />
        <ReactRouterDOM.Route path="*" element={<NotFound />} />
      </ReactRouterDOM.Routes>
    </Layout>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <ReactRouterDOM.HashRouter>
          <ReactRouterDOM.Routes>
            <ReactRouterDOM.Route path="/login" element={<Login />} />
            <ReactRouterDOM.Route path="/*" element={<ProtectedRoutes />} />
          </ReactRouterDOM.Routes>
        </ReactRouterDOM.HashRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;