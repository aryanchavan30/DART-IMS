import React, { useState } from 'react';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/apiService.ts';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { LogOut } from 'lucide-react';

const ChangePassword: React.FC = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showLogoutOption, setShowLogoutOption] = useState(false);
  const { addToast } = useToast();
  const { logout } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      addToast('Current password is required', 'error');
      return false;
    }
    
    if (!formData.newPassword) {
      addToast('New password is required', 'error');
      return false;
    }
    
    if (formData.newPassword.length < 6) {
      addToast('New password must be at least 6 characters long', 'error');
      return false;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      addToast('New password and confirmation do not match', 'error');
      return false;
    }
    
    if (formData.currentPassword === formData.newPassword) {
      addToast('New password must be different from current password', 'error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await apiService.changePassword(formData.currentPassword, formData.newPassword);
      addToast('Password changed successfully!', 'success');
      
      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Show logout option for security
      setShowLogoutOption(true);
    } catch (error: any) {
      addToast(error.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="currentPassword"
            name="currentPassword"
            label="Current Password"
            type="password"
            value={formData.currentPassword}
            onChange={handleInputChange}
            placeholder="Enter your current password"
            required
            disabled={loading}
          />
          
          <Input
            id="newPassword"
            name="newPassword"
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={handleInputChange}
            placeholder="Enter your new password"
            required
            disabled={loading}
            subLabel="Password must be at least 6 characters long"
          />
          
          <Input
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm your new password"
            required
            disabled={loading}
          />
          
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </div>
        </form>
        
        {showLogoutOption && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-800">Password Changed Successfully!</h4>
                <p className="text-sm text-green-700 mt-1">
                  For security, we recommend logging out and logging back in with your new password.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  logout();
                  addToast('Logged out successfully. Please log in with your new password.', 'info');
                }}
                className="flex items-center space-x-1 text-green-700 hover:text-green-800"
              >
                <LogOut size={16} />
                <span>Logout Now</span>
              </Button>
            </div>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• At least 6 characters long</li>
            <li>• Must be different from your current password</li>
            <li>• Should be unique and not easily guessable</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default ChangePassword;
