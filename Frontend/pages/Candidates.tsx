

import React, { useState, useEffect, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import apiService from '../services/apiService.ts';
import notificationService from '../services/notificationService';
import { Candidate, Role, CandidateStatus, User, Department, InternStatus } from '../types';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import { EyeIcon, SendIcon, SearchIcon, UserPlusIcon, RefreshIcon } from '../components/icons';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import CandidateApplicationView from '../components/candidates/CandidateApplicationView';

// Constants for the assessment form view
const ratingFactors = [
  'Striving for Achievement (Result Orientation)',
  'Job / Functional Knowledge',
  'Relevant Experience',
  'Computer Skills',
  'Communication Ability (Verbal/Written)',
  'Attitude / Disposition',
  'Safety, Health & Environment Awareness',
  'Thinking Ability',
  'Level of Confidence',
  'Overall Assessment',
];
const ratingHeaders = ['Excellent (5)', 'Very Good (4)', 'Good (3)', 'Average (2)', 'Below Average (1)'];

interface MentorAssessment {
    ratings: Record<string, number>;
    status: 'Selected' | 'Not Selected';
    overallImpression: string;
}

const Candidates: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [mentors, setMentors] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const pageSize = 50; // Number of candidates per page

  // Modal States
  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  const [isApproveModalOpen, setApproveModalOpen] = useState(false);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [confirmationState, setConfirmationState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm', confirmVariant: 'primary' as 'primary' | 'danger' });
  const [activeDetailsTab, setActiveDetailsTab] = useState<'assessment' | 'application'>('assessment');

  // Form States
  const [selectedMentor, setSelectedMentor] = useState('');
  const [feedback, setFeedback] = useState('');
  const [joiningInfo, setJoiningInfo] = useState({ date: '', time: '', location: '' });
  const [mentorAssessment, setMentorAssessment] = useState<MentorAssessment | { overallImpression: string } | null>(null);

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncInfo, setLastSyncInfo] = useState<any>(null);
  const [syncType, setSyncType] = useState<'INCREMENTAL' | 'FULL'>('INCREMENTAL');

  // Calculate pagination values
  const totalPages = Math.ceil(totalCandidates / pageSize);
  const offset = (currentPage - 1) * pageSize;

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset to first page when search term changes (only if not actively searching)
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let candidateData;

        // If searching, fetch ALL matching candidates (not just current page)
        if (searchTerm.trim() !== '') {
          candidateData = await apiService.searchJotFormCandidates(searchTerm);
        } else {
          // Otherwise, fetch paginated data
          candidateData = await apiService.getJotFormCandidatesPaginated(offset, pageSize);
        }

        // Fetch other data in parallel
        const [allUsers, allDepartments] = await Promise.all([
          apiService.getUsers(),
          apiService.getDepartments(),
        ]);

        // Filter mentors from all users
        const mentorUsers = allUsers.filter(u => u.role === Role.MENTOR);
        setCandidates(candidateData.candidates);
        setTotalCandidates(candidateData.count);
        setMentors(mentorUsers);
        setDepartments(allDepartments);
      } catch (error) {
        addToast('Failed to fetch data.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [addToast, currentPage, searchTerm]);

  // Fetch sync info on component mount
  useEffect(() => {
    const fetchSyncInfo = async () => {
      try {
        const syncInfo = await apiService.getSyncInfo();
        setLastSyncInfo(syncInfo);
      } catch (error) {
        // Silently fail if sync info is not available
        console.log('Sync info not available yet');
      }
    };
    fetchSyncInfo();
  }, []);

  const filteredCandidates = useMemo(() => {
    if (!user) return [];
    
    let roleFiltered: Candidate[] = [];
    switch (user.role) {
      case Role.HR:
        roleFiltered = candidates.filter(c => c.status !== CandidateStatus.ONBOARDED);
        break;
      case Role.HOD:
        // API now filters by department, so just filter by HOD approval status
        roleFiltered = candidates.filter(c =>
            c.status === CandidateStatus.PENDING_HOD_APPROVAL
        );
        break;
      // case Role.MHR:
      //   roleFiltered = candidates.filter(c => c.status === CandidateStatus.PENDING_MHR_APPROVAL);
      //   break;
      default:
        // Show all candidates assigned to them if they are a mentor, otherwise just show all
        if (user.role === Role.MENTOR) {
             roleFiltered = candidates.filter(c => c.assigned_mentor_id === user.id);
        } else {
             roleFiltered = candidates;
        }
    }

    if (searchTerm.trim() === '') {
      return roleFiltered;
    }

    const lowerSearch = searchTerm.toLowerCase();
    return roleFiltered.filter(c => 
        c.name.toLowerCase().includes(lowerSearch) ||
        c.email.toLowerCase().includes(lowerSearch)
    );
  }, [user, candidates, searchTerm, departments]);

  const openAssignModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setAssignModalOpen(true);
  };
  
  const openApproveModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    if (candidate.interview_feedback) {
      // If it's already an object, use it directly; if it's a string, parse it
      if (typeof candidate.interview_feedback === 'object') {
        setMentorAssessment(candidate.interview_feedback);
      } else if (typeof candidate.interview_feedback === 'string') {
        try {
          const feedbackData = JSON.parse(candidate.interview_feedback);
          setMentorAssessment(feedbackData);
        } catch (e) {
          // Fallback for invalid JSON strings
          setMentorAssessment({ overallImpression: candidate.interview_feedback });
        }
      }
    } else {
      setMentorAssessment(null);
    }
    setApproveModalOpen(true);
  };
  
  const openDetailsModal = (candidate: Candidate) => {
      setSelectedCandidate(candidate);
      setActiveDetailsTab('assessment'); // Reset to default tab
       if (candidate.interview_feedback) {
        // If it's already an object, use it directly; if it's a string, parse it
        if (typeof candidate.interview_feedback === 'object') {
          setMentorAssessment(candidate.interview_feedback);
        } else if (typeof candidate.interview_feedback === 'string') {
          try {
            const feedbackData = JSON.parse(candidate.interview_feedback);
            setMentorAssessment(feedbackData);
          } catch (e) {
            // Fallback for invalid JSON strings
            setMentorAssessment({ overallImpression: candidate.interview_feedback });
          }
        }
      } else {
        setMentorAssessment(null);
      }
      setDetailsModalOpen(true);
  };
  
  const closeModal = () => {
      setAssignModalOpen(false);
      setApproveModalOpen(false);
      setDetailsModalOpen(false);
      setSelectedCandidate(null);
      setFeedback('');
      setJoiningInfo({ date: '', time: '', location: '' });
      setMentorAssessment(null);
  };
  
  const closeConfirmation = () => setConfirmationState({ ...confirmationState, isOpen: false });

  const executeSync = async () => {
    setIsSyncing(true);
    try {
      // Trigger incremental sync
      const result = await apiService.syncJotFormCandidates('INCREMENTAL');

      if (result.success) {
        // Show success message
        addToast(
          `Sync complete! ${result.fetched} fetched, ${result.saved} new, ${result.updated} updated.`,
          'success'
        );

        // Refresh the candidate list
        let candidateData;
        if (searchTerm.trim() !== '') {
          candidateData = await apiService.searchJotFormCandidates(searchTerm);
          setCurrentPage(1);
        } else {
          candidateData = await apiService.getJotFormCandidatesPaginated(offset, pageSize);
        }
        setCandidates(candidateData.candidates);
        setTotalCandidates(candidateData.count);

        // Update sync info
        const syncInfo = await apiService.getSyncInfo();
        setLastSyncInfo(syncInfo);
      } else {
        addToast(`Sync failed: ${result.error || result.message}`, 'error');
      }
    } catch (error: any) {
      addToast(`Sync failed: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const executeAssignMentor = async () => {
    if (!selectedCandidate || !selectedMentor) return;
    setIsSubmitting(true);
    try {
      // Get the mentor user first, then find their department
      const mentorUser = await apiService.getUserById(selectedMentor);
      if (!mentorUser) {
          addToast('Selected mentor not found.', 'error');
          setIsSubmitting(false);
          return;
      }

      console.log('🔍 DEBUG: Assigning mentor. SelectedMentor:', selectedMentor);
      console.log('🔍 DEBUG: Mentor User:', mentorUser);

      // Find the mentor's department from their user profile
      const mentorDepartment = mentorUser.department ?
        departments.find(d => d.id === mentorUser.department) : null;

      if (!mentorDepartment) {
          addToast('Could not find a department for the selected mentor. Please check department configurations.', 'error');
          setIsSubmitting(false);
          return;
      }

      console.log('🔍 DEBUG: Calling assignMentorToCandidate API...');
      const updatedCandidate = await apiService.assignMentorToCandidate(selectedCandidate.id, selectedMentor);

      console.log('🔍 DEBUG: API Response:', updatedCandidate);
      console.log('🔍 DEBUG: Updated candidate assigned_mentor_id:', updatedCandidate.assigned_mentor_id);
      console.log('🔍 DEBUG: Updated candidate status:', updatedCandidate.status);

      const hodUser = mentorDepartment.hod ? await apiService.getUserById(mentorDepartment.hod) : null;
      if (mentorUser && hodUser) {
        await notificationService.notifyMentorForInterview(mentorUser, hodUser, updatedCandidate);
      }

      setCandidates(candidates.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
      addToast('Mentor assigned successfully!', 'success');
      closeConfirmation();
      closeModal();
    } catch (error) {
      console.error('🔍 DEBUG: Error assigning mentor:', error);
      addToast('Failed to assign mentor.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignMentor = () => {
      setConfirmationState({
          isOpen: true,
          title: 'Confirm Mentor Assignment',
          message: `Are you sure you want to assign ${mentors.find(m=>m.id === selectedMentor)?.name} to interview ${selectedCandidate?.name}?`,
          onConfirm: executeAssignMentor,
          confirmText: 'Assign & Notify',
          confirmVariant: 'primary',
      });
  }

  const executeApproval = async (approved: boolean) => {
    if (!selectedCandidate || !user) return;
    setIsSubmitting(true);
    try {
      if (user.role === Role.HOD) {
        const updatedCandidate = await apiService.processApproval(selectedCandidate.id, approved, feedback);
        if (approved) {
          const allUsers = await apiService.getUsers();
          const mhrUser = allUsers.find(u => u.role === Role.MHR);
          const hodUser = await apiService.getUserById(user.id);
          // if (mhrUser && hodUser) notificationService.notifyMhrForSelection(mhrUser, hodUser, selectedCandidate);
        }
        setCandidates(candidates.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
      
      } else if (user.role === Role.MHR) {
        // For MHR, include joining information in the approval call
        const joiningData = (approved && (joiningInfo.date || joiningInfo.time || joiningInfo.location)) ? joiningInfo : undefined;
        const updatedCandidate = await apiService.processApproval(selectedCandidate.id, approved, feedback, joiningData);
        
        if (approved) {
          await notificationService.notifyInternOfSelection(updatedCandidate);
        }
        
        setCandidates(candidates.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
      }

      addToast(`Candidate ${approved ? 'processed' : 'rejected'}.`, 'success');
      closeConfirmation();
      closeModal();
    } catch (error) {
      console.error(error);
      addToast('Failed to process approval.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleApproval = (approved: boolean) => {
      setConfirmationState({
          isOpen: true,
          title: `Confirm Candidate ${approved ? 'Approval' : 'Rejection'}`,
          message: `Are you sure you want to ${approved ? 'approve' : 'reject'} this candidate? ${!approved ? 'This action cannot be undone.' : ''}`,
          onConfirm: () => executeApproval(approved),
          confirmText: approved ? 'Approve' : 'Reject',
          confirmVariant: approved ? 'primary' : 'danger',
      });
  }

  const renderActions = (candidate: Candidate) => {
    if (!user) return null;
    
    const actions = [
      <Button key="details" variant="ghost" size="sm" onClick={() => openDetailsModal(candidate)} title="View Details"><EyeIcon /></Button>
    ];

    switch (user.role) {
      case Role.HR:
        if (candidate.status === CandidateStatus.PENDING_ASSIGNMENT) {
          actions.push(<Button key="assign" size="sm" onClick={() => openAssignModal(candidate)}>Assign Mentor</Button>);
        }
        break;
      case Role.HOD:
        if (candidate.status === CandidateStatus.PENDING_HOD_APPROVAL) {
          actions.push(<Button key="review" size="sm" onClick={() => openApproveModal(candidate)}>Review</Button>);
        }
        break;
      // case Role.MHR:
      //   if (candidate.status === CandidateStatus.PENDING_MHR_APPROVAL) {
      //     actions.push(<Button key="approve" size="sm" onClick={() => openApproveModal(candidate)}>Final Approval</Button>);
      //   }
      //   break;
      default:
        break;
    }
    return <div className="flex space-x-2">{actions}</div>;
  };
  
  const getMentorName = (id?: string) => mentors.find(m => m.id === id)?.name || 'N/A';
  const getDepartmentName = (id?: string) => departments.find(d => d.id === id)?.name || 'N/A';


  return (
    <>
    <Card>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Candidate Management</h1>
         {user?.role === Role.HR && (
            <ReactRouterDOM.Link to="/candidates/new">
                <Button>
                    <UserPlusIcon />
                    <span className="ml-2">Add New Candidate</span>
                </Button>
            </ReactRouterDOM.Link>
        )}
      </div>

      <div className="mb-4">
          <div className="flex gap-2 mb-2">
              <div className="flex-1 max-w-lg">
                  <Input
                      icon={<SearchIcon />}
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <Button
                  onClick={executeSync}
                  disabled={isSyncing}
                  variant="secondary"
                  className="min-w-[120px]"
              >
                  {isSyncing ? (
                      <>
                          <RefreshIcon className="animate-spin mr-2" />
                          Syncing...
                      </>
                  ) : (
                      <>
                          <RefreshIcon className="mr-2" />
                          Sync Now
                      </>
                  )}
              </Button>
          </div>
          {searchTerm && (
              <p className="text-sm text-gray-600 ml-1">
                  Showing {candidates.length} of {totalCandidates} results for "{searchTerm}"
              </p>
          )}
          {lastSyncInfo && !searchTerm && (
              <p className="text-sm text-gray-500 ml-1">
                  Last sync: {lastSyncInfo.last_sync_time ? new Date(lastSyncInfo.last_sync_time).toLocaleString() : 'Never'} |
                  Total candidates: {totalCandidates}
              </p>
          )}
      </div>
      {isLoading ? <Spinner /> : (
        <Table headers={['Name', 'Email', 'Phone', 'Qualification', 'Area of Interest', 'CV', 'Actions']}>
          {filteredCandidates.map(candidate => (
            <tr key={candidate.id} className="hover:bg-light-blue/50 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <img className="h-10 w-10 rounded-full" src={candidate.photo || `https://i.pravatar.cc/150?u=${candidate.id}`} alt="" />
                  <div className="ml-4">
                    <div className="text-sm font-medium text-primary-navy">{candidate.name}</div>
                    <div className="text-xs text-gray-400">{candidate.source === 'JotForm' ? 'JotForm' : 'Database'}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{candidate.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{candidate.phone || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{candidate.qualification || candidate.departmentName || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{candidate.area_of_interest || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {candidate.has_cv || candidate.cv_url ? (
                  <button
                    onClick={() => window.open(candidate.cv_url || candidate.resume, '_blank')}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer transition-colors"
                    title="Click to view CV"
                  >
                    ✓ CV Uploaded
                  </button>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    ✗ No CV
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {renderActions(candidate)}
              </td>
            </tr>
          ))}
           {filteredCandidates.length === 0 && !isLoading && (
            <tr><td colSpan={7} className="text-center py-10 text-slate-500">No candidates match your criteria.</td></tr>
          )}
        </Table>
      )}

      {/* Pagination Controls - Only show when not searching */}
      {totalPages > 1 && searchTerm.trim() === '' && (
        <div className="flex items-center justify-between mt-6 bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Previous
            </button>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {searchTerm.trim() === '' ? (
                  <>
                    Showing <span className="font-medium">{offset + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(offset + pageSize, totalCandidates)}</span> of{' '}
                    <span className="font-medium">{totalCandidates}</span> results
                  </>
                ) : (
                  <>
                    Showing <span className="font-medium">{candidates.length}</span> of{' '}
                    <span className="font-medium">{totalCandidates}</span> results for "{searchTerm}"
                  </>
                )}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Page numbers */}
                {[...Array(Math.min(totalPages, 10))].map((_, idx) => {
                  let pageNum;
                  if (totalPages <= 10) {
                    // Show all pages if 10 or fewer
                    pageNum = idx + 1;
                  } else if (currentPage <= 5) {
                    // Show first 10 pages
                    pageNum = idx + 1;
                  } else if (currentPage >= totalPages - 4) {
                    // Show last 10 pages
                    pageNum = totalPages - 9 + idx;
                  } else {
                    // Show current page and surrounding pages
                    pageNum = currentPage - 5 + idx;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum ? 'z-10 bg-primary-red border-primary-red text-white' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Assign Mentor Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={closeModal} title={`Assign Mentor for ${selectedCandidate?.name}`}>
        <div className="space-y-4">
          <Select label="Select Mentor" value={selectedMentor} onChange={e => setSelectedMentor(e.target.value)}>
            <option value="">-- Select a Mentor --</option>
            {mentors.map(mentor => {
                const department = departments.find(d => d.mentors?.includes(mentor.id));
                return (<option key={mentor.id} value={mentor.id}>{mentor.name} ({department?.name || mentor.departmentName || 'N/A'})</option>);
            })}
          </Select>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleAssignMentor} disabled={!selectedMentor}>Assign & Notify <SendIcon /></Button>
          </div>
        </div>
      </Modal>
      
      {/* Details Modal */}
      <Modal isOpen={isDetailsModalOpen} onClose={closeModal} title={`Details for ${selectedCandidate?.name}`} size="4xl">
         <div className="max-h-[80vh] overflow-y-auto p-1">
            {/* Candidate Information Section - Always visible */}
            <div className="mb-6 bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Candidate Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Name</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.name}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Email</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.email}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Phone</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.phone || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Qualification</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.qualification || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Branch</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.branch || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">College</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.college_name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Area of Interest</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.area_of_interest || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Year of Passing</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.year_of_passing || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Date of Birth</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.date_of_birth || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Gender</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.gender || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Source</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.source || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Submission Date</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.submission_date || selectedCandidate?.createdAt || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Unique ID</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.unique_id || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Address</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.address || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">LinkedIn Profile</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.linkedin_profile || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Reference By</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.reference_by || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">T&P Contact</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.tnp_contact || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Semester</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.semester || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Applicant Status</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.applicant_status || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Available 6 Months</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.available_6_months || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Willing Plant Location</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.willing_plant_location || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Willing Shifts</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.willing_shifts || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-secondary-blue">Preferred Location</p>
                        <p className="text-sm text-slate-700">{selectedCandidate?.preferred_location || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveDetailsTab('assessment')}
                        className={`${activeDetailsTab === 'assessment' ? 'border-primary-red text-primary-red' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Interview Assessment
                    </button>
                    <button
                        onClick={() => setActiveDetailsTab('application')}
                        className={`${activeDetailsTab === 'application' ? 'border-primary-red text-primary-red' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Full Application
                    </button>
                </nav>
            </div>

            <div className="py-6">
              {activeDetailsTab === 'assessment' && (
                  <>
                  {mentorAssessment ? (
                      <div className="space-y-4 bg-light-gray p-4 rounded-md border border-slate-200">
                          <h3 className="text-lg font-bold text-slate-800">Mentor's Interview Assessment</h3>
                          {'ratings' in mentorAssessment && mentorAssessment.ratings ? (
                              <>
                                  <div>
                                      <label className="block text-sm font-medium text-secondary-blue mb-2">Rating Factors</label>
                                      <div className="overflow-x-auto">
                                          <table className="min-w-full border-collapse border border-slate-300 bg-white">
                                              <thead>
                                                  <tr className="bg-slate-200">
                                                      <th className="border border-slate-300 p-2 text-left text-xs font-medium text-secondary-blue uppercase">Factor</th>
                                                      {ratingHeaders.map(header => <th key={header} className="border border-slate-300 p-2 text-center text-xs font-medium text-secondary-blue uppercase">{header}</th>)}
                                                  </tr>
                                              </thead>
                                              <tbody>
                                                  {ratingFactors.map(factor => (
                                                      <tr key={factor}>
                                                          <td className="border border-slate-300 p-2 text-sm font-medium text-secondary-blue">{factor}</td>
                                                          {ratingHeaders.map((_, index) => {
                                                              const ratingValue = 5 - index;
                                                              return (
                                                                  <td key={index} className="border border-slate-300 p-2 text-center">
                                                                      <input type="radio" name={`${factor}-details-view`} value={ratingValue} checked={mentorAssessment.ratings[factor] === ratingValue} disabled className="h-4 w-4 text-primary-red focus:ring-0 cursor-not-allowed" />
                                                                  </td>
                                                              );
                                                          })}
                                                      </tr>
                                                  ))}
                                              </tbody>
                                          </table>
                                      </div>
                                  </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                      <div>
                                          <p className="text-sm font-medium text-secondary-blue">Mentor's Recommendation</p>
                                          <p className={`font-bold text-lg ${mentorAssessment.status === 'Selected' ? 'text-secondary-blue' : 'text-primary-red'}`}>{mentorAssessment.status || 'N/A'}</p>
                                      </div>
                                      <div className="md:col-span-2">
                                          <p className="text-sm font-medium text-secondary-blue mb-1">Mentor's Overall Impression</p>
                                          <div className="bg-white p-3 rounded-md border text-sm text-slate-700 whitespace-pre-wrap">{mentorAssessment.overallImpression || 'N/A'}</div>
                                      </div>
                                  </div>
                              </>
                          ) : (
                              <div>
                                  <p className="text-sm font-medium text-secondary-blue mb-1">Mentor's Feedback</p>
                                  <div className="bg-white p-3 rounded-md border text-sm text-slate-700 whitespace-pre-wrap">{mentorAssessment.overallImpression || 'N/A'}</div>
                              </div>
                          )}
                      </div>
                  ) : (
                      <p className="text-slate-500 text-center py-4">No interview feedback is available for this candidate.</p>
                  )}

                  {selectedCandidate?.hod_feedback && (
                       <div className="space-y-2 bg-light-gray p-4 rounded-md border border-slate-200 mt-6">
                          <h3 className="text-lg font-bold text-slate-800">HOD's Feedback</h3>
                          <div className="bg-white p-3 rounded-md border text-sm text-slate-700 whitespace-pre-wrap">{selectedCandidate.hod_feedback}</div>
                       </div>
                  )}
                  </>
              )}

              {activeDetailsTab === 'application' && (
                  <CandidateApplicationView questData={selectedCandidate?.questData} />
              )}
            </div>
            
            <div className="pt-4 border-t mt-4">
                <h3 className="text-lg font-bold text-slate-800 mb-3">Candidate Documents</h3>
                {selectedCandidate?.cv_url ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-green-800">Curriculum Vitae</p>
                                    <p className="text-xs text-green-600">Click to view the uploaded CV</p>
                                </div>
                            </div>
                            <button
                                onClick={() => window.open(selectedCandidate.cv_url, '_blank')}
                                className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View CV
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                        <p className="text-sm text-red-800">No CV uploaded</p>
                    </div>
                )}

                {selectedCandidate?.signature && (
                    <a href={selectedCandidate.signature} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary-red hover:underline mr-4">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        View Signature
                    </a>
                )}
                {selectedCandidate?.last_project_report && (
                    <a href={selectedCandidate.last_project_report} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary-red hover:underline">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Project Report
                    </a>
                )}
            </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
            <Button variant="secondary" onClick={closeModal}>Close</Button>
        </div>
      </Modal>

      {/* Approve/Reject Modals */}
      <Modal isOpen={isApproveModalOpen} onClose={closeModal} title={`Review Candidate: ${selectedCandidate?.name}`} size="4xl">
          <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1">
              {/* Candidate Information Section */}
              <div className="mb-6 bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Candidate Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                          <p className="text-sm font-medium text-secondary-blue">Name</p>
                          <p className="text-sm text-slate-700">{selectedCandidate?.name}</p>
                      </div>
                      <div>
                          <p className="text-sm font-medium text-secondary-blue">Email</p>
                          <p className="text-sm text-slate-700">{selectedCandidate?.email}</p>
                      </div>
                      <div>
                          <p className="text-sm font-medium text-secondary-blue">Phone</p>
                          <p className="text-sm text-slate-700">{selectedCandidate?.phone || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-sm font-medium text-secondary-blue">Qualification</p>
                          <p className="text-sm text-slate-700">{selectedCandidate?.qualification || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-sm font-medium text-secondary-blue">Branch</p>
                          <p className="text-sm text-slate-700">{selectedCandidate?.branch || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-sm font-medium text-secondary-blue">College</p>
                          <p className="text-sm text-slate-700">{selectedCandidate?.college_name || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-sm font-medium text-secondary-blue">Area of Interest</p>
                          <p className="text-sm text-slate-700">{selectedCandidate?.area_of_interest || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-sm font-medium text-secondary-blue">Year of Passing</p>
                          <p className="text-sm text-slate-700">{selectedCandidate?.year_of_passing || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-sm font-medium text-secondary-blue">Date of Birth</p>
                          <p className="text-sm text-slate-700">{selectedCandidate?.date_of_birth || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-sm font-medium text-secondary-blue">Gender</p>
                          <p className="text-sm text-slate-700">{selectedCandidate?.gender || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-sm font-medium text-secondary-blue">LinkedIn Profile</p>
                          <p className="text-sm text-slate-700">{selectedCandidate?.linkedin_profile || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-sm font-medium text-secondary-blue">Reference By</p>
                          <p className="text-sm text-slate-700">{selectedCandidate?.reference_by || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-sm font-medium text-secondary-blue">T&P Contact</p>
                          <p className="text-sm text-slate-700">{selectedCandidate?.tnp_contact || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-sm font-medium text-secondary-blue">Willing Plant Location</p>
                          <p className="text-sm text-slate-700">{selectedCandidate?.willing_plant_location || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-sm font-medium text-secondary-blue">Willing Shifts</p>
                          <p className="text-sm text-slate-700">{selectedCandidate?.willing_shifts || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-sm font-medium text-secondary-blue">Preferred Location</p>
                          <p className="text-sm text-slate-700">{selectedCandidate?.preferred_location || 'N/A'}</p>
                      </div>
                  </div>
              </div>

              {/* Mentor's Assessment View */}
              {mentorAssessment ? (
                  <div className="space-y-4 bg-light-gray p-4 rounded-md border border-slate-200">
                      <h3 className="text-lg font-bold text-slate-800">Mentor's Interview Assessment</h3>
                      {'ratings' in mentorAssessment && mentorAssessment.ratings ? (
                          <>
                              <div>
                                  <label className="block text-sm font-medium text-secondary-blue mb-2">Rating Factors</label>
                                  <div className="overflow-x-auto">
                                      <table className="min-w-full border-collapse border border-slate-300 bg-white">
                                          <thead>
                                              <tr className="bg-slate-200">
                                                  <th className="border border-slate-300 p-2 text-left text-xs font-medium text-secondary-blue uppercase">Factor</th>
                                                  {ratingHeaders.map(header => <th key={header} className="border border-slate-300 p-2 text-center text-xs font-medium text-secondary-blue uppercase">{header}</th>)}
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {ratingFactors.map(factor => (
                                                  <tr key={factor}>
                                                      <td className="border border-slate-300 p-2 text-sm font-medium text-secondary-blue">{factor}</td>
                                                      {ratingHeaders.map((_, index) => {
                                                          const ratingValue = 5 - index;
                                                          return (
                                                              <td key={index} className="border border-slate-300 p-2 text-center">
                                                                  <input type="radio" name={`${factor}-view`} value={ratingValue} checked={mentorAssessment.ratings[factor] === ratingValue} disabled className="h-4 w-4 text-primary-red focus:ring-0 cursor-not-allowed" />
                                                              </td>
                                                          );
                                                      })}
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                  <div>
                                      <p className="text-sm font-medium text-secondary-blue">Mentor's Recommendation</p>
                                      <p className={`font-bold text-lg ${mentorAssessment.status === 'Selected' ? 'text-secondary-blue' : 'text-primary-red'}`}>{mentorAssessment.status || 'N/A'}</p>
                                  </div>
                                  <div className="md:col-span-2">
                                      <p className="text-sm font-medium text-secondary-blue mb-1">Mentor's Overall Impression</p>
                                      <div className="bg-white p-3 rounded-md border text-sm text-slate-700 whitespace-pre-wrap">{mentorAssessment.overallImpression || 'N/A'}</div>
                                  </div>
                              </div>
                          </>
                      ) : (
                          <div>
                              <p className="text-sm font-medium text-secondary-blue mb-1">Mentor's Feedback</p>
                              <div className="bg-white p-3 rounded-md border text-sm text-slate-700 whitespace-pre-wrap">{mentorAssessment.overallImpression || 'N/A'}</div>
                          </div>
                      )}
                  </div>
              ) : (
                  <p className="text-slate-500 text-center py-4">No interview feedback was submitted by the mentor.</p>
              )}

              {/* HOD/MHR Action Section */}
              <div className="mt-4 pt-4 border-t">
                  {user?.role === Role.MHR && (
                      <>
                          <p><strong>HOD Feedback:</strong> {selectedCandidate?.hod_feedback || 'N/A'}</p>
                          <h3 className="font-semibold pt-4 border-t mt-4">Joining Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                              <Input name="joining_date" label="Joining Date" type="date" required value={joiningInfo.date} onChange={e => setJoiningInfo(j => ({...j, date: e.target.value}))}/>
                              <Input name="joining_time" label="Joining Time" type="time" required value={joiningInfo.time} onChange={e => setJoiningInfo(j => ({...j, time: e.target.value}))}/>
                              <Input name="joining_location" label="Joining Location" type="text" required value={joiningInfo.location} onChange={e => setJoiningInfo(j => ({...j, location: e.target.value}))}/>
                          </div>
                      </>
                  )}
                  <div className="mt-4">
                      <Textarea label="Your Feedback (Optional)" value={feedback} onChange={e => setFeedback(e.target.value)} />
                  </div>
              </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
              <Button variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button variant="danger" onClick={() => handleApproval(false)}>Reject</Button>
              <Button onClick={() => handleApproval(true)}>Approve</Button>
          </div>
      </Modal>

    </Card>
    <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmationState.onConfirm}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        confirmVariant={confirmationState.confirmVariant}
        isConfirming={isSubmitting}
    />
    </>
  );
};

export default Candidates;