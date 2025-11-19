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

// Helper: convert snake_case keys to camelCase recursively (shallow + arrays)
const snakeToCamel = (str: string): string => str.replace(/_([a-z])/g, (_, g1) => g1.toUpperCase());
const camelToSnake = (str: string): string => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const keysToCamel = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(keysToCamel);
  if (typeof obj !== 'object') return obj;
  // Avoid converting File or Date-like objects
  if (typeof (obj as any).append === 'function' || obj instanceof Date) return obj;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[snakeToCamel(k)] = keysToCamel(v);
  }
  return out;
};
const keysToSnake = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(keysToSnake);
  if (typeof obj !== 'object') return obj;
  if (typeof (obj as any).append === 'function' || obj instanceof Date) return obj;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[camelToSnake(k)] = keysToSnake(v);
  }
  return out;
};

// Import the new frontend types for compatibility
export interface User {
  id: string;
  loginId?: string;
  name: string;
  email: string;
  solarEmail?: string;
  role: Role;
  departmentId?: string;
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
  assignedMentor?: string;
  assignedMentorId?: string;
  assignedMentorName?: string;
  department?: string;
  departmentName?: string;
  interviewFeedback?: string;
  hodFeedback?: string;
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
  extensionAllowed?: boolean;
  department?: string;
  // Onboarding documents
  aadharCardUrl?: string;
  panCardUrl?: string;
  bankPassbookUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Stipend {
  id: string;
  internId: string;
  internName?: string;
  internEmail?: string;
  month: string;
  amount: number;
  workingDays: number;
  leavesTaken: number;
  comments: string;
  internApproval: ApprovalStatus;
  hrApproval: ApprovalStatus;
  hodApproval: ApprovalStatus;
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
  hrComments?: string;
  mentorComments?: string;
  hodComments?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper function to convert backend response to match frontend expectations
const adaptUser = (user: BackendUser): User => ({
  id: user.id,
  loginId: (user as any).login_id ?? (user as any).loginId,
  name: user.name,
  email: user.email,
  solarEmail: (user as any).solar_email ?? (user as any).solarEmail,
  role: user.role,
  departmentId: (user as any).department,
  departmentName: (user as any).department_name ?? (user as any).departmentName,
  dob: (user as any).dob,
  shift: (user as any).shift,
  weekOffs: (user as any).week_offs ?? (user as any).weekOffs ?? [0, 6],
  createdAt: (user as any).created_at ?? (user as any).createdAt,
  updatedAt: (user as any).updated_at ?? (user as any).updatedAt
});

const adaptCandidate = (candidate: BackendCandidate): Candidate => ({
  id: (candidate as any).id,
  name: (candidate as any).name,
  email: (candidate as any).email,
  resumeUrl: (candidate as any).resume,
  photoUrl: (candidate as any).photo,
  signatureUrl: (candidate as any).signature,
  lastProjectReportUrl: (candidate as any).last_project_report,
  questData: keysToCamel((candidate as any).quest_data ?? (candidate as any).questData ?? {}),
  status: (candidate as any).status,
  assignedMentor: (candidate as any).assigned_mentor_id,
  assignedMentorId: (candidate as any).assigned_mentor_id,
  assignedMentorName: (candidate as any).assigned_mentor_name,
  department: (candidate as any).department,
  departmentName: (candidate as any).department_name ?? (candidate as any).departmentName,
  interviewFeedback: (candidate as any).interview_feedback,
  hodFeedback: (candidate as any).hod_feedback,
  joiningDate: (candidate as any).joining_date,
  joiningTime: (candidate as any).joining_time,
  joiningLocation: (candidate as any).joining_location,
  createdAt: (candidate as any).created_at ?? (candidate as any).createdAt,
  updatedAt: (candidate as any).updated_at ?? (candidate as any).updatedAt
});

const adaptIntern = (intern: BackendIntern): Intern => ({
  id: (intern as any).id,
  userId: (intern as any).user,
  userName: (intern as any).user_name ?? (intern as any).userName,
  userEmail: (intern as any).user_email ?? (intern as any).userEmail,
  candidateId: (intern as any).candidate,
  joiningDate: (intern as any).joining_date,
  mentorId: (intern as any).mentor,
  department: (intern as any).department ?? (intern as any).department,
  mentorName: (intern as any).mentor_name ?? (intern as any).mentorName,
  departmentName: (intern as any).department_name ?? (intern as any).departmentName,
  offerLetterUrl: (intern as any).offer_letter ?? (intern as any).offerLetter,
  bankDetails: (intern as any).bank_details ? {
    accountNumber: (intern as any).bank_details.account_number,
    ifscCode: (intern as any).bank_details.ifsc_code,
    bankName: (intern as any).bank_details.bank_name,
    panNumber: (intern as any).bank_details.pan_number
  } : undefined,
  status: (intern as any).status,
  extensionAllowed: (intern as any).extension_allowed ?? (intern as any).extensionAllowed ?? false,
  // Onboarding documents
  aadharCardUrl: (intern as any).aadhar_card ?? (intern as any).aadharCard,
  panCardUrl: (intern as any).pan_card ?? (intern as any).panCard,
  bankPassbookUrl: (intern as any).bank_passbook ?? (intern as any).bankPassbook,
  createdAt: (intern as any).created_at ?? (intern as any).createdAt,
  updatedAt: (intern as any).updated_at ?? (intern as any).updatedAt
});

const adaptStipend = (stipend: BackendStipend): Stipend => ({
  id: (stipend as any).id,
  internId: (stipend as any).intern,
  internName: (stipend as any).intern_name,
  internEmail: (stipend as any).intern_email,
  month: (stipend as any).month,
  amount: Number((stipend as any).amount),
  workingDays: (stipend as any).working_days,
  leavesTaken: (stipend as any).leaves_taken,
  comments: (stipend as any).comments || '',
  internApproval: (stipend as any).intern_approval,
  hrApproval: (stipend as any).hr_approval,
  hodApproval: (stipend as any).hod_approval,
  invoiceUrl: (stipend as any).invoice_url,
  internSignatureUrl: (stipend as any).intern_signature_url,
  hrSignatureUrl: (stipend as any).hr_signature_url,
  createdAt: (stipend as any).created_at,
  updatedAt: (stipend as any).updated_at
});

const adaptLeaveRequest = (leave: BackendLeaveRequest): LeaveRequest => ({
  id: (leave as any).id,
  internId: (leave as any).intern,
  internName: (leave as any).intern_name,
  internEmail: (leave as any).intern_email,
  startDate: (leave as any).start_date,
  endDate: (leave as any).end_date,
  leaveType: (leave as any).leave_type,
  leaveHalf: (leave as any).leave_half,
  reason: (leave as any).reason,
  status: (leave as any).status,
  mailSent: (leave as any).mail_sent,
  createdAt: (leave as any).created_at,
  updatedAt: (leave as any).updated_at
});

const adaptExtensionRequest = (extension: BackendExtensionRequest): ExtensionRequest => ({
  id: (extension as any).id,
  internId: (extension as any).intern,
  internName: (extension as any).intern_name,
  internEmail: (extension as any).intern_email,
  monthsRequested: (extension as any).months_requested,
  reason: (extension as any).reason,
  status: (extension as any).status,
  hrApproval: (extension as any).hr_approval,
  hrComments: (extension as any).hr_comments,
  mentorApproval: (extension as any).mentor_approval,
  mentorComments: (extension as any).mentor_comments,
  hodApproval: (extension as any).hod_approval,
  hodComments: (extension as any).hod_comments,
  mhrApproval: (extension as any).mhr_approval,
  mhrComments: (extension as any).mhr_comments,
  createdAt: (extension as any).created_at,
  updatedAt: (extension as any).updated_at
});

const adaptExitRequest = (exit: BackendExitRequest): ExitRequest => ({
  id: (exit as any).id,
  internId: (exit as any).intern,
  internName: (exit as any).intern_name,
  internEmail: (exit as any).intern_email,
  feedback: (exit as any).feedback,
  internshipReportUrl: (exit as any).internship_report,
  certificateUrl: (exit as any).certificate,
  status: (exit as any).status,
  hrApproval: (exit as any).hr_approval,
  mentorApproval: (exit as any).mentor_approval,
  hodApproval: (exit as any).hod_approval,
  hrComments: (exit as any).hr_comments,
  mentorComments: (exit as any).mentor_comments,
  hodComments: (exit as any).hod_comments,
  createdAt: (exit as any).created_at,
  updatedAt: (exit as any).updated_at
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
      const backendData: any = {};

      // Only include fields that are provided
      if (data.name !== undefined) backendData.name = data.name;
      if (data.email !== undefined) backendData.email = data.email;
      if (data.solarEmail !== undefined) backendData.solar_email = data.solarEmail;
      if (data.loginId !== undefined) backendData.login_id = data.loginId;
      if (data.role !== undefined) backendData.role = data.role;
      if (data.departmentId !== undefined) backendData.department = data.departmentId;
      if (data.dob !== undefined) backendData.dob = data.dob;
      if (data.shift !== undefined) backendData.shift = data.shift;
      if (data.weekOffs !== undefined) backendData.week_offs = data.weekOffs;

      // Debug: Log the data being sent
      console.log('Updating user with data:', backendData);

      try {
        const user = await apiService.updateUser(id, backendData);
        return adaptUser(user);
      } catch (error: any) {
        console.error('User update error:', error);
        // Re-throw with more context
        throw new Error(`Failed to update user: ${error.message || 'Unknown error'}`);
      }
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
      resume?: File | null;
      photo?: File | null;
      signature?: File | null;
      last_project_report?: File | null;
      quest_data: Record<string, any>;
    }): Promise<Candidate> => {
      // Pass the data directly to apiService which handles FormData properly
      const candidateData = {
        name: data.name,
        email: data.email,
        resume: data.resume,
        photo: data.photo,
        signature: data.signature,
        last_project_report: data.last_project_report,
        quest_data: data.quest_data,
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
      if (data.joiningDate !== undefined) backendData.joining_date = data.joiningDate;
      if (data.joiningTime !== undefined) backendData.joining_time = data.joiningTime;
      if (data.joiningLocation !== undefined) backendData.joining_location = data.joiningLocation;
      
      const candidate = await apiService.updateCandidate(id, backendData);
      return adaptCandidate(candidate);
    },

    updateDocuments: async (id: string, files: { resume?: File | null; photo?: File | null; signature?: File | null; last_project_report?: File | null; }): Promise<Candidate> => {
      const candidate = await apiService.updateCandidateDocuments(id, files);
      return adaptCandidate(candidate);
    },

    updateApplication: async (id: string, questData: Record<string, any>): Promise<Candidate> => {
      // Convert to snake_case for backend storage
      const dataSnake = keysToSnake(questData);
      const candidate = await apiService.updateCandidateApplication(id, dataSnake);
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
      const backendData: any = {};
      
      if (data.status !== undefined) {
        backendData.status = data.status;
      }
      
      if (data.extensionAllowed !== undefined) {
        backendData.extension_allowed = data.extensionAllowed;
      }

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
    },

    uploadOfferLetter: async (id: string, file: File): Promise<Intern> => {
      const intern = await apiService.uploadInternOfferLetter(id, file);
      return adaptIntern(intern);
    },

    uploadDocuments: async (id: string, documents: { aadharCard?: File; panCard?: File; bankPassbook?: File }): Promise<Intern> => {
      const backendDocs = {
        aadhar_card: documents.aadharCard,
        pan_card: documents.panCard,
        bank_passbook: documents.bankPassbook,
      };
      const result = await apiService.uploadInternDocuments(id, backendDocs);
      return adaptIntern(result.intern);
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
    
    create: async (data: Omit<Stipend, 'id'>): Promise<Stipend> => {
      const backendData = {
        intern: data.internId,
        month: data.month,
        amount: data.amount,
        working_days: data.workingDays,
        leaves_taken: data.leavesTaken,
        comments: data.comments,
      };
      
      const stipend = await apiService.createStipend(backendData);
      return adaptStipend(stipend);
    },
    
    update: async (id: string, data: Partial<Stipend>): Promise<Stipend> => {
      // For stipend updates, typically use approval endpoints
      if (Object.keys(data).some(key => key.includes('Approval'))) {
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
      const backendData: any = {
        status: data.status,
      };

      // Only add fields if they are defined
      if (data.hrApproval !== undefined) backendData.hr_approval = data.hrApproval;
      if (data.hrComments !== undefined) backendData.hr_comments = data.hrComments;
      if (data.mentorApproval !== undefined) backendData.mentor_approval = data.mentorApproval;
      if (data.mentorComments !== undefined) backendData.mentor_comments = data.mentorComments;
      if (data.hodApproval !== undefined) backendData.hod_approval = data.hodApproval;
      if (data.hodComments !== undefined) backendData.hod_comments = data.hodComments;
      if (data.mhrApproval !== undefined) backendData.mhr_approval = data.mhrApproval;
      if (data.mhrComments !== undefined) backendData.mhr_comments = data.mhrComments;

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
        mentor_comments: data.mentorComments,
        hod_comments: data.hodComments
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
