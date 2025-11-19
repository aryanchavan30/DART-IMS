// Extended types for the new frontend that maintains compatibility with the backend
// This combines your existing backend types with the new frontend interface requirements

// Re-export all your existing types
export * from './types';

// Import backend types
import {
  User as BackendUser, Role, Department as BackendDepartment, 
  Candidate as BackendCandidate, Intern as BackendIntern, 
  Stipend as BackendStipend, LeaveRequest as BackendLeaveRequest, 
  ExtensionRequest as BackendExtensionRequest, ExitRequest as BackendExitRequest,
  CandidateStatus, InternStatus, ApprovalStatus, Shift, Holiday, 
  LeaveType, LeaveHalf, DepartmentName
} from './types';

// Extended interfaces for new frontend compatibility
export interface User extends BackendUser {
  solarEmail?: string;
  departmentId?: string; // Alias for department
}

export interface Department extends BackendDepartment {
  hodId?: string; // Alias for hod
  mentorIds?: string[]; // Alias for mentors
}

export interface Candidate extends BackendCandidate {
  resumeUrl?: string; // Alias for resume
  photoUrl?: string; // Alias for photo
  signatureUrl?: string; // Alias for signature
  lastProjectReportUrl?: string; // Alias for last_project_report
  assignedMentorId?: string; // Alias for assigned_mentor
  departmentId?: string; // Alias for department
}

export interface Intern extends BackendIntern {
  userId: string; // Alias for user
  candidateId: string; // Alias for candidate
  mentorId?: string; // Alias for mentor
  offerLetterUrl?: string; // Alias for offerLetter
  bankDetails?: {
    accountNumber: string; // Maps from account_number
    ifscCode: string; // Maps from ifsc_code
    bankName: string; // Maps from bank_name
    panNumber: string; // Maps from pan_number
  };
  extensionAllowed?: boolean; // New field for frontend
}

export interface Stipend extends BackendStipend {
  internId: string; // Alias for intern
  workingDays: number; // Alias for working_days
  leavesTaken: number; // Alias for leaves_taken
  internApproval: ApprovalStatus; // Alias for intern_approval
  hrApproval: ApprovalStatus; // Alias for hr_approval
  hodApproval: ApprovalStatus; // Alias for hod_approval
  invoiceUrl?: string; // Alias for invoice_url
  internSignatureUrl?: string; // Alias for intern_signature_url
  hrSignatureUrl?: string; // Alias for hr_signature_url
  hrComments?: string; // New field for frontend
  hodComments?: string; // New field for frontend
}

export interface LeaveRequest extends BackendLeaveRequest {
  internId: string; // Alias for intern
  startDate: string; // Alias for start_date
  endDate: string; // Alias for end_date
  leaveType: LeaveType; // Alias for leave_type
  leaveHalf?: LeaveHalf; // Alias for leave_half
  mailSent: boolean; // Alias for mail_sent
  mentorComments?: string; // New field for frontend
}

export interface ExtensionRequest extends BackendExtensionRequest {
  internId: string; // Alias for intern
  monthsRequested: 1 | 2 | 3; // More specific type
  hrApproval: ApprovalStatus; // Alias for hr_approval
  hrComments?: string; // New field for frontend
  mentorApproval: ApprovalStatus; // Alias for mentor_approval
  mentorComments?: string; // New field for frontend
  hodApproval: ApprovalStatus; // Alias for hod_approval
  hodComments?: string; // New field for frontend
  mhrApproval?: ApprovalStatus; // Alias for mhr_approval
  mhrComments?: string; // New field for frontend
}

export interface ExitRequest extends BackendExitRequest {
  internId: string; // Alias for intern
  internshipReportUrl?: string; // Alias for internship_report
  certificateUrl?: string; // Alias for certificate
  hrApproval: ApprovalStatus; // Alias for hr_approval
  mentorApproval: ApprovalStatus; // Alias for mentor_approval
  hodApproval: ApprovalStatus; // Alias for hod_approval
  hrComments?: string; // Alias for hr_comments
  mentorComments?: string; // Alias for mentor_comments
  hodComments?: string; // Alias for hod_comments
}

// Additional types that might be needed by the new frontend
export interface UserWithDepartment extends Omit<User, 'department'> {
  department?: Department; // Full department object instead of just ID
}

export interface InternWithUser extends Omit<Intern, 'user' | 'candidate' | 'mentor'> {
  user?: User; // Full user object instead of just ID
  candidate?: Candidate; // Full candidate object instead of just ID
  mentor?: User; // Full mentor object instead of just ID
  userId: string; // Keep the ID fields as well
  candidateId: string;
  mentorId?: string;
}

export interface ExtensionPermission {
  id: string;
  internId: string; // Alias for intern
  hrApproved: boolean;
  hrApprovedBy?: string; // User ID
  hrApprovedAt?: string;
  hrComments?: string;
  hodApproved: boolean;
  hodApprovedBy?: string; // User ID
  hodApprovedAt?: string;
  hodComments?: string;
  isApproved?: boolean; // Computed property
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'candidate' | 'intern' | 'stipend' | 'leave' | 'extension' | 'exit';
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  assignedTo?: string;
  relatedId?: string; // ID of the related entity (candidate, intern, etc.)
}
