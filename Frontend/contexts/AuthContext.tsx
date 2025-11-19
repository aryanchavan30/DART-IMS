import React, { createContext, useState, useMemo, ReactNode, useCallback, useEffect } from 'react';
import { User, Intern, Role } from '../types';
import apiService from '../services/apiService.ts';

interface AuthContextType {
  user: User | null;
  internProfile: Intern | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshInternProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [internProfile, setInternProfile] = useState<Intern | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const currentUser = await apiService.getCurrentUser();
          setUser(currentUser);
          
          // If user is an intern, fetch their intern profile
          if (currentUser.role === Role.INTERN) {
            try {
              const interns = await apiService.getInterns();
              const userInternProfile = interns.find((intern: Intern) => intern.user === currentUser.id);
              setInternProfile(userInternProfile || null);
            } catch (internError) {
              console.error('Failed to fetch intern profile:', internError);
              setInternProfile(null);
            }
          }
        } catch (error) {
          // Token might be expired, try to refresh
          try {
            await apiService.refreshToken();
            const currentUser = await apiService.getCurrentUser();
            setUser(currentUser);
            
            // If user is an intern, fetch their intern profile
            if (currentUser.role === Role.INTERN) {
              try {
                const interns = await apiService.getInterns();
                const userInternProfile = interns.find((intern: Intern) => intern.user === currentUser.id);
                setInternProfile(userInternProfile || null);
              } catch (internError) {
                console.error('Failed to fetch intern profile:', internError);
                setInternProfile(null);
              }
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens
            apiService.logout();
          }
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);


  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login(email, password);
      setUser(response.user);
      
      // If user is an intern, fetch their intern profile
      if (response.user.role === Role.INTERN) {
        try {
          const interns = await apiService.getInterns();
          const userInternProfile = interns.find((intern: Intern) => intern.user === response.user.id);
          setInternProfile(userInternProfile || null);
        } catch (internError) {
          console.error('Failed to fetch intern profile during login:', internError);
          setInternProfile(null);
        }
      } else {
        setInternProfile(null);
      }
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, []);
  
  const refreshInternProfile = useCallback(async () => {
    if (!user || user.role !== Role.INTERN) {
      return;
    }

    try {
      const interns = await apiService.getInterns();
      const userInternProfile = interns.find((intern: Intern) => intern.user === user.id);
      setInternProfile(userInternProfile || null);
      console.log('Intern profile refreshed:', userInternProfile?.extension_allowed);
    } catch (error) {
      console.error('Failed to refresh intern profile:', error);
    }
  }, [user]);

  // Auto-refresh intern profile periodically for intern users
  useEffect(() => {
    if (!user || user.role !== Role.INTERN) {
      return;
    }

    // Refresh intern profile every 2 minutes to catch permission changes
    const refreshInterval = setInterval(() => {
      // Only refresh if the page is visible to avoid unnecessary API calls
      if (document.visibilityState === 'visible') {
        refreshInternProfile();
      }
    }, 2 * 60 * 1000); // 2 minutes

    // Also refresh when the page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshInternProfile();
      }
    };

    // Refresh when the page gains focus (additional trigger)
    const handleFocus = () => {
      refreshInternProfile();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Initial refresh when setting up the effect
    refreshInternProfile();

    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, refreshInternProfile]);

  const logout = useCallback(() => {
    apiService.logout();
    setUser(null);
    setInternProfile(null);
  }, []);

  const value = useMemo(() => ({
    user,
    internProfile,
    isLoading,
    login,
    logout,
    refreshInternProfile,
  }), [user, internProfile, isLoading, login, logout, refreshInternProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};