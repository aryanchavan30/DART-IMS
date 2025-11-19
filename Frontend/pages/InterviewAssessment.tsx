
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import apiService from '../services/apiService.ts';
import notificationService from '../services/notificationService';
import { Candidate, CandidateStatus, Department, Role } from '../types';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Textarea from '../components/ui/Textarea';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import { EyeIcon, EditIcon, SearchIcon, UploadCloudIcon, FileIcon } from '../components/icons';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Input from '../components/ui/Input';
import RadioGroup from '../components/ui/RadioGroup';

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

const InterviewAssessment: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [selectedResumeCandidate, setSelectedResumeCandidate] = useState<Candidate | null>(null);
  
  // New form state
  const initialFormState = {
    ratings: ratingFactors.reduce((acc, factor) => ({ ...acc, [factor]: null }), {} as Record<string, number | null>),
    status: '' as 'Selected' | 'Not Selected' | '',
    overallImpression: '',
    technicalTest: null as File | null,
  };
  const [formState, setFormState] = useState(initialFormState);
  const [technicalTestFile, setTechnicalTestFile] = useState<File | null>(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const isFormValid = useMemo(() => {
    return (
      Object.values(formState.ratings).every(r => r !== null) &&
      formState.status &&
      formState.overallImpression.trim() !== ''
    );
  }, [formState]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [allCandidates, allDepartments] = await Promise.all([
          apiService.getCandidates(),
          apiService.getDepartments(),
        ]);

        console.log('🔍 [InterviewAssessment] Total candidates:', allCandidates.length);
        console.log('🔍 [InterviewAssessment] Current user (mentor):', user.id, user.name);

        // Show ALL candidates assigned to this mentor, regardless of status
        const allMyCandidates = allCandidates.filter(c => {
          const matches = String(c.assigned_mentor_id) === String(user.id);
          if (!matches) {
            console.log(`🔍 [InterviewAssessment] Skipping ${c.name}: assigned_mentor_id=${c.assigned_mentor_id}, user.id=${user.id}`);
          }
          return matches;
        });

        // API now returns only candidates assigned to this mentor
        // Just filter by PENDING_INTERVIEW status
        const myCandidates = allCandidates.filter(c => {
          const matches = c.status === CandidateStatus.PENDING_INTERVIEW;
          if (!matches) {
            console.log(`🔍 [InterviewAssessment] Filtering OUT ${c.name}: status="${c.status}" !== "${CandidateStatus.PENDING_INTERVIEW}"`);
          }
          return matches;
        });

        console.log('🔍 [InterviewAssessment] Total candidates assigned:', allCandidates.length);
        console.log('🔍 [InterviewAssessment] Pending interview:', myCandidates.length);
        console.log('🔍 [InterviewAssessment] Final candidates:', myCandidates.map(c => ({ name: c.name, status: c.status })));

        setCandidates(myCandidates);
        setDepartments(allDepartments);

      } catch (error) {
        addToast('Failed to fetch assigned candidates.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, addToast]);

  const filteredCandidates = useMemo(() => {
    if (!candidates) return [];
    if (searchTerm.trim() === '') return candidates;
    const lowerSearch = searchTerm.toLowerCase();
    return candidates.filter(c => 
        c.name.toLowerCase().includes(lowerSearch) ||
        c.email.toLowerCase().includes(lowerSearch)
    );
  }, [candidates, searchTerm]);

  const openFeedbackModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setFormState(initialFormState); // Reset form state
    setTechnicalTestFile(null); // Reset file state
    setFeedbackModalOpen(true);
  };

  const openResumeModal = (candidate: Candidate) => {
    setSelectedResumeCandidate(candidate);
    setIsResumeModalOpen(true);
  };

  const getResumeUrl = (resumePath: string | undefined) => {
    if (!resumePath) return null;
    // If it's already a full URL, return as is
    if (resumePath.startsWith('http')) return resumePath;
    // Otherwise, construct the full URL with backend base URL
    const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    return `${baseUrl}${resumePath.startsWith('/') ? '' : '/'}${resumePath}`;
  };
  
  const closeModal = () => {
    setFeedbackModalOpen(false);
    setSelectedCandidate(null);
  };

  const closeResumeModal = () => {
    setIsResumeModalOpen(false);
    setSelectedResumeCandidate(null);
  };

  const getDepartmentName = (id?: string) => departments.find(d => d.id === id)?.name || 'N/A';

  const executeSubmitFeedback = async () => {
    if (!selectedCandidate || !isFormValid || !user) return;

    const feedbackData: {
      ratings: Record<string, number | null>;
      status: string;
      overallImpression: string;
      technicalTestFileName?: string;
    } = {
      ratings: formState.ratings,
      status: formState.status,
      overallImpression: formState.overallImpression,
    };

    if (technicalTestFile) {
      feedbackData.technicalTestFileName = technicalTestFile.name;
    }

    // Determine the candidate's next status based on the mentor's recommendation.
    const newStatus = formState.status === 'Selected'
      ? CandidateStatus.PENDING_HOD_APPROVAL
      : CandidateStatus.REJECTED;

    setIsSubmitting(true);
    try {
        const approved = formState.status === 'Selected';
        const updatedCandidate = await apiService.submitInterview(selectedCandidate.id, feedbackData, approved);

        // Only notify the HOD if the candidate is approved and needs further review.
        if (newStatus === CandidateStatus.PENDING_HOD_APPROVAL) {
            const department = departments.find(d => d.id === updatedCandidate.department);
            if (department && department.hod) {
                const hod = await apiService.getUserById(department.hod);
                if(hod) {
                    await notificationService.notifyHodForAssessment(hod, user, updatedCandidate);
                }
            }
        }

        setCandidates(candidates.filter(c => c.id !== updatedCandidate.id));
        addToast('Feedback submitted successfully!', 'success');
        setIsConfirmOpen(false);
        closeModal();
    } catch (error) {
        addToast('Failed to submit feedback.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };


  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
        addToast('Please fill all mandatory fields.', 'error');
        return;
    }
    setIsConfirmOpen(true);
  }
  
  const handleRatingChange = (factor: string, value: number) => {
      setFormState(prev => ({
          ...prev,
          ratings: {
              ...prev.ratings,
              [factor]: value
          }
      }));
  };

  return (
    <>
    <Card>
      <h1 className="text-2xl font-bold mb-4">Interview Assessments</h1>
       <div className="mb-4 max-w-lg">
          <Input
              icon={<SearchIcon />}
              placeholder="Search by candidate name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
          />
      </div>
      {isLoading ? <Spinner /> : (
        <Table headers={['Candidate Name', 'Department', 'Resume', 'Actions']}>
          {filteredCandidates.map(candidate => (
            <tr key={candidate.id} className="hover:bg-light-blue/50 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <img className="h-10 w-10 rounded-full" src={candidate.photo || `https://i.pravatar.cc/150?u=${candidate.id}`} alt={`${candidate.name} profile`} />
                  <div className="ml-4">
                    <div className="text-sm font-medium text-primary-navy">{candidate.name}</div>
                    <div className="text-sm text-gray-500">{candidate.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{candidate.department_name || getDepartmentName(candidate.department)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                <button
                  onClick={() => openResumeModal(candidate)}
                  className="text-primary-red hover:underline flex items-center cursor-pointer"
                >
                  <EyeIcon /> <span className="ml-2">View Resume</span>
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <Button size="sm" onClick={() => openFeedbackModal(candidate)}>
                  <EditIcon /> Submit Feedback
                </Button>
              </td>
            </tr>
          ))}
          {filteredCandidates.length === 0 && (
             <tr><td colSpan={4} className="text-center py-10 text-slate-500">No pending interviews match your criteria.</td></tr>
          )}
        </Table>
      )}
    </Card>
    {/* Feedback Modal */}
      <Modal isOpen={isFeedbackModalOpen} onClose={closeModal} title={`Interview Assessment for ${selectedCandidate?.name}`} size="4xl">
        <form onSubmit={handleSubmitFeedback}>
        <div className="bg-light-gray p-6 rounded-md space-y-6 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-dashed border-slate-300 rounded-md text-center bg-white">
                     <a href={selectedCandidate?.resume} target="_blank" rel="noopener noreferrer" className="text-secondary-blue hover:text-primary-red">
                        <FileIcon />
                        <p className="text-sm font-semibold">View Candidate Application</p>
                    </a>
                </div>
                <div
                    className="p-4 border border-dashed border-slate-300 rounded-md text-center bg-white hover:bg-gray-50 cursor-pointer"
                    onClick={() => document.getElementById('technicalTestUpload')?.click()}
                >
                    <UploadCloudIcon />
                    <p className="text-sm font-semibold text-secondary-blue">Upload Technical Test</p>
                    <p className="text-xs text-gray-500">(Optional)</p>
                    {technicalTestFile && (
                      <p className="text-xs text-green-600 mt-1">✓ {technicalTestFile.name}</p>
                    )}
                    <input
                      type="file"
                      id="technicalTestUpload"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setTechnicalTestFile(file);
                      }}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">Rating Factor <span className="text-primary-red">*</span></label>
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-slate-300 bg-white">
                        <thead>
                            <tr className="bg-light-gray">
                                <th className="border border-slate-300 p-2 text-left text-xs font-medium text-secondary-blue uppercase">Factor</th>
                                {ratingHeaders.map((header, index) => (
                                    <th key={index} className="border border-slate-300 p-2 text-center text-xs font-medium text-secondary-blue uppercase" style={{minWidth: '100px'}}>
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {ratingFactors.map(factor => (
                                <tr key={factor}>
                                    <td className="border border-slate-300 p-2 text-sm bg-light-blue/30 font-medium text-secondary-blue">{factor}</td>
                                    {ratingHeaders.map((_, index) => {
                                        const ratingValue = 5 - index;
                                        return (
                                            <td key={index} className="border border-slate-300 p-2 text-center">
                                                <input
                                                    type="radio"
                                                    name={factor}
                                                    value={ratingValue}
                                                    checked={formState.ratings[factor] === ratingValue}
                                                    onChange={() => handleRatingChange(factor, ratingValue)}
                                                    className="h-4 w-4 text-primary-red focus:ring-primary-red border-slate-400"
                                                    required
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div>
                 <label className="block text-sm font-medium text-secondary-blue mb-2">Status <span className="text-primary-red">*</span></label>
                 <RadioGroup
                    name="status"
                    value={formState.status}
                    onChange={(e) => setFormState(p => ({...p, status: e.target.value as 'Selected' | 'Not Selected'}))}
                    options={[{label: 'Selected', value: 'Selected'}, {label: 'Not Selected', value: 'Not Selected'}]}
                    required
                 />
            </div>

            <div>
                <Textarea
                    label="Overall Impression *"
                    value={formState.overallImpression}
                    onChange={(e) => setFormState(p => ({...p, overallImpression: e.target.value}))}
                    placeholder="Provide a summary of the candidate's strengths and weaknesses..."
                    rows={4}
                    required
                />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button variant="secondary" type="button" onClick={closeModal}>Cancel</Button>
                <Button type="submit" disabled={!isFormValid || isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit to HOD'}
                </Button>
            </div>
        </div>
        </form>
      </Modal>
    <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeSubmitFeedback}
        title="Confirm Feedback Submission"
        message="Are you sure you want to submit this interview feedback? You will not be able to edit it later."
        confirmText="Submit Feedback"
        isConfirming={isSubmitting}
    />

    {/* Resume Modal */}
    <Modal 
      isOpen={isResumeModalOpen} 
      onClose={closeResumeModal} 
      title={`Resume - ${selectedResumeCandidate?.name}`}
      size="6xl"
    >
      <div className="h-[80vh] w-full">
        {selectedResumeCandidate?.resume ? (
          <div className="h-full">
            <iframe
              src={getResumeUrl(selectedResumeCandidate.resume)}
              className="w-full h-full border-0 rounded-lg"
              title={`${selectedResumeCandidate.name} Resume`}
            />
            {/* Fallback message */}
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500">
                If the resume doesn't load above, click "Open in New Tab" below
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
            <div className="text-center">
              <FileIcon />
              <p className="mt-2 text-sm text-gray-500">No resume available for this candidate</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-end mt-4">
        <Button variant="secondary" onClick={closeResumeModal}>
          Close
        </Button>
        {selectedResumeCandidate?.resume && (
          <Button 
            className="ml-2"
            onClick={() => window.open(getResumeUrl(selectedResumeCandidate.resume), '_blank')}
          >
            Open in New Tab
          </Button>
        )}
      </div>
    </Modal>
    </>
  );
};

export default InterviewAssessment;
