import { 
  User, Department, Candidate, Intern, Stipend, LeaveRequest, 
  ExtensionRequest, ExitRequest, Holiday
} from '../types';



// Define ExtensionPermission interface for API service
interface ExtensionPermission {
  id: string;
  intern: string; // Backend uses 'intern' field
  intern_name?: string;
  intern_email?: string;
  intern_department?: string;
  hr_approved: boolean;
  hr_approved_by?: string;
  hr_approved_by_name?: string;
  hr_approved_at?: string;
  hr_comments?: string;
  hod_approved: boolean;
  hod_approved_by?: string;
  hod_approved_by_name?: string;
  hod_approved_at?: string;
  hod_comments?: string;
  is_approved?: boolean;
  created_at?: string;
  updated_at?: string;
}

const API_BASE_URL =  'http://localhost:8000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('access_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // Helper method to extract data from paginated responses
  private async handlePaginatedResponse<T>(response: Response): Promise<T[]> {
    const data = await this.handleResponse<any>(response);
    // If response has 'results' property, it's paginated
    if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
      return data.results as T[];
    }
    // If it's already an array, return as is
    if (Array.isArray(data)) {
      return data as T[];
    }
    // Fallback for unexpected format
    console.warn('Unexpected API response format:', data);
    return [] as T[];
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    return this.handleResponse<T>(response);
  }

  private async requestList<T>(endpoint: string, options: RequestInit = {}): Promise<T[]> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    return this.handlePaginatedResponse<T>(response);
  }

  // Authentication methods
  async login(email: string, password: string): Promise<{ access: string; refresh: string; user: User }> {
    const response = await this.request<{ access: string; refresh: string; user: User }>(
      '/auth/login/',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    
    // Store tokens
    this.token = response.access;
    localStorage.setItem('access_token', response.access);
    localStorage.setItem('refresh_token', response.refresh);
    
    return response;
  }

  async refreshToken(): Promise<{ access: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<{ access: string }>('/auth/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });

    this.token = response.access;
    localStorage.setItem('access_token', response.access);
    
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/user/');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({ 
        current_password: currentPassword, 
        new_password: newPassword 
      }),
    });
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.requestList<User>('/users/');
  }

  async getUserById(id: string): Promise<User> {
    return this.request<User>(`/users/${id}/`);
  }

  async createUser(userData: Partial<User>): Promise<User> {
    return this.request<User>('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    return this.requestList<Department>('/departments/');
  }

  async getDepartmentById(id: string): Promise<Department> {
    return this.request<Department>(`/departments/${id}/`);
  }

  // Candidates
  async getCandidates(): Promise<Candidate[]> {
    return this.requestList<Candidate>('/candidates/');
  }

  // Get candidates filtered by status (for onboarding, etc.)
  async getCandidatesByStatus(status: string): Promise<Candidate[]> {
    return this.request<Candidate[]>(`/candidates/?status=${encodeURIComponent(status)}`);
  }

  // Get candidates from local database (fast, pre-synced from JotForm)
  async getJotFormCandidatesPaginated(offset: number = 0, limit: number = 50): Promise<{ count: number; candidates: Candidate[] }> {
    return this.request<{ count: number; candidates: Candidate[] }>(`/webhooks/candidates/local/?offset=${offset}&limit=${limit}`);
  }

  // Search candidates from local database (across all candidates)
  async searchJotFormCandidates(searchTerm: string): Promise<{ count: number; candidates: Candidate[] }> {
    return this.request<{ count: number; candidates: Candidate[] }>(`/webhooks/candidates/local/?search=${encodeURIComponent(searchTerm)}`);
  }

  // Legacy method (use paginated version instead)
  async getJotFormCandidates(): Promise<Candidate[]> {
    const response = await this.request<{ count: number; candidates: Candidate[] }>('/webhooks/candidates/local/?limit=1000');
    return response.candidates;
  }

  // Sync candidates from JotForm to local database
  async syncJotFormCandidates(syncType: 'FULL' | 'INCREMENTAL' = 'INCREMENTAL'): Promise<any> {
    return this.request<any>('/webhooks/sync/trigger/', {
      method: 'POST',
      body: JSON.stringify({ sync_type: syncType }),
    });
  }

  // Get sync information
  async getSyncInfo(): Promise<any> {
    return this.request<any>('/webhooks/sync/info/');
  }

  async getCandidateById(id: string): Promise<Candidate> {
    return this.request<Candidate>(`/candidates/${id}/`);
  }
  
  
  async createCandidate(candidateData: any): Promise<Candidate> {
    // Handle file uploads with FormData
    const formData = new FormData();
    
    // File fields that should only be added if they're actual File objects
    const fileFields = ['resume', 'photo', 'signature', 'last_project_report'];
    
    Object.keys(candidateData).forEach(key => {
      if (candidateData[key] !== undefined && candidateData[key] !== null) {
        if (fileFields.includes(key)) {
          // Only append file fields if they're actual File objects
          if (candidateData[key] instanceof File) {
            formData.append(key, candidateData[key]);
          }
          // Skip if it's not a File object (could be empty string, null, etc.)
        } else if (key === 'quest_data' && typeof candidateData[key] === 'object') {
          try {
            const jsonString = JSON.stringify(candidateData[key]);
            formData.append(key, jsonString);
          } catch (error) {
            console.error('Error stringifying quest_data:', error);
            throw new Error('quest_data contains non-serializable values');
          }
        } else {
          formData.append(key, candidateData[key]);
        }
      }
    });

    const response = await fetch(`${API_BASE_URL}/candidates/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    return this.handleResponse<Candidate>(response);
  }

  async assignMentorToCandidate(candidateId: string, mentorId: string): Promise<Candidate> {
    return this.request<Candidate>(`/candidates/${candidateId}/assign_mentor/`, {
      method: 'POST',
      body: JSON.stringify({ mentor_id: mentorId }),
    });
  }

  async submitInterview(candidateId: string, feedback: any, approved: boolean): Promise<Candidate> {
    return this.request<Candidate>(`/candidates/${candidateId}/submit_interview/`, {
      method: 'POST',
      body: JSON.stringify({ feedback, approved }),
    });
  }

  async processHodApproval(candidateId: string, approved: boolean, feedback: string): Promise<Candidate> {
    return this.request<Candidate>(`/candidates/${candidateId}/process_approval/`, {
      method: 'POST',
      body: JSON.stringify({ approved, feedback }),
    });
  }

  async processApproval(candidateId: string, approved: boolean, feedback: string, joiningInfo?: { date?: string; time?: string; location?: string }): Promise<Candidate> {
    const requestData: any = { approved, feedback };
    
    // Add joining information if provided
    if (joiningInfo) {
      if (joiningInfo.date) requestData.joining_date = joiningInfo.date;
      if (joiningInfo.time) requestData.joining_time = joiningInfo.time;
      if (joiningInfo.location) requestData.joining_location = joiningInfo.location;
    }
    
    return this.request<Candidate>(`/candidates/${candidateId}/process_approval/`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async onboardCandidate(candidateId: string, userData: any, internData: any, documents?: { aadhar?: File; pan?: File; bankPassbook?: File ; noc?:File}): Promise<{ message: string; intern_id: string }> {
    const formData = new FormData();
    
    // Add JSON data
    formData.append('user_data', JSON.stringify(userData));
    formData.append('intern_data', JSON.stringify(internData));
    
    // Add file uploads if provided
    if (documents?.aadhar) {
      formData.append('aadhar_card', documents.aadhar);
    }
    if (documents?.pan) {
      formData.append('pan_card', documents.pan);
    }
    if (documents?.bankPassbook) {
      formData.append('bank_passbook', documents.bankPassbook);
    }
    if (documents?.noc) {
      formData.append('noc', documents.noc);
    }
    const url = `${API_BASE_URL}/candidates/${candidateId}/onboard/`;
    const headers: HeadersInit = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    // Don't set Content-Type for FormData - let browser set it with boundary

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<{ message: string; intern_id: string }>(response);
  }

  async rejectCandidate(candidateId: string, reason: string): Promise<Candidate> {
    return this.request<Candidate>(`/candidates/${candidateId}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getCandidateStatistics(): Promise<{ total: number; by_status: Record<string, number> }> {
    return this.request<{ total: number; by_status: Record<string, number> }>('/candidates/statistics/');
  }

  async bulkRejectCandidates(candidateIds: string[], reason: string): Promise<{ message: string; rejected_count: number }> {
    return this.request<{ message: string; rejected_count: number }>('/candidates/bulk_reject/', {
      method: 'POST',
      body: JSON.stringify({ candidate_ids: candidateIds, reason }),
    });
  }

  async updateCandidateContactInfo(candidateId: string, contactInfo: { phone?: string; email?: string; address?: string; emergency_contact?: string }): Promise<Candidate> {
    return this.request<Candidate>(`/candidates/${candidateId}/update_contact_info/`, {
      method: 'POST',
      body: JSON.stringify(contactInfo),
    });
  }

  async updateCandidate(candidateId: string, candidateData: any): Promise<Candidate> {
    // For candidate updates, we need to handle both file uploads and regular data
    const hasFiles = Object.values(candidateData).some(value => value instanceof File);
    
    if (hasFiles) {
      // Use FormData for file uploads
      const formData = new FormData();
      Object.keys(candidateData).forEach(key => {
        if (candidateData[key] !== undefined && candidateData[key] !== null) {
          if (candidateData[key] instanceof File) {
            formData.append(key, candidateData[key]);
          } else if (key === 'quest_data' && typeof candidateData[key] === 'object') {
            formData.append(key, JSON.stringify(candidateData[key]));
          } else {
            formData.append(key, candidateData[key]);
          }
        }
      });

      const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        body: formData,
      });

      return this.handleResponse<Candidate>(response);
    } else {
      // Use regular JSON for non-file updates
      return this.request<Candidate>(`/candidates/${candidateId}/`, {
        method: 'PATCH',
        body: JSON.stringify(candidateData),
      });
    }
  }

  async updateCandidateApplication(candidateId: string, questData: Record<string, any>): Promise<Candidate> {
    return this.request<Candidate>(`/candidates/${candidateId}/update_application/`, {
      method: 'POST',
      body: JSON.stringify({ quest_data: questData }),
    });
  }

  // Dashboard Analytics
  async getDashboardStats(): Promise<{
    candidate_stats: { total: number; by_status: Record<string, number> };
    intern_stats: { total: number; by_department: Record<string, number> };
    recent_activity: Array<{ type: string; message: string; timestamp: string; user: string }>;
  }> {
    return this.request('/dashboard/stats/');
  }

  // Interns
  async getInterns(): Promise<Intern[]> {
    return this.requestList<Intern>('/interns/');
  }

  async getInternById(id: string): Promise<Intern> {
    return this.request<Intern>(`/interns/${id}/`);
  }

  async updateIntern(id: string, internData: Partial<Intern>): Promise<Intern> {
    return this.request<Intern>(`/interns/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(internData),
    });
  }

  async updateInternBankDetails(internId: string, bankDetails: any): Promise<Intern> {
    return this.request<Intern>(`/interns/${internId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ bank_details: bankDetails }),
    });
  }

  async uploadInternOfferLetter(id: string, file: File): Promise<Intern> {
    const form = new FormData();
    form.append('offer_letter', file);
    const response = await fetch(`${API_BASE_URL}/interns/${id}/upload_offer_letter/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: form,
    });
    return this.handleResponse<Intern>(response);
  }

  async uploadInternDocuments(id: string, documents: { aadhar_card?: File; pan_card?: File; bank_passbook?: File }): Promise<{ message: string; updated_fields: string[]; intern: Intern }> {
    const formData = new FormData();
    
    if (documents.aadhar_card) {
      formData.append('aadhar_card', documents.aadhar_card);
    }
    if (documents.pan_card) {
      formData.append('pan_card', documents.pan_card);
    }
    if (documents.bank_passbook) {
      formData.append('bank_passbook', documents.bank_passbook);
    }

    const response = await fetch(`${API_BASE_URL}/interns/${id}/upload_documents/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });
    
    return this.handleResponse<{ message: string; updated_fields: string[]; intern: Intern }>(response);
  }

  async updateCandidateDocuments(id: string, files: { resume?: File | null; photo?: File | null; signature?: File | null; last_project_report?: File | null; }): Promise<Candidate> {
    const form = new FormData();
    if (files.resume) form.append('resume', files.resume);
    if (files.photo) form.append('photo', files.photo);
    if (files.signature) form.append('signature', files.signature);
    if (files.last_project_report) form.append('last_project_report', files.last_project_report);

    const response = await fetch(`${API_BASE_URL}/candidates/${id}/update_documents/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: form,
    });
    return this.handleResponse<Candidate>(response);
  }

  // Stipends
  async getStipends(): Promise<Stipend[]> {
    return this.requestList<Stipend>('/stipends/');
  }

  async getStipendById(id: string): Promise<Stipend> {
    return this.request<Stipend>(`/stipends/${id}/`);
  }

  async createStipend(stipendData: Partial<Stipend>): Promise<Stipend> {
    return this.request<Stipend>('/stipends/', {
      method: 'POST',
      body: JSON.stringify(stipendData),
    });
  }

  async approveStipend(id: string, signatureUrl?: string, pdfDataUri?: string): Promise<Stipend> {
    const body: { signature_url?: string; pdf_data_uri?: string } = {};
    
    if (signatureUrl) {
      body.signature_url = signatureUrl;
    }
    if (pdfDataUri) {
      body.pdf_data_uri = pdfDataUri;
    }

    return this.request<Stipend>(`/stipends/${id}/approve/`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async bulkApproveStipends(stipendIds: string[]): Promise<{ message: string }> {
    return this.request<{ message: string }>('/stipends/bulk_approve/', {
      method: 'POST',
      body: JSON.stringify({ stipend_ids: stipendIds }),
    });
  }

  async sendStipendCreationEmailWithPdf(stipendId: string, pdfDataUri: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/stipends/${stipendId}/send_creation_email/`, {
      method: 'POST',
      body: JSON.stringify({ pdf_data_uri: pdfDataUri }),
    });
  }

  // Leave Requests
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    return this.requestList<LeaveRequest>('/leaves/');
  }

  async createLeaveRequest(leaveData: Partial<LeaveRequest>): Promise<LeaveRequest> {
    return this.request<LeaveRequest>('/leaves/', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    });
  }

  async updateLeaveRequest(id: string, leaveData: Partial<LeaveRequest>): Promise<LeaveRequest> {
    return this.request<LeaveRequest>(`/leaves/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(leaveData),
    });
  }

  // Extension Requests
  async getExtensionRequests(): Promise<ExtensionRequest[]> {
    return this.requestList<ExtensionRequest>('/extensions/extension-requests/');
  }

  async createExtensionRequest(extensionData: Partial<ExtensionRequest>): Promise<ExtensionRequest> {
    return this.request<ExtensionRequest>('/extensions/extension-requests/', {
      method: 'POST',
      body: JSON.stringify(extensionData),
    });
  }

  async updateExtensionRequest(id: string, extensionData: Partial<ExtensionRequest>): Promise<ExtensionRequest> {
    return this.request<ExtensionRequest>(`/extensions/extension-requests/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(extensionData),
    });
  }

  // Exit Requests
  async getExitRequests(): Promise<ExitRequest[]> {
    return this.requestList<ExitRequest>('/exits/');
  }

  async createExitRequest(exitData: Partial<ExitRequest>): Promise<ExitRequest> {
    return this.request<ExitRequest>('/exits/', {
      method: 'POST',
      body: JSON.stringify(exitData),
    });
  }

  async updateExitRequest(id: string, exitData: Partial<ExitRequest>): Promise<ExitRequest> {
    return this.request<ExitRequest>(`/exits/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(exitData),
    });
  }

  // Holidays
  async getHolidays(): Promise<Holiday[]> {
    return this.requestList<Holiday>('/holidays/');
  }

  // Extension Permissions
  async getExtensionPermissions(): Promise<ExtensionPermission[]> {
    return this.requestList<ExtensionPermission>('/extensions/extension-permissions/');
  }

  async getExtensionPermissionById(id: string): Promise<ExtensionPermission> {
    return this.request<ExtensionPermission>(`/extensions/extension-permissions/${id}/`);
  }

  async createExtensionPermission(permissionData: { intern_id: string }): Promise<ExtensionPermission> {
    return this.request<ExtensionPermission>('/extensions/extension-permissions/create_for_intern/', {
      method: 'POST',
      body: JSON.stringify(permissionData),
    });
  }

  async hrApproveExtensionPermission(id: string, approved: boolean, comments?: string): Promise<ExtensionPermission> {
    return this.request<ExtensionPermission>(`/extensions/extension-permissions/${id}/hr_approve/`, {
      method: 'POST',
      body: JSON.stringify({ approved, comments }),
    });
  }

  async hodApproveExtensionPermission(id: string, approved: boolean, comments?: string): Promise<ExtensionPermission> {
    return this.request<ExtensionPermission>(`/extensions/extension-permissions/${id}/hod_approve/`, {
      method: 'POST',
      body: JSON.stringify({ approved, comments }),
    });
  }

  async getPendingExtensionApprovals(): Promise<ExtensionPermission[]> {
    return this.requestList<ExtensionPermission>('/extensions/extension-permissions/pending_approvals/');
  }

  // Email API methods
  async sendEmail(params: { to: string; subject: string; body: string; cc?: string }): Promise<{ message: string }> {
    return this.request<{ message: string }>('/email/send/', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async sendNotificationEmail(type: string, data: any): Promise<{ message: string }> {
    return this.request<{ message: string }>('/email/notifications/', {
      method: 'POST',
      body: JSON.stringify({ type, data }),
    });
  }
}

export const apiService = new ApiService();
export default apiService;