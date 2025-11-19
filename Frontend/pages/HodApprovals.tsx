import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import apiService from '../services/apiService';
import { Candidate, CandidateStatus, Department } from '../types';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Textarea from '../components/ui/Textarea';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import { EyeIcon, EditIcon, CheckIcon, XIcon } from '../components/icons';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const HodApprovals: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [hodFeedback, setHodFeedback] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // Fetch candidates and departments
        const [allCandidates, allDepartments] = await Promise.all([
          apiService.getCandidates(),
          apiService.getDepartments(),
        ]);

        console.log('🔍 [HOD Approvals] Total candidates from API:', allCandidates.length);
        console.log('🔍 [HOD Approvals] Current HOD (user.id):', user.id);

        // Filter for PENDING_HOD_APPROVAL status
        // API already filters by department for HOD
        const pendingApprovals = allCandidates.filter(c => {
          const matches = c.status === CandidateStatus.PENDING_HOD_APPROVAL;
          if (!matches) {
            console.log(`🔍 [HOD Approvals] Skipping ${c.name}: status="${c.status}"`);
          }
          return matches;
        });

        console.log('🔍 [HOD Approvals] Pending HOD approvals:', pendingApprovals.length);
        console.log('🔍 [HOD Approvals] Final candidates:', pendingApprovals.map(c => ({ name: c.name, status: c.status })));

        setCandidates(pendingApprovals);
        setDepartments(allDepartments);

      } catch (error) {
        addToast('Failed to fetch candidates.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, addToast]);

  const openDetailModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setHodFeedback('');
    setIsDetailModalOpen(true);
  };

  const closeModal = () => {
    setIsDetailModalOpen(false);
    setSelectedCandidate(null);
    setHodFeedback('');
    setPendingAction(null);
  };

  const getDepartmentName = (id?: string) => departments.find(d => d.id === id)?.name || 'N/A';

  const handleApprove = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setPendingAction('approve');
    setIsConfirmOpen(true);
  };

  const handleReject = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setPendingAction('reject');
    setIsConfirmOpen(true);
  };

  const executeApproval = async () => {
    if (!selectedCandidate || !pendingAction || !user) return;

    const approved = pendingAction === 'approve';
    setIsSubmitting(true);

    try {
      const updatedCandidate = await apiService.processHodApproval(
        selectedCandidate.id,
        approved,
        hodFeedback
      );

      // Remove from list
      setCandidates(candidates.filter(c => c.id !== updatedCandidate.id));

      addToast(
        approved
          ? `Approved ${selectedCandidate.name}!`
          : `Rejected ${selectedCandidate.name}`,
        'success'
      );

      setIsConfirmOpen(false);
      closeModal();
    } catch (error) {
      addToast('Failed to process approval.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmAction = () => {
    if (pendingAction === 'approve') {
      if (hodFeedback.trim() === '') {
        addToast('Please provide feedback for approval.', 'error');
        return;
      }
    }
    executeApproval();
  };

  return (
    <>
      <Card>
        <h1 className="text-2xl font-bold mb-4">HOD Approvals</h1>
        <p className="text-sm text-gray-600 mb-4">
          Review and approve candidates recommended by mentors after interview assessment.
        </p>

        {isLoading ? <Spinner /> : (
          <Table headers={['Candidate', 'Department', 'Mentor', 'Actions']}>
            {candidates.map(candidate => (
              <tr key={candidate.id} className="hover:bg-light-blue/50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={candidate.photo || `https://i.pravatar.cc/150?u=${candidate.id}`}
                      alt={`${candidate.name} profile`}
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-primary-navy">{candidate.name}</div>
                      <div className="text-sm text-gray-500">{candidate.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {candidate.department_name || getDepartmentName(candidate.department)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {candidate.assigned_mentor_name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openDetailModal(candidate)}
                    >
                      <EyeIcon className="w-4 h-4 mr-1" /> Review
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(candidate)}
                    >
                      <CheckIcon className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(candidate)}
                    >
                      <XIcon className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {candidates.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-10 text-slate-500">
                  No candidates pending your approval.
                </td>
              </tr>
            )}
          </Table>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={closeModal}
        title={`Candidate Details - ${selectedCandidate?.name}`}
        size="4xl"
      >
        {selectedCandidate && (
          <div className="space-y-6">
            {/* Candidate Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-blue mb-2">Personal Information</h3>
                  <div className="bg-white p-4 rounded-md border space-y-2">
                    <p><span className="font-medium">Name:</span> {selectedCandidate.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedCandidate.email}</p>
                    <p><span className="font-medium">Department:</span> {selectedCandidate.department_name || getDepartmentName(selectedCandidate.department)}</p>
                    <p><span className="font-medium">Assigned Mentor:</span> {selectedCandidate.assigned_mentor_name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Interview Feedback */}
              <div>
                <h3 className="text-lg font-semibold text-secondary-blue mb-2">Mentor's Interview Feedback</h3>
                <div className="bg-light-gray p-4 rounded-md border">
                  {selectedCandidate.interview_feedback ? (
                    <div className="space-y-3">
                      {/* Handle different feedback formats */}
                      {typeof selectedCandidate.interview_feedback === 'object' ? (
                        <>
                          {selectedCandidate.interview_feedback.ratings && (
                            <div>
                              <p className="font-medium mb-2">Ratings:</p>
                              {Object.entries(selectedCandidate.interview_feedback.ratings).map(([factor, rating]: [string, any]) => (
                                <p key={factor} className="text-sm">
                                  {factor}: <span className="font-medium">{rating}/5</span>
                                </p>
                              ))}
                            </div>
                          )}
                          {selectedCandidate.interview_feedback.status && (
                            <p>
                              <span className="font-medium">Recommendation:</span>{' '}
                              <span className={`font-bold ${selectedCandidate.interview_feedback.status === 'Selected' ? 'text-green-600' : 'text-red-600'}`}>
                                {selectedCandidate.interview_feedback.status}
                              </span>
                            </p>
                          )}
                          {selectedCandidate.interview_feedback.overallImpression && (
                            <div>
                              <p className="font-medium mb-1">Overall Impression:</p>
                              <p className="text-sm whitespace-pre-wrap">{selectedCandidate.interview_feedback.overallImpression}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(selectedCandidate.interview_feedback, null, 2)}</pre>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">No interview feedback available</p>
                  )}
                </div>
              </div>
            </div>

            {/* HOD Feedback */}
            <div>
              <label className="block text-sm font-medium text-secondary-blue mb-2">
                Your Feedback <span className="text-primary-red">*</span>
              </label>
              <Textarea
                value={hodFeedback}
                onChange={(e) => setHodFeedback(e.target.value)}
                placeholder="Provide your feedback and reasoning for this decision..."
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button variant="danger" onClick={() => handleReject(selectedCandidate)}>
                <XIcon className="w-4 h-4 mr-1" /> Reject
              </Button>
              <Button onClick={() => handleApprove(selectedCandidate)}>
                <CheckIcon className="w-4 h-4 mr-1" /> Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmAction}
        title={pendingAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
        message={
          pendingAction === 'approve'
            ? `Are you sure you want to approve ${selectedCandidate?.name}?`
            : `Are you sure you want to reject ${selectedCandidate?.name}?`
        }
        confirmText={pendingAction === 'approve' ? 'Approve' : 'Reject'}
        isConfirming={isSubmitting}
      />
    </>
  );
};

export default HodApprovals;
