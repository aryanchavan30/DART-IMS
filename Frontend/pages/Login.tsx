
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import apiService from '../services/apiService.ts';
import { Role } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      addToast('Invalid email or password. Please try again.', 'error');
      setLoading(false);
    }
  };

  const quickLogin = async (role: Role) => {
    setLoading(true);
    try {
      // Use predefined test user credentials based on role
      const roleCredentialsMap = {
        [Role.HR]: { email: 'hr@example.com', password: 'password123' },
        [Role.HOD]: { email: 'hod.web@example.com', password: 'password123' },
        [Role.MENTOR]: { email: 'mentor.alice@example.com', password: 'password123' },
        [Role.INTERN]: { email: 'intern@example.com', password: 'password123' }, // This would be created after onboarding
      };
      
      const credentials = roleCredentialsMap[role];
      if (credentials) {
        setEmail(credentials.email);
        setPassword(credentials.password);
        const success = await login(credentials.email, credentials.password);
        if (!success) {
           addToast('Quick login failed. User may not exist yet or password may be incorrect.', 'error');
           setLoading(false);
        } else {
           navigate('/dashboard');
        }
      } else {
          addToast(`No test user configured for role: ${role}`, 'error');
          setLoading(false);
      }
    } catch (error) {
        console.error('Quick login error:', error);
        addToast('An error occurred during quick login.', 'error');
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-gray flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-red">IMS Login</h1>
          <p className="text-slate-500 mt-2">Intern Management System</p>
          {/* <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Development Mode:</strong> Default password for all test users is: <code className="bg-blue-100 px-1 rounded">password123</code>
            </p>
          </div> */}
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="enter.your@email.com"
            required
            disabled={loading}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={loading}
          />
          <Button type="submit" className="w-full" disabled={loading || !email || !password}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        {/* <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or quick login as</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Button variant="secondary" onClick={() => quickLogin(Role.INTERN)} disabled={loading}>Intern</Button>
            <Button variant="secondary" onClick={() => quickLogin(Role.HR)} disabled={loading}>HR</Button>
            <Button variant="secondary" onClick={() => quickLogin(Role.MENTOR)} disabled={loading}>Mentor</Button>
            <Button variant="secondary" onClick={() => quickLogin(Role.HOD)} disabled={loading}>HOD</Button>
          </div>
        </div> */}
      </Card>
    </div>
  );
};

export default Login;