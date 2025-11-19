import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Card from '../ui/Card';

const InternProfileDebug: React.FC = () => {
  const { user, internProfile, refreshInternProfile } = useAuth();

  if (user?.role !== 'Intern') {
    return null;
  }

  const handleRefresh = async () => {
    try {
      await refreshInternProfile();
      console.log('Manual refresh completed');
    } catch (error) {
      console.error('Manual refresh failed:', error);
    }
  };

  return (
    <Card className="mb-4 border-2 border-blue-200 bg-blue-50">
      <h3 className="text-lg font-semibold text-blue-800 mb-3">🔧 Debug: Intern Profile Status</h3>
      <div className="space-y-2 text-sm">
        <div>
          <strong>User ID:</strong> {user?.id}
        </div>
        <div>
          <strong>User Name:</strong> {user?.name}
        </div>
        <div>
          <strong>Intern Profile Loaded:</strong> {internProfile ? 'Yes' : 'No'}
        </div>
        {internProfile && (
          <>
            <div>
              <strong>Intern ID:</strong> {internProfile.id}
            </div>
            <div className={`font-bold ${internProfile.extension_allowed ? 'text-green-600' : 'text-red-600'}`}>
              <strong>Extension Allowed:</strong> {internProfile.extension_allowed ? 'YES ✅' : 'NO ❌'}
            </div>
          </>
        )}
        <div className="pt-2">
          <Button onClick={handleRefresh} size="sm">
            🔄 Refresh Profile
          </Button>
        </div>
        <div className="text-xs text-blue-600">
          Note: This debug component will automatically refresh every 2 minutes or when you switch back to this tab.
        </div>
      </div>
    </Card>
  );
};

export default InternProfileDebug;