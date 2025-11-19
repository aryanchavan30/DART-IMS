
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { BellIcon, SettingsIcon, LogOutIcon, MenuIcon } from '../icons';
import Button from '../ui/Button';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
             <button 
                onClick={toggleSidebar} 
                className="p-2 rounded-full text-secondary-blue hover:bg-light-gray focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red"
                aria-label="Toggle sidebar"
              >
                <MenuIcon />
             </button>
             <h1 className="text-lg font-bold text-primary-navy hidden sm:block">Intern Management System</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full text-secondary-blue hover:bg-light-gray hover:text-primary-navy">
              <BellIcon />
            </button>
            <button className="p-2 rounded-full text-secondary-blue hover:bg-light-gray hover:text-primary-navy">
              <SettingsIcon />
            </button>
            <div className="flex items-center">
                <img className="h-9 w-9 rounded-full" src={`https://i.pravatar.cc/150?u=${user?.id}`} alt="User avatar" />
                <div className="ml-3">
                    <p className="text-sm font-medium text-primary-navy">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.role}</p>
                </div>
            </div>
             <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOutIcon />
                <span className="ml-2 hidden sm:inline">Logout</span>
             </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
