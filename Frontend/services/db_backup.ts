import apiService from './apiService.ts';
import {
  User, Role, Department, Candidate, Intern, Stipend, LeaveRequest, ExtensionRequest, ExitRequest,
  CandidateStatus, InternStatus, ApprovalStatus, Shift, Holiday, LeaveType
} from '../types';

// This is a compatibility layer to maintain the existing interface
// while using the new API service under the hood
const db = {
  users: {
    find: async (query: Partial<User>): Promise<User[]> => {
      const users = await apiService.getUsers();
      
      // Add backward compatibility mapping
      const mappedUsers = users.map(user => ({
        ...user,
        departmentId: user.department, // Map new property to old
        loginId: user.loginId
      }));
      
      // Filter users based on query
      if (Object.keys(query).length === 0) {
        return mappedUsers;
      }
      
      return mappedUsers.filter(user => {
        return Object.entries(query).every(([key, value]) => {
          if (key === 'email' && typeof value === 'string') {
            return user.email.toLowerCase() === value.toLowerCase();
          }
          // Handle backward compatibility
          if (key === 'departmentId') {
            return user.department === value;
          }
          return (user as any)[key] === value;
        });
      });
    },
    
    findById: async (id: string): Promise<User | undefined> => {
      try {
        return await apiService.getUserById(id);
      } catch (error) {
        return undefined;
      }
    },
    
    create: async (data: Partial<Omit<User, 'id'>>): Promise<User> => {
      return await apiService.createUser(data);
    }
  },
  
  departments: {
    getAll: async (): Promise<Department[]> => {
      return await apiService.getDepartments();
    },
    
    findById: async (id: string): Promise<Department | undefined> => {
      try {
        return await apiService.getDepartmentById(id);
      } catch (error) {
        return undefined;
      }
    }
  },
  
  candidates: {
    getAll: async (): Promise<Candidate[]> => {
      return await apiService.getCandidates();
    },
    
    findById: async (id: string): Promise<Candidate | undefined> => {
      try {
        return await apiService.getCandidateById(id);
      } catch (error) {
        return undefined;
      }
    },
    
    create: async (data: {
      name: string;
      email: string;
      resumeUrl: string;
      photoUrl: string;
      signatureUrl: string;
      lastProjectReportUrl: string;
      questData: Record<string, any>;
    }): Promise<Candidate> => {
      // Convert the data format to match what the API expects
      const candidateData = {
        name: data.name,
        email: data.email,
        resume: data.resumeUrl, // This would be a File object in real usage
        photo: data.photoUrl, // This would be a File object in real usage
        signature: data.signatureUrl, // This would be a File object in real usage
        last_project_report: data.lastProjectReportUrl, // This would be a File object in real usage
        quest_data: data.questData
      };
      
      return await apiService.createCandidate(candidateData);
    },
    
    update: async (id: string, data: Partial<Candidate>): Promise<Candidate> => {
      // For now, we'll handle updates through specific API endpoints
      // This would need to be implemented based on what updates are needed
      throw new Error('Generic candidate update not implemented. Use specific API methods.');
    }
  },
  
  interns: {
    getAll: async (): Promise<Intern[]> => {
      return await apiService.getInterns();
    },
    
    findById: async (id: string): Promise<Intern | undefined> => {
      try {
        return await apiService.getInternById(id);
      } catch (error) {
        return undefined;
      }
    },
    
    create: async (data: Omit<Intern, 'id'>): Promise<Intern> => {
      // This would typically be done through the onboarding process
      throw new Error('Direct intern creation not supported. Use candidate onboarding.');
    },
    
    update: async (id: string, data: Partial<Intern>): Promise<Intern> => {
      return await apiService.updateIntern(id, data);
    }
  },
  
  stipends: {
    getAll: async (): Promise<Stipend[]> => {
      return await apiService.getStipends();
    },
    
    findById: async (id: string): Promise<Stipend | undefined> => {
      try {
        return await apiService.getStipendById(id);
      } catch (error) {
        return undefined;
      }
    },
    
    create: async (data: Omit<Stipend, 'id'>): Promise<Stipend> => {
      return await apiService.createStipend(data);
    },
    
    update: async (id: string, data: Partial<Stipend>): Promise<Stipend> => {
      // For stipend updates, we typically use the approval endpoints
      if ('intern_approval' in data || 'hr_approval' in data || 'hod_approval' in data || 'mhr_approval' in data) {
        return await apiService.approveStipend(id);
      }
      // For other updates, we'd need a generic update endpoint
      throw new Error('Generic stipend update not implemented. Use approval endpoints.');
    }
  },
  
  leaves: {
    getAll: async (): Promise<LeaveRequest[]> => {
      return await apiService.getLeaveRequests();
    },
    
    create: async (data: Omit<LeaveRequest, 'id'>): Promise<LeaveRequest> => {
      return await apiService.createLeaveRequest(data);
    },
    
    update: async (id: string, data: Partial<LeaveRequest>): Promise<LeaveRequest> => {
      return await apiService.updateLeaveRequest(id, data);
    }
  },
  
  extensions: {
    getAll: async (): Promise<ExtensionRequest[]> => {
      return await apiService.getExtensionRequests();
    },
    
    create: async (data: Omit<ExtensionRequest, 'id'>): Promise<ExtensionRequest> => {
      return await apiService.createExtensionRequest(data);
    },
    
    update: async (id: string, data: Partial<ExtensionRequest>): Promise<ExtensionRequest> => {
      // Similar to stipends, extension updates would typically be approvals
      throw new Error('Generic extension update not implemented. Use approval endpoints.');
    }
  },
  
  exits: {
    getAll: async (): Promise<ExitRequest[]> => {
      return await apiService.getExitRequests();
    },
    
    create: async (data: Omit<ExitRequest, 'id'>): Promise<ExitRequest> => {
      return await apiService.createExitRequest(data);
    }
  },
  
  holidays: {
    getAll: async (): Promise<Holiday[]> => {
      return await apiService.getHolidays();
    }
  },
  
  // Helper method for direct query execution (deprecated)
  query: async (sql: string, params: any[] = []) => {
    throw new Error('Direct SQL queries not supported with API backend. Use specific methods.');
  }
};

export default db;