import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Role } from '../../types';
import Card from '../ui/Card';
import { 
  UserPlusIcon, 
  ClipboardListIcon, 
  IndianRupeeIcon, 
  BriefcaseIcon,
  FileTextIcon,
  SettingsIcon
} from '../icons';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  description: string;
}

const QuickActions: React.FC = () => {
  const { user } = useAuth();

  const getQuickActionsByRole = (): QuickAction[] => {
    switch (user?.role) {
      case Role.HR:
      case Role.MHR:
        return [
          {
            label: 'Add Candidate',
            icon: <UserPlusIcon className="w-5 h-5" />,
            href: '/candidates/#candidates/new',
            color: 'bg-blue-500 hover:bg-blue-600',
            description: 'Register new candidate'
          },
          {
            label: 'View Candidates',
            icon: <ClipboardListIcon className="w-5 h-5" />,
            href: '/#candidates',
            color: 'bg-green-500 hover:bg-green-600',
            description: 'Review applications'
          },
          {
            label: 'Onboard Intern',
            icon: <BriefcaseIcon className="w-5 h-5" />,
            href: '/#onboarding',
            color: 'bg-purple-500 hover:bg-purple-600',
            description: 'Complete onboarding'
          },
          {
            label: 'Manage Stipends',
            icon: <IndianRupeeIcon className="w-5 h-5" />,
            href: '/#stipends',
            color: 'bg-yellow-500 hover:bg-yellow-600',
            description: 'Process payments'
          }
        ];
        
      case Role.HOD:
        return [
          {
            label: 'Review Candidates',
            icon: <ClipboardListIcon className="w-5 h-5" />,
            href: '/candidates',
            color: 'bg-green-500 hover:bg-green-600',
            description: 'Approve candidates'
          },
          {
            label: 'Approve Stipends',
            icon: <IndianRupeeIcon className="w-5 h-5" />,
            href: '/stipends',
            color: 'bg-yellow-500 hover:bg-yellow-600',
            description: 'Review payments'
          },
          {
            label: 'View Interns',
            icon: <BriefcaseIcon className="w-5 h-5" />,
            href: '/interns',
            color: 'bg-blue-500 hover:bg-blue-600',
            description: 'Manage department interns'
          },
          {
            label: 'Extensions & Exits',
            icon: <FileTextIcon className="w-5 h-5" />,
            href: '/extensions',
            color: 'bg-purple-500 hover:bg-purple-600',
            description: 'Process requests'
          }
        ];
        
      case Role.MENTOR:
        return [
          {
            label: 'Interview Queue',
            icon: <ClipboardListIcon className="w-5 h-5" />,
            href: '/interviews',
            color: 'bg-blue-500 hover:bg-blue-600',
            description: 'Conduct interviews'
          },
          {
            label: 'My Mentees',
            icon: <BriefcaseIcon className="w-5 h-5" />,
            href: '/interns',
            color: 'bg-green-500 hover:bg-green-600',
            description: 'Track intern progress'
          },
          {
            label: 'View Candidates',
            icon: <UserPlusIcon className="w-5 h-5" />,
            href: '/candidates',
            color: 'bg-purple-500 hover:bg-purple-600',
            description: 'Review assigned candidates'
          }
        ];
        
      case Role.INTERN:
        return [
          {
            label: 'My Profile',
            icon: <SettingsIcon className="w-5 h-5" />,
            href: '/profile',
            color: 'bg-blue-500 hover:bg-blue-600',
            description: 'Update information'
          },
          {
            label: 'View Stipends',
            icon: <IndianRupeeIcon className="w-5 h-5" />,
            href: '/stipends',
            color: 'bg-green-500 hover:bg-green-600',
            description: 'Check payments'
          },
          {
            label: 'Attendance',
            icon: <ClipboardListIcon className="w-5 h-5" />,
            href: '/attendance',
            color: 'bg-purple-500 hover:bg-purple-600',
            description: 'Mark attendance'
          }
        ];
        
      default:
        return [];
    }
  };

  const quickActions = getQuickActionsByRole();

  if (quickActions.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Quick Actions</h3>
        <p className="text-sm text-slate-500">Frequently used features</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action, index) => (
          <a
            key={index}
            href={action.href}
            className={`${action.color} text-white p-4 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg group`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 group-hover:scale-110 transition-transform duration-200">
                {action.icon}
              </div>
              <div className="font-medium text-sm mb-1">{action.label}</div>
              <div className="text-xs opacity-90 leading-tight">{action.description}</div>
            </div>
          </a>
        ))}
      </div>
    </Card>
  );
};

export default QuickActions;
