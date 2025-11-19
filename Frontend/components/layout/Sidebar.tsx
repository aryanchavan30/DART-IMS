
import React, { useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Role } from '../../types';
import { HomeIcon, UserPlusIcon, ClipboardListIcon, BriefcaseIcon, DollarSignIcon, IndianRupeeIcon, CalendarIcon, LogOutIcon, MilestoneIcon, UserCheckIcon, PieChartIcon } from '../icons';

const commonLinks = [
  { to: '/dashboard', icon: <HomeIcon />, label: 'Dashboard' },
];

const profileLink = { to: '/profile', icon: <BriefcaseIcon />, label: 'My Profile' };

const roleLinks = {
  [Role.HR]: [
    profileLink,
    { to: '/candidates', icon: <UserPlusIcon />, label: 'Candidate Pipeline' },
    { to: '/onboarding', icon: <UserCheckIcon />, label: 'Onboarding' },
    { to: '/interns', icon: <BriefcaseIcon />, label: 'All Interns' },
    { to: '/stipends', icon: <IndianRupeeIcon />, label: 'Stipends' },
    { to: '/leaves', icon: <CalendarIcon />, label: 'Leave History' },
    { to: '/extensions', icon: <MilestoneIcon />, label: 'Extensions' },
    { to: '/extension-permissions', icon: <MilestoneIcon />, label: 'Extension Permissions' },
    { to: '/exit', icon: <LogOutIcon />, label: 'Exit Process' },
  ],
  [Role.MENTOR]: [
    profileLink,
    { to: '/interviews', icon: <ClipboardListIcon />, label: 'My Interviews' },
    { to: '/interns', icon: <BriefcaseIcon />, label: 'My Interns' },
    { to: '/leaves', icon: <CalendarIcon />, label: 'Leave History' },
    { to: '/extensions', icon: <MilestoneIcon />, label: 'Extensions' },
    { to: '/exit', icon: <LogOutIcon />, label: 'Exit Process' },
  ],
  [Role.HOD]: [
    profileLink,
    { to: '/hod-approvals', icon: <UserPlusIcon />, label: 'Approve Candidates' },
    { to: '/interns', icon: <BriefcaseIcon />, label: 'My Department Interns' },
    { to: '/stipends', icon: <IndianRupeeIcon />, label: 'Approve Stipends' },
    { to: '/leaves', icon: <CalendarIcon />, label: 'Leave History' },
    { to: '/extensions', icon: <MilestoneIcon />, label: 'Extensions' },
    { to: '/extension-permissions', icon: <MilestoneIcon />, label: 'Extension Permissions' },
    { to: '/exit', icon: <LogOutIcon />, label: 'Exit Process' },
  ],
  // Intern links are now handled dynamically
  [Role.INTERN]: [],
};

const NavItem: React.FC<{ to: string, icon: React.ReactNode, label: string, isCollapsed: boolean }> = ({ to, icon, label, isCollapsed }) => {
  const navLinkClass = `flex items-center py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isCollapsed ? 'px-3 justify-center' : 'px-4'}`;
  const activeClass = "bg-primary-red text-white shadow-md";
  const inactiveClass = "text-light-gray hover:bg-secondary-blue hover:text-white";

  return (
    <li>
      <ReactRouterDOM.NavLink 
        to={to} 
        className={({ isActive }) => `${navLinkClass} ${isActive ? activeClass : inactiveClass}`}
        title={isCollapsed ? label : undefined}
      >
        <span className={!isCollapsed ? 'mr-3' : ''}>{icon}</span>
        {!isCollapsed && <span>{label}</span>}
      </ReactRouterDOM.NavLink>
    </li>
  );
};

interface SidebarProps {
    isCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const { user, internProfile } = useAuth();
  
  const links = useMemo(() => {
    if (!user) return commonLinks;

    if (user.role === Role.INTERN) {
        const internNavLinks = [
            { to: '/profile', icon: <BriefcaseIcon />, label: 'My Profile' },
            { to: '/attendance', icon: <CalendarIcon />, label: 'My Attendance' },
            { to: '/stipends', icon: <IndianRupeeIcon />, label: 'My Stipends' },
            { to: '/leaves', icon: <CalendarIcon />, label: 'Request Leave' },
        ];
        
        if (internProfile?.extension_allowed) {
            internNavLinks.push({ to: '/extensions', icon: <MilestoneIcon />, label: 'Request Extension' });
        }

        internNavLinks.push({ to: '/exit', icon: <LogOutIcon />, label: 'Request Exit' });
        return [...commonLinks, ...internNavLinks];
    }
    
    return [...commonLinks, ...(roleLinks[user.role] || [])];
  }, [user, internProfile]);

  return (
    <div className={`flex-shrink-0 bg-primary-navy shadow-lg transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-center h-16 border-b border-secondary-blue">
         <span className="text-xl font-bold text-white overflow-hidden">{isCollapsed ? 'I' : 'IMS'}</span>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {links.map(link => <NavItem key={link.to} {...link} isCollapsed={isCollapsed} />)}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
