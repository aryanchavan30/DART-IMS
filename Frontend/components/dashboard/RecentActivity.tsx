import React from 'react';
import Card from '../ui/Card';
import { UserPlusIcon, BriefcaseIcon, ClipboardListIcon, CheckCircleIcon } from '../icons';

interface ActivityItem {
  type: string;
  message: string;
  timestamp: string;
  user: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'candidate':
        return <UserPlusIcon className="w-4 h-4" />;
      case 'intern':
        return <BriefcaseIcon className="w-4 h-4" />;
      case 'approval':
        return <CheckCircleIcon className="w-4 h-4" />;
      default:
        return <ClipboardListIcon className="w-4 h-4" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'candidate':
        return 'text-blue-600 bg-blue-100';
      case 'intern':
        return 'text-green-600 bg-green-100';
      case 'approval':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    // For now, we'll show a simple relative time
    // In a real app, you'd parse and format the actual timestamp
    return 'Just now';
  };

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
      </div>
      
      {activities.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <ClipboardListIcon className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`p-2 rounded-full ${getIconColor(activity.type)}`}>
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800">{activity.message}</p>
                <div className="flex items-center text-xs text-slate-500 mt-1">
                  <span>by {activity.user}</span>
                  <span className="mx-1">•</span>
                  <span>{formatTimestamp(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-slate-200">
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View all activity
        </button>
      </div>
    </Card>
  );
};

export default RecentActivity;
