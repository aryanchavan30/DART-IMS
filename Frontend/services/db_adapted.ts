// Compatibility layer that adapts the new frontend to use your Django backend API
// This maintains the same interface as the NeonDB version but uses your API service

import apiService from './apiService.ts';
// Import from your existing types
import {
  User as BackendUser, Role, Department, Candidate as BackendCandidate, 
  Intern as BackendIntern, Stipend as BackendStipend, LeaveRequest as BackendLeaveRequest, 
  ExtensionRequest as BackendExtensionRequest, ExitRequest as BackendExitRequest,
  CandidateStatus, InternStatus, ApprovalStatus, Shift, Holiday, LeaveType, LeaveHalf
} from '../types';

// Import the new frontend types for compatibility
export interface User {
  id: string;
  loginId?: string;
  name: string;
  email: string;
  solarEmail?: string;
  role: Role;
  department?: string; // Backend format
  departmentId?: string; // Frontend format (alias for department)
  departmentName?: string;
  dob: string;
  shift: Shift;
  weekOffs: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  resumeUrl?: string;
  photoUrl?: string;
  signatureUrl?: string;
  lastProjectReportUrl?: string;
  questData: Record<string, any>;
  status: CandidateStatus;
  assigned_mentor?: string; // Backend format
  assignedMentor?: string; // Alias
  assignedMentorId?: string; // Frontend format (alias)
  assignedMentorName?: string;
  department?: string; // Backend format
  departmentId?: string; // Frontend format (alias)
  departmentName?: string;
  interviewFeedback?: string;
  hodFeedback?: string;
  mhrFeedback?: string;
  joiningDate?: string;
  joiningTime?: string;
  joiningLocation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Intern {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  candidateId: string;
  joiningDate: string;
  mentorId?: string;
  mentorName?: string;
  departmentName?: string;
  offerLetterUrl?: string;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    panNumber: string;
  };
  status: InternStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Stipend {
  id: string;
  // Provide both formats for compatibility
  intern: string; // Backend format
  internId: string; // Frontend format
  internName?: string;
  internEmail?: string;
  month: string;
  amount: number;
  // Backend format
  working_days: number;
  leaves_taken: number;
  intern_approval: ApprovalStatus;
  hr_approval: ApprovalStatus;
  hod_approval: ApprovalStatus;
  mhr_approval: ApprovalStatus;
  invoice_url?: string;
  intern_signature_url?: string;
  hr_signature_url?: string;
  created_at?: string;
  updated_at?: string;
  // Frontend format
  workingDays: number;
  leavesTaken: number;
  internApproval: ApprovalStatus;
  hrApproval: ApprovalStatus;
  hodApproval: ApprovalStatus;
  mhrApproval: ApprovalStatus;
  invoiceUrl?: string;
  internSignatureUrl?: string;
  hrSignatureUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveRequest {
  id: string;
  internId: string;
  internName?: string;
  internEmail?: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  leaveHalf?: string;
  reason: string;
  status: ApprovalStatus;
  mailSent: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExtensionRequest {
  id: string;
  internId: string;
  internName?: string;
  internEmail?: string;
  monthsRequested: number;
  reason: string;
  status: ApprovalStatus;
  hrApproval: ApprovalStatus;
  mentorApproval: ApprovalStatus;
  hodApproval: ApprovalStatus;
  mhrApproval: ApprovalStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExitRequest {
  id: string;
  internId: string;
  internName?: string;
  internEmail?: string;
  feedback?: any;
  internshipReportUrl?: string;
  certificateUrl?: string;
  status: ApprovalStatus;
  hrApproval: ApprovalStatus;
  mentorApproval: ApprovalStatus;
  hodApproval: ApprovalStatus;
  mhrApproval: ApprovalStatus;
  hrComments?: string;
  mentorComments?: string;
  hodComments?: string;
  mhrComments?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper function to convert backend response to match frontend expectations
const adaptUser = (user: BackendUser): User => ({
  id: user.id,
  loginId: user.loginId,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department, // Keep original
  departmentId: user.department, // Add camelCase alias
  departmentName: user.departmentName,
  dob: user.dob,
  shift: user.shift,
  weekOffs: user.weekOffs || [0, 6],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const adaptCandidate = (candidate: BackendCandidate): Candidate => ({
  id: candidate.id,
  name: candidate.name,
  email: candidate.email,
  resumeUrl: candidate.resume,
  photoUrl: candidate.photo,
  signatureUrl: candidate.signature,
  lastProjectReportUrl: candidate.last_project_report,
  questData: candidate.questData || {},
  status: candidate.status,
  assigned_mentor: candidate.assigned_mentor, // Backend format
  assignedMentor: candidate.assigned_mentor, // Alias
  assignedMentorId: candidate.assigned_mentor, // Frontend format
  assignedMentorName: candidate.assigned_mentor_name,
  department: candidate.department, // Backend format
  departmentId: candidate.department, // Frontend format
  departmentName: candidate.departmentName,
  interviewFeedback: candidate.interview_feedback,
  hodFeedback: candidate.hod_feedback,
  mhrFeedback: candidate.mhr_feedback,
  joiningDate: candidate.joining_date,
  joiningTime: candidate.joining_time,
  joiningLocation: candidate.joining_location,
  createdAt: candidate.createdAt,
  updatedAt: candidate.updatedAt
});

const adaptIntern = (intern: BackendIntern): Intern => ({
  id: intern.id,
  userId: intern.user,
  userName: intern.userName,
  userEmail: intern.userEmail,
  candidateId: intern.candidate,
  joiningDate: intern.joining_date,
  mentorId: intern.mentor,
  mentorName: intern.mentorName,
  departmentName: intern.departmentName,
  offerLetterUrl: intern.offerLetter,
  bankDetails: intern.bank_details ? {
    accountNumber: intern.bank_details.account_number,
    ifscCode: intern.bank_details.ifsc_code,
    bankName: intern.bank_details.bank_name,
    panNumber: intern.bank_details.pan_number
  } : undefined,
  status: intern.status,
  createdAt: intern.createdAt,
  updatedAt: intern.updatedAt
});

const adaptStipend = (stipend: BackendStipend): any => ({
  id: stipend.id,
  // Provide both formats for maximum compatibility
  intern: stipend.intern, // Backend format
  internId: stipend.intern, // Frontend format
  internName: stipend.intern_name,
  internEmail: stipend.intern_email,
  month: stipend.month,
  amount: Number(stipend.amount),
  // Backend format
  working_days: stipend.working_days,
  leaves_taken: stipend.leaves_taken,
  // Frontend format
  workingDays: stipend.working_days,
  leavesTaken: stipend.leaves_taken,
  comments: stipend.comments || '',
  // Backend format
  intern_approval: stipend.intern_approval,
  hr_approval: stipend.hr_approval,
  hod_approval: stipend.hod_approval,
  mhr_approval: stipend.mhr_approval,
  // Frontend format
  internApproval: stipend.intern_approval,
  hrApproval: stipend.hr_approval,
  hodApproval: stipend.hod_approval,
  mhrApproval: stipend.mhr_approval,
  // Backend format
  invoice_url: stipend.invoice_url,
  intern_signature_url: stipend.intern_signature_url,
  hr_signature_url: stipend.hr_signature_url,
  // Frontend format
  invoiceUrl: stipend.invoice_url,
  internSignatureUrl: stipend.intern_signature_url,
  hrSignatureUrl: stipend.hr_signature_url,
  createdAt: stipend.created_at,
  updatedAt: stipend.updated_at,
  created_at: stipend.created_at,
  updated_at: stipend.updated_at
});

const adaptLeaveRequest = (leave: BackendLeaveRequest): LeaveRequest => ({
  id: leave.id,
  internId: leave.intern,
  internName: leave.intern_name,
  internEmail: leave.intern_email,
  startDate: leave.start_date,
  endDate: leave.end_date,
  leaveType: leave.leave_type,
  leaveHalf: leave.leave_half,
  reason: leave.reason,
  status: leave.status,
  mailSent: leave.mail_sent,
  createdAt: leave.created_at,
  updatedAt: leave.updated_at
});

const adaptExtensionRequest = (extension: BackendExtensionRequest): ExtensionRequest => ({
  id: extension.id,
  internId: extension.intern,
  internName: extension.intern_name,
  internEmail: extension.intern_email,
  monthsRequested: extension.months_requested,
  reason: extension.reason,
  status: extension.status,
  hrApproval: extension.hr_approval,
  mentorApproval: extension.mentor_approval,
  hodApproval: extension.hod_approval,
  mhrApproval: extension.mhr_approval,
  createdAt: extension.created_at,
  updatedAt: extension.updated_at
});

const adaptExitRequest = (exit: BackendExitRequest): ExitRequest => ({
  id: exit.id,
  internId: exit.intern,
  internName: exit.intern_name,
  internEmail: exit.intern_email,
  feedback: exit.feedback,
  internshipReportUrl: exit.internship_report,
  certificateUrl: exit.certificate,
  status: exit.status,
  hrApproval: exit.hr_approval,
  mentorApproval: exit.mentor_approval,
  hodApproval: exit.hod_approval,
  mhrApproval: exit.mhr_approval,
  hrComments: exit.hr_comments,
  mentorComments: exit.mentor_comments,
  hodComments: exit.hod_comments,
  mhrComments: exit.mhr_comments,
  createdAt: exit.created_at,
  updatedAt: exit.updated_at
});

// Add an extended Department interface for the new frontend
interface ExtendedDepartment extends Department {
  hodId?: string; // Frontend format (alias for hod)
  mentorIds?: string[]; // Frontend format (alias for mentors)
}

const adaptDepartment = (dept: Department): ExtendedDepartment => ({
  ...dept,
  hodId: dept.hod, // Frontend alias
  mentorIds: dept.mentors, // Frontend alias
});

// Main db object that mimics the NeonDB interface but uses your backend API
const db = {
  // Direct query method - not supported with API backend
  query: async (sql: string, params: any[] = []) => {
    throw new Error('Direct SQL queries not supported with API backend. Use specific methods.');
  },

  users: {
    find: async (query: Partial<User>): Promise<User[]> => {
      const users = await apiService.getUsers();
      const adaptedUsers = users.map(adaptUser);
      
      // Filter users based on query
      if (Object.keys(query).length === 0) {
        return adaptedUsers;
      }
      
      return adaptedUsers.filter(user => {
        return Object.entries(query).every(([key, value]) => {
          if (key === 'email' && typeof value === 'string') {
            return user.email.toLowerCase() === value.toLowerCase();
          }
          return (user as any)[key] === value;
        });
      });
    },
    
    findById: async (id: string): Promise<User | undefined> => {
      try {
        const user = await apiService.getUserById(id);
        return user ? adaptUser(user) : undefined;
      } catch (error) {
        return undefined;
      }
    },
    
    create: async (data: Partial<Omit<User, 'id'>>): Promise<User> => {
      // Map frontend format to backend format
      const backendData = {
        email: data.email!,
        name: data.name!,
        role: data.role || Role.INTERN,
        department: data.departmentId,
        dob: data.dob,
        shift: data.shift,
        weekOffs: data.weekOffs
      };
      
      const user = await apiService.createUser(backendData);
      return adaptUser(user);
    },

    update: async (id: string, data: Partial<User>): Promise<User> => {
      // Map frontend format to backend format
      const backendData = {
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.departmentId,
        dob: data.dob,
        shift: data.shift,
        weekOffs: data.weekOffs
      };
      
      const user = await apiService.updateUser(id, backendData);
      return adaptUser(user);
    }
  },

  departments: {
    getAll: async (): Promise<ExtendedDepartment[]> => {
      const departments = await apiService.getDepartments();
      return departments.map(adaptDepartment);
    },
    
    findById: async (id: string): Promise<ExtendedDepartment | undefined> => {
      try {
        const department = await apiService.getDepartmentById(id);
        return department ? adaptDepartment(department) : undefined;
      } catch (error) {
        return undefined;
      }
    }
  },

  candidates: {
    getAll: async (): Promise<Candidate[]> => {
      const candidates = await apiService.getCandidates();
      return candidates.map(adaptCandidate);
    },
    
    findById: async (id: string): Promise<Candidate | undefined> => {
      try {
        const candidate = await apiService.getCandidateById(id);
        return candidate ? adaptCandidate(candidate) : undefined;
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
      // Create FormData for file uploads (if needed) or adapt to your API
      const candidateData = {
        name: data.name,
        email: data.email,
        quest_data: data.questData,
        // Note: File URLs would need to be handled differently in a real scenario
        // This is a placeholder for the adaptation
      };
      
      const candidate = await apiService.createCandidate(candidateData);
      return adaptCandidate(candidate);
    },
    
    update: async (id: string, data: Partial<Candidate>): Promise<Candidate> => {
      // Map frontend format to backend format
      const backendData: any = {};
      
      if (data.name !== undefined) backendData.name = data.name;
      if (data.email !== undefined) backendData.email = data.email;
      if (data.status !== undefined) backendData.status = data.status;
      if (data.questData !== undefined) backendData.quest_data = data.questData;
      if (data.resumeUrl !== undefined) backendData.resume = data.resumeUrl;
      if (data.photoUrl !== undefined) backendData.photo = data.photoUrl;
      if (data.signatureUrl !== undefined) backendData.signature = data.signatureUrl;
      if (data.lastProjectReportUrl !== undefined) backendData.last_project_report = data.lastProjectReportUrl;
      if (data.assignedMentor !== undefined) backendData.assigned_mentor = data.assignedMentor;
      if (data.department !== undefined) backendData.department = data.department;
      if (data.interviewFeedback !== undefined) backendData.interview_feedback = data.interviewFeedback;
      if (data.hodFeedback !== undefined) backendData.hod_feedback = data.hodFeedback;
      if (data.mhrFeedback !== undefined) backendData.mhr_feedback = data.mhrFeedback;
      if (data.joiningDate !== undefined) backendData.joining_date = data.joiningDate;
      if (data.joiningTime !== undefined) backendData.joining_time = data.joiningTime;
      if (data.joiningLocation !== undefined) backendData.joining_location = data.joiningLocation;
      
      const candidate = await apiService.updateCandidate(id, backendData);
      return adaptCandidate(candidate);
    },

    assignMentor: async (candidateId: string, mentorId: string): Promise<Candidate> => {
      const candidate = await apiService.assignMentorToCandidate(candidateId, mentorId);
      return adaptCandidate(candidate);
    }
  },

  interns: {
    getAll: async (): Promise<Intern[]> => {
      const interns = await apiService.getInterns();
      return interns.map(adaptIntern);
    },
    
    findById: async (id: string): Promise<Intern | undefined> => {
      try {
        const intern = await apiService.getInternById(id);
        return intern ? adaptIntern(intern) : undefined;
      } catch (error) {
        return undefined;
      }
    },
    
    create: async (data: Omit<Intern, 'id'>): Promise<Intern> => {
      // Intern creation is typically done through candidate onboarding
      throw new Error('Intern creation should be done through candidate onboarding API');
    },
    
    update: async (id: string, data: Partial<Intern>): Promise<Intern> => {
      const backendData: any = {
        status: data.status,
      };

      // Convert camelCase bankDetails to snake_case
      if (data.bankDetails) {
        backendData.bank_details = {
          account_number: data.bankDetails.accountNumber,
          ifsc_code: data.bankDetails.ifscCode,
          bank_name: data.bankDetails.bankName,
          pan_number: data.bankDetails.panNumber
        };
      }
      
      const intern = await apiService.updateIntern(id, backendData);
      return adaptIntern(intern);
    }
  },

  stipends: {
    getAll: async (): Promise<Stipend[]> => {
      const stipends = await apiService.getStipends();
      return stipends.map(adaptStipend);
    },
    
    findById: async (id: string): Promise<Stipend | undefined> => {
      try {
        const stipend = await apiService.getStipendById(id);
        return stipend ? adaptStipend(stipend) : undefined;
      } catch (error) {
        return undefined;
      }
    },
    
    create: async (data: any): Promise<any> => {
      const backendData = {
        intern: data.internId || data.intern,
        month: data.month,
        amount: data.amount,
        working_days: data.workingDays || data.working_days,
        leaves_taken: data.leavesTaken || data.leaves_taken,
        comments: data.comments || '',
      };
      
      const stipend = await apiService.createStipend(backendData);
      return adaptStipend(stipend);
    },
    
    update: async (id: string, data: any): Promise<any> => {
      // For stipend updates, typically use approval endpoints
      if (Object.keys(data).some(key => key.includes('Approval') || key.includes('approval'))) {
        // This is an approval update
        await apiService.approveStipend(id);
        const stipend = await apiService.getStipendById(id);
        return adaptStipend(stipend);
      }
      
      throw new Error('Generic stipend updates not supported. Use approval methods.');
    }
  },

  leaves: {
    getAll: async (): Promise<LeaveRequest[]> => {
      const leaves = await apiService.getLeaveRequests();
      return leaves.map(adaptLeaveRequest);
    },
    
    create: async (data: Omit<LeaveRequest, 'id'>): Promise<LeaveRequest> => {
      const backendData = {
        intern: data.internId,
        start_date: data.startDate,
        end_date: data.endDate,
        leave_type: data.leaveType,
        leave_half: data.leaveHalf as LeaveHalf,
        reason: data.reason,
        status: data.status,
        mail_sent: data.mailSent
      };
      
      const leave = await apiService.createLeaveRequest(backendData);
      return adaptLeaveRequest(leave);
    },
    
    update: async (id: string, data: Partial<LeaveRequest>): Promise<LeaveRequest> => {
      const backendData = {
        status: data.status,
        // Map other updatable fields
      };
      
      const leave = await apiService.updateLeaveRequest(id, backendData);
      return adaptLeaveRequest(leave);
    }
  },

  extensions: {
    getAll: async (): Promise<ExtensionRequest[]> => {
      const extensions = await apiService.getExtensionRequests();
      return extensions.map(adaptExtensionRequest);
    },
    
    create: async (data: Omit<ExtensionRequest, 'id'>): Promise<ExtensionRequest> => {
      const backendData = {
        intern: data.internId,
        months_requested: data.monthsRequested,
        reason: data.reason,
        status: data.status || ApprovalStatus.PENDING
      };
      
      const extension = await apiService.createExtensionRequest(backendData);
      return adaptExtensionRequest(extension);
    },
    
    update: async (id: string, data: Partial<ExtensionRequest>): Promise<ExtensionRequest> => {
      const backendData = {
        status: data.status,
        hr_approval: data.hrApproval,
        mentor_approval: data.mentorApproval,
        hod_approval: data.hodApproval,
        mhr_approval: data.mhrApproval
      };
      
      const extension = await apiService.updateExtensionRequest(id, backendData);
      return adaptExtensionRequest(extension);
    }
  },

  exits: {
    getAll: async (): Promise<ExitRequest[]> => {
      const exits = await apiService.getExitRequests();
      return exits.map(adaptExitRequest);
    },
    
    create: async (data: Omit<ExitRequest, 'id'>): Promise<ExitRequest> => {
      const backendData = {
        intern: data.internId,
        feedback: data.feedback,
        internship_report: data.internshipReportUrl,
        certificate: data.certificateUrl,
        status: data.status || ApprovalStatus.PENDING
      };
      
      const exit = await apiService.createExitRequest(backendData);
      return adaptExitRequest(exit);
    },
    
    update: async (id: string, data: Partial<ExitRequest>): Promise<ExitRequest> => {
      const backendData = {
        status: data.status,
        hr_approval: data.hrApproval,
        mentor_approval: data.mentorApproval,
        hod_approval: data.hodApproval,
        mhr_approval: data.mhrApproval,
        hr_comments: data.hrComments,
        mentor_comments: data.mentorComments,
        hod_comments: data.hodComments,
        mhr_comments: data.mhrComments
      };
      
      const exit = await apiService.updateExitRequest(id, backendData);
      return adaptExitRequest(exit);
    }
  },

  holidays: {
    getAll: async (): Promise<Holiday[]> => {
      return await apiService.getHolidays();
    }
  }
};

export default db;
