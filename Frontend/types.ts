export enum Role {
  INTERN = 'Intern',
  HR = 'HR',
  MENTOR = 'Mentor',
  HOD = 'HOD',
  MHR = "MHR",
}

export enum Shift {
    MORNING = 'Morning',
    GENERAL = 'General',
    NIGHT = 'Night',
}

export enum DepartmentName {
  WEB = 'Web Development',
  SAP = 'SAP BTP Development',
  RPA = 'RPA',
  GEN_AI = 'Gen AI & LLM',
  IIOT_DEV = 'IIoT Development',
  IIOT_FIELD = 'IIoT Field',
  SCM = 'SCM',
  PM = 'Project Management',
}

export enum CandidateStatus {
  PENDING_ASSIGNMENT = 'Pending Mentor Assignment',
  PENDING_INTERVIEW = 'Pending Interview Assessment',
  PENDING_HOD_APPROVAL = 'Pending HOD Approval',
  REJECTED = 'Rejected',
  SELECTED = 'Selected',
  ONBOARDED = 'Onboarded'
}

export enum InternStatus {
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  LEFT = 'Left',
}

export enum ApprovalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export enum LeaveType {
  FULL_DAY = 'Full Day',
  HALF_DAY = 'Half Day',
  OTHER = 'Other',
}

export enum LeaveHalf {
  FIRST_HALF = '1st Half',
  SECOND_HALF = '2nd Half',
}

export interface User {
  id: string;
  loginId?: string;
  name: string;
  email: string;
  solarEmail?: string;
  role: Role;
  department?: string; // API returns department ID
  departmentName?: string; // API includes department name
  dob: string; // YYYY-MM-DD
  shift: Shift;
  weekOffs: number[]; // 0 for Sunday, 6 for Saturday
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  name: DepartmentName;
  hod?: string; // HOD user ID
  hodName?: string; // HOD name from API
  mentors?: string[]; // Mentor user IDs
  mentorNames?: string[]; // Mentor names from API
  createdAt?: string;
  updatedAt?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string; // For JotForm candidates
  resume?: string; // File URL or path (cv_url for JotForm)
  photo?: string; // File URL or path
  signature?: string; // File URL or path
  last_project_report?: string; // File URL or path
  questData?: Record<string, any>; // Optional for JotForm candidates
  status: CandidateStatus | string; // Allow strings like "Pending Mentor Assignment"
  assigned_mentor?: any; // Mentor object from API
  assigned_mentor_id?: string; // Mentor user ID from API
  assigned_mentor_name?: string; // Mentor name from API
  department?: string; // Department ID
  departmentName?: string; // Department name from API
  interview_feedback?: any;
  hod_feedback?: string;
  joining_date?: string;
  joining_time?: string;
  joining_location?: string;
  createdAt?: string;
  updatedAt?: string;
  // JotForm specific fields
  jotform_id?: string;
  submission_date?: string;
  source?: string;
  has_cv?: boolean;
  cv_url?: string;
  qualification?: string;
  area_of_interest?: string;
  // Additional JotForm fields
  date_of_birth?: string;
  gender?: string;
  college_name?: string;
  branch?: string;
  year_of_passing?: string;
  preferred_location?: string;
  unique_id?: string;
  address?: string;
  linkedin_profile?: string;
  reference_by?: string;
  tnp_contact?: string;
  semester?: string;
  applicant_status?: string;
  available_6_months?: string;
  willing_plant_location?: string;
  willing_shifts?: string;
}

export interface Intern {
  id: string;
  user: string; // User ID
  userName?: string; // User name from API
  userEmail?: string; // User email from API
  candidate: string; // Candidate ID
  joining_date: string;
  mentor?: string; // Mentor user ID
  mentorName?: string; // Mentor name from API
  department?: string; // Department ID
  departmentName?: string; // Department name from API
  offerLetter?: string; // File URL or path
  bank_details?: {
    account_number: string;
    ifsc_code: string;
    bank_name: string;
    pan_number: string;
  };
  extension_allowed?: boolean;
  status: InternStatus;
  // Onboarding documents
  aadhar_card?: string; // File URL or path
  pan_card?: string; // File URL or path
  bank_passbook?: string; // File URL or path
  createdAt?: string;
  updatedAt?: string;
}

export interface Stipend {
  id: string;
  intern: string; // Intern ID
  intern_name?: string; // Intern name from API
  intern_email?: string; // Intern email from API
  month: string; // e.g., "YYYY-MM"
  amount: number;
  working_days: number;
  leaves_taken: number;
  comments: string;
  intern_approval: ApprovalStatus;
  hr_approval: ApprovalStatus;
  hod_approval: ApprovalStatus;
  invoice_url?: string;
  intern_signature_url?: string;
  hr_signature_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveRequest {
  id: string;
  intern: string; // Intern ID
  intern_name?: string; // Intern name from API
  intern_email?: string; // Intern email from API
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
  leave_half?: LeaveHalf;
  reason: string;
  status: ApprovalStatus;
  mail_sent: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ExtensionRequest {
  id: string;
  intern: string; // Intern ID
  intern_name?: string; // Intern name from API
  intern_email?: string; // Intern email from API
  months_requested: number;
  reason: string;
  status: ApprovalStatus;
  hr_approval: ApprovalStatus;
  mentor_approval: ApprovalStatus;
  hod_approval: ApprovalStatus;
  created_at?: string;
  updated_at?: string;
}

export interface ExitRequest {
  id: string;
  intern: string; // Intern ID
  intern_name?: string; // Intern name from API
  intern_email?: string; // Intern email from API
  feedback?: any; // JSON feedback data
  internship_report?: string; // File URL or path
  certificate?: string; // File URL or path
  status: ApprovalStatus;
  hr_approval: ApprovalStatus;
  mentor_approval: ApprovalStatus;
  hod_approval: ApprovalStatus;
  hr_comments?: string;
  mentor_comments?: string;
  hod_comments?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  type: string;
}