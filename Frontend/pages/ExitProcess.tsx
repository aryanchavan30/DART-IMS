
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import apiService from '../services/apiService.ts';
import notificationService from '../services/notificationService';
import { ExitRequest, Role, ApprovalStatus, Intern, User, Department, Candidate } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { SearchIcon, DownloadIcon, CalendarIcon } from '../components/icons';
import RadioGroup from '../components/ui/RadioGroup';
import Checkbox from '../components/ui/Checkbox';
import Select from '../components/ui/Select';
import FileUpload from '../components/ui/FileUpload';
import Modal from '../components/ui/Modal';
import InternshipCertificate from '../components/exit/InternshipCertificate';
import { certificateService } from '../services/certificateService';

const calculateEndDate = (startDate: string, months: number = 6): string => {
    if (!startDate) return '';
    const date = new Date(startDate);
    // Use setMonth which automatically handles overflow
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
};

const RatingScaleRow: React.FC<{ label: string, value: number, onChange: (value: number) => void, required?: boolean, scaleDescription?: string, viewOnly?: boolean }> = ({ label, value, onChange, required, scaleDescription, viewOnly=false }) => (
    <div className="py-3 border-b border-slate-200 last:border-b-0">
        <label className="block text-sm font-medium text-primary-navy mb-2">{label} {required && <span className="text-primary-red">*</span>}</label>
        {scaleDescription && <p className="text-xs text-slate-500 mb-2">{scaleDescription}</p>}
        <div className="flex items-center justify-between max-w-sm">
            {[1, 2, 3, 4, 5].map(num => (
                <div key={num} className="flex flex-col items-center">
                    <span className="text-xs font-semibold">{num}</span>
                    <input
                        type="radio"
                        name={label}
                        value={num}
                        checked={value === num}
                        onChange={() => !viewOnly && onChange(num)}
                        required={required}
                        disabled={viewOnly}
                        className={`h-4 w-4 text-primary-red border-gray-300 focus:ring-primary-red ${viewOnly ? 'cursor-not-allowed' : ''}`}
                    />
                </div>
            ))}
        </div>
    </div>
);


const ExitProcess: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [exits, setExits] = useState<ExitRequest[]>([]);
    const [interns, setInterns] = useState<Intern[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmationState, setConfirmationState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm', confirmVariant: 'primary' as 'primary' | 'danger' });
    const [searchTerm, setSearchTerm] = useState('');
    const [internInfo, setInternInfo] = useState<{
        user: User;
        profile: Intern;
        candidate: Candidate;
        department: Department;
        mentor: User;
        hod: User;
    } | null>(null);

    // Modal states
    const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ExitRequest | null>(null);
    const [approverComment, setApproverComment] = useState('');

    const initialFormState = {
        knowledgeBefore: 0, knowledgeAfter: 0, developedSkills: '', relevanceRating: 0,
        assignmentSimilarityRating: 0, organizationRating: 0, appliedForCertificate: '',
        kssCount: '', groupInnovationCount: '', bestPart: '', suggestions: '',
        reasonForLeaving: '', otherComments: '', agreementChecked: false,
    };

    const [formState, setFormState] = useState(initialFormState);
    const [reportFile, setReportFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) { setIsLoading(false); return; }
            setIsLoading(true);
            try {
                const [allExits, allInt, allUsers, allDepts] = await Promise.all([
                    apiService.getExitRequests(), apiService.getInterns(), apiService.getUsers(), apiService.getDepartments()
                ]);
                setExits(allExits); setInterns(allInt); setUsers(allUsers); setDepartments(allDepts);

                if (user.role === Role.INTERN) {
                    const profile = allInt.find(i => i.user === user.id);
                    if (profile) {
                        const candidate = await apiService.getCandidateById(profile.candidate);
                        const department = allDepts.find(d => d.id === user.department);
                        const mentor = allUsers.find(u => u.id === profile.mentor);
                        const hod = department ? allUsers.find(u => u.id === department.hod) : undefined;
                        if (candidate && department && mentor && hod) setInternInfo({ user, profile, candidate, department, mentor, hod });
                        else setInternInfo(null);
                    } else setInternInfo(null);
                }
            } catch(e) {
                addToast("Failed to fetch exit data", "error"); setInternInfo(null);
            } finally { setIsLoading(false); }
        };
        fetchData();
    }, [addToast, user]);
    
    const closeConfirmation = () => setConfirmationState({ ...confirmationState, isOpen: false });

    const getInternUser = useCallback((internId: string) => {
        const intern = interns.find(i => i.id === internId);
        return intern ? users.find(u => u.id === intern.user) : undefined;
    }, [interns, users]);

    const executeRequestSubmit = async () => {
        if (!user || user.role !== Role.INTERN || !reportFile || !internInfo) return;
        
        setIsSubmitting(true);
        try {
            const tempId = String(Date.now()).slice(-4);
            const certificateDataUrl = await certificateService.generateCertificatePdf(tempId, internInfo.user, internInfo.department, internInfo.hod, internInfo.profile);
            const reportUrl = `/docs/reports/exit_report_${user.id}_${reportFile.name}`;
            
            const newRequest: Omit<ExitRequest, 'id'> = {
                intern: internInfo.profile.id, feedback: JSON.stringify(formState),
                internship_report: reportUrl, certificate: certificateDataUrl, status: ApprovalStatus.PENDING,
                hr_approval: ApprovalStatus.PENDING, mentor_approval: ApprovalStatus.PENDING,
                hod_approval: ApprovalStatus.PENDING,
            };
            
            const createdRequest = await apiService.createExitRequest(newRequest);
            setExits(prev => [createdRequest, ...prev]);

            const hrUser = users.find(u => u.role === Role.HR);
            if (hrUser) await notificationService.notifyForExitApproval(hrUser, user.name);

            addToast("Exit form submitted successfully.", "success");
            setIsCertificateModalOpen(false); setFormState(initialFormState); setReportFile(null);
        } catch (e) {
            addToast(e instanceof Error ? e.message : "Failed to submit exit request.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const isFormValid = useMemo(() => (
        formState.knowledgeBefore > 0 && formState.knowledgeAfter > 0 && formState.relevanceRating > 0 &&
        formState.assignmentSimilarityRating > 0 && formState.organizationRating > 0 &&
        formState.appliedForCertificate !== '' && formState.bestPart.trim() !== '' &&
        formState.suggestions.trim() !== '' && formState.reasonForLeaving !== '' &&
        formState.agreementChecked && reportFile !== null
    ), [formState, reportFile]);

    const handleRequestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) {
            addToast("Please fill all required fields, including the file upload.", "error");
            return;
        }
        setIsCertificateModalOpen(true);
    };

    const executeApproval = async (req: ExitRequest, approved: boolean) => {
        if (!user) return;
        
        setIsSubmitting(true);
        let update: Partial<ExitRequest> = {};
        let nextApprover: User | undefined;
        const internUser = getInternUser(req.intern);

        if (!internUser) { setIsSubmitting(false); addToast("Could not find intern for this request.", "error"); return; }
        
        const internProfile = interns.find(i => i.id === req.intern);
        const mentor = internProfile ? users.find(u => u.id === internProfile.mentor) : undefined;
        const department = departments.find(d => d.id === internUser.department);
        const hod = department ? users.find(u => u.id === department.hod) : undefined;
        
        const status = approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;

        switch(user.role) {
            case Role.HR: update = { hr_approval: status, hr_comments: approverComment }; if (approved && mentor) nextApprover = mentor; break;
            case Role.MENTOR: update = { mentor_approval: status, mentor_comments: approverComment }; if (approved && hod) nextApprover = hod; break;
            case Role.HOD: update = { hod_approval: status, status: status, hod_comments: approverComment }; break;
        }
        if (!approved) update.status = ApprovalStatus.REJECTED;

        try {
            // Update the exit request via API
            const updatedReq = await apiService.updateExitRequest(req.id, update);
            
            // Update local state with the response from the API
            setExits(exits.map(e => e.id === req.id ? updatedReq : e));
            
            // Notify next approver if applicable
            if (nextApprover) {
                await notificationService.notifyForExitApproval(nextApprover, internUser.name);
            }
            
            addToast(`Request ${approved ? 'approved' : 'rejected'} successfully.`, "success");
            closeConfirmation();
            setIsReviewModalOpen(false); setSelectedRequest(null); setApproverComment('');
        } catch (e) {
            console.error('Failed to update exit request:', e);
            addToast("Failed to update status.", "error");
        } finally { setIsSubmitting(false); }
    };

    const handleApproval = (req: ExitRequest, approved: boolean) => {
         const internName = getInternUser(req.intern)?.name || 'the intern';
         setConfirmationState({
            isOpen: true, title: `Confirm Exit ${approved ? 'Approval' : 'Rejection'}`,
            message: `Are you sure you want to ${approved ? 'approve' : 'reject'} the exit request for ${internName}?`,
            onConfirm: () => executeApproval(req, approved),
            confirmText: approved ? 'Approve' : 'Reject',
            confirmVariant: approved ? 'primary' : 'danger'
        });
    };
    
    const handleFormStateChange = (field: keyof typeof formState, value: any) => setFormState(prev => ({...prev, [field]: value}));

    const openReviewModal = (req: ExitRequest) => {
        setSelectedRequest(req);
        setIsReviewModalOpen(true);
    };

    const renderRequestForm = () => {
        if (user?.role !== Role.INTERN) return null;
        if (isLoading) return <Card className="mb-6"><Spinner /></Card>;
        if (!internInfo) return <Card className="mb-6"><p className="text-center text-slate-500">Could not load your intern profile. Please contact HR.</p></Card>;
        
        const myRequest = exits.find(e => e.intern === internInfo.profile.id);
        if (myRequest) {
            return (
                <Card className="mb-6">
                    <h2 className="text-xl font-bold mb-4">Your Exit Request Status</h2>
                    <p>Your exit request is currently <Badge status={myRequest.status} />.</p>
                </Card>
            )
        }

        return (
            <Card className="mb-6">
                <h2 className="text-2xl font-bold mb-4 text-center text-primary-navy">Internship Exit Form</h2>
                <form onSubmit={handleRequestSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Name of Intern *" value={internInfo.user.name} readOnly />
                            <Input label="Email id *" value={internInfo.user.email} readOnly />
                            <div className="cursor-pointer" onClick={(e) => {
                                const input = e.currentTarget.querySelector('input');
                                if (input) input.focus();
                            }}>
                                <Input label="Internship Start date *" type="date" value={internInfo.profile.joining_date} readOnly icon={<CalendarIcon />} />
                            </div>
                            <div className="cursor-pointer" onClick={(e) => {
                                const input = e.currentTarget.querySelector('input');
                                if (input) input.focus();
                            }}>
                                <Input label="End date *" type="date" value={calculateEndDate(internInfo.profile.joining_date)} readOnly icon={<CalendarIcon />} />
                            </div>
                            <Input label="College Name *" value={internInfo.candidate.questData?.college_name || internInfo.candidate.questData?.collegeName || internInfo.candidate.questData?.college || internInfo.candidate.questData?.university || 'Not Available'} readOnly />
                            <Input label="Department *" value={internInfo.department.name} readOnly />
                            <Input label="Reporting Manager *" value={internInfo.mentor.name} readOnly />
                        </div>
                    </div>
                    
                    {/* Self Feedback */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-secondary-blue border-b pb-2">SELF FEEDBACK</h3>
                        <div>
                            <label className="block text-sm font-medium text-primary-navy mb-2">1. My level of knowledge/Skill (1 is low and 5 is high) <span className="text-primary-red">*</span></label>
                            <table className="w-full text-center text-sm border">
                                <thead className="bg-light-gray">
                                    <tr><th className="border p-2 text-left"></th>{[1,2,3,4,5].map(n => <th key={n} className="border p-2 font-semibold">{n}</th>)}</tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border p-2 text-left font-medium">Before Internship</td>
                                        {[1,2,3,4,5].map(n => <td key={n} className="border p-2"><input type="radio" name="knowledgeBefore" checked={formState.knowledgeBefore === n} onChange={() => handleFormStateChange('knowledgeBefore', n)} className="h-4 w-4" required/></td>)}
                                    </tr>
                                     <tr>
                                        <td className="border p-2 text-left font-medium">After Internship</td>
                                        {[1,2,3,4,5].map(n => <td key={n} className="border p-2"><input type="radio" name="knowledgeAfter" checked={formState.knowledgeAfter === n} onChange={() => handleFormStateChange('knowledgeAfter', n)} className="h-4 w-4" required/></td>)}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <Textarea label="2. What are the key skills you feel you have developed?" value={formState.developedSkills} onChange={e => handleFormStateChange('developedSkills', e.target.value)} />
                    </div>

                    {/* Internship Relevance */}
                    <div className="space-y-4">
                         <h3 className="text-lg font-semibold text-secondary-blue border-b pb-2">INTERNSHIP RELEVANCE</h3>
                         <RatingScaleRow required label="3. The learning content & skills taught were relevant to my job and role." value={formState.relevanceRating} onChange={v => handleFormStateChange('relevanceRating', v)} scaleDescription="(1 is extremely dissatisfied and 5 is extremely satisfied)" />
                         <RatingScaleRow required label="4. How similar was your actual assignment to your expectation?" value={formState.assignmentSimilarityRating} onChange={v => handleFormStateChange('assignmentSimilarityRating', v)} />
                         <RatingScaleRow required label="5. Rate this organization as a place to work." value={formState.organizationRating} onChange={v => handleFormStateChange('organizationRating', v)} />
                         <div className="pt-2">
                            <label className="block text-sm font-medium text-primary-navy mb-2">8. Have you applied for Internship Certificate? <span className="text-primary-red">*</span></label>
                            <RadioGroup name="appliedForCertificate" options={[{label: 'Yes', value: 'Yes'}, {label: 'No', value: 'No'}]} value={formState.appliedForCertificate} onChange={e => handleFormStateChange('appliedForCertificate', e.target.value)} required />
                        </div>
                    </div>
                    
                    {/* Feedback & Suggestion */}
                     <div className="space-y-4">
                         <h3 className="text-lg font-semibold text-secondary-blue border-b pb-2">FEEDBACK & SUGGESTION</h3>
                         <Input label="Please mention the number of KSS you have taken (You presented)" type="number" value={formState.kssCount} onChange={e => handleFormStateChange('kssCount', e.target.value)} />
                         <Input label="Please mention the number of post you have made in Group Innovation" type="number" value={formState.groupInnovationCount} onChange={e => handleFormStateChange('groupInnovationCount', e.target.value)} />
                         <Textarea required label="Please share the best part of your intern experience" value={formState.bestPart} onChange={e => handleFormStateChange('bestPart', e.target.value)} />
                         <Textarea required label="Any suggestions for improving the internship program" value={formState.suggestions} onChange={e => handleFormStateChange('suggestions', e.target.value)} />
                         <Select required label="Reason for leaving" value={formState.reasonForLeaving} onChange={e => handleFormStateChange('reasonForLeaving', e.target.value)}>
                            <option value="">-- Select a reason --</option> <option>Internship Completed</option> <option>Higher Studies</option> <option>Got another job</option> <option>Personal Reasons</option> <option>Other</option>
                         </Select>
                         <Textarea label="Any other comment you would like to include" value={formState.otherComments} onChange={e => handleFormStateChange('otherComments', e.target.value)} />
                    </div>

                    <div className="space-y-6">
                        <FileUpload id="internshipReport" label="Upload Internship Project Report" onFileSelect={setReportFile} required accept=".pdf,.doc,.docx" subLabel="Please upload your final internship project report." />
                        <Checkbox name="agreementChecked" label={<>I agree that I shall not during, or at any time after the termination of my internship with the Company, use for myself or others, or disclose or divulge to others including future interns any trade secrets, confidential information, or any other proprietary data of the Company . <span className="text-primary-red">*</span></>} checked={formState.agreementChecked} onChange={e => handleFormStateChange('agreementChecked', e.target.checked)} required />
                    </div>

                    <div className="text-center pt-4">
                        <Button type="submit" size="lg" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Preview & Submit'}
                        </Button>
                    </div>
                </form>
            </Card>
        );
    };
    
    const filteredExits = useMemo(() => {
        let baseList = exits;
        if (user?.role === Role.INTERN) {
            const internProfile = interns.find(i => i.user === user.id);
            baseList = internProfile ? exits.filter(req => req.intern === internProfile.id) : [];
        }
        if (searchTerm && user?.role !== Role.INTERN) {
            const lowerSearch = searchTerm.toLowerCase();
            baseList = baseList.filter(req => getInternUser(req.intern)?.name.toLowerCase().includes(lowerSearch));
        }
        return baseList.sort((a,b) => (a.status === ApprovalStatus.PENDING ? -1 : 1) - (b.status === ApprovalStatus.PENDING ? -1 : 1) || b.id.localeCompare(a.id));
    }, [exits, user, interns, getInternUser, searchTerm]);

    const renderActions = (req: ExitRequest) => {
        if (!user || req.status !== ApprovalStatus.PENDING) return null;
        const canApprove = (role: Role, req: ExitRequest) => {
             switch(role) {
                case Role.HR: return req.hr_approval === ApprovalStatus.PENDING;
                case Role.MENTOR: const iMentor = interns.find(i=>i.id===req.intern)?.mentor; return iMentor===user.id && req.hr_approval===ApprovalStatus.APPROVED && req.mentor_approval===ApprovalStatus.PENDING;
                case Role.HOD: const iDept = getInternUser(req.intern)?.department; const dHod = departments.find(d=>d.id===iDept)?.hod; return dHod===user.id && req.mentor_approval===ApprovalStatus.APPROVED && req.hod_approval===ApprovalStatus.PENDING;
                default: return false;
            }
        };
        if(canApprove(user.role, req)) return <Button size="sm" onClick={() => openReviewModal(req)}>Review</Button>;
        return <span className="text-xs text-slate-500">Awaiting prior approval</span>;
    }

    const renderReviewModal = () => {
        if (!selectedRequest) return null;
        const feedback = JSON.parse(selectedRequest.feedback);
        const internUser = getInternUser(selectedRequest.intern);
        const fileName = `Internship_Certificate_${internUser?.name?.replace(/\s/g, '_') || 'Intern'}.pdf`;

        return (
            <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title={`Review Exit Form for ${internUser?.name}`} size="4xl">
                <div className="max-h-[80vh] overflow-y-auto p-1 space-y-6">
                    <div className="flex justify-between items-center bg-light-gray p-3 rounded-md">
                        <h3 className="text-lg font-bold text-primary-navy">Intern Feedback</h3>
                        <div className="flex space-x-2">
                             <a href={selectedRequest.internship_report} target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="sm">View Report</Button></a>
                            <a href={selectedRequest.certificate} download={fileName}><Button size="sm"><DownloadIcon /> Download Certificate</Button></a>
                        </div>
                    </div>
                    {/* Render read-only form */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-secondary-blue border-b pb-2">INTERNSHIP RELEVANCE</h3>
                         <RatingScaleRow viewOnly label="3. Learning content & skills relevance" value={feedback.relevanceRating} onChange={()=>{}} />
                         <RatingScaleRow viewOnly label="4. Assignment similarity to expectation" value={feedback.assignmentSimilarityRating} onChange={()=>{}} />
                         <RatingScaleRow viewOnly label="5. Organization as a place to work" value={feedback.organizationRating} onChange={()=>{}} />
                    </div>
                    {/* Add more feedback sections as needed */}
                     <div className="space-y-4">
                         <h3 className="text-lg font-semibold text-secondary-blue border-b pb-2">FEEDBACK & SUGGESTION</h3>
                         <p><strong>Best Part:</strong> {feedback.bestPart}</p>
                         <p><strong>Suggestions:</strong> {feedback.suggestions}</p>
                         <p><strong>Reason for Leaving:</strong> {feedback.reasonForLeaving}</p>
                    </div>

                    <div className="pt-4 border-t">
                        <Textarea label="Your Comments (Optional)" placeholder="Add your comments here..." value={approverComment} onChange={e => setApproverComment(e.target.value)} />
                    </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
                    <Button variant="secondary" onClick={() => setIsReviewModalOpen(false)}>Cancel</Button>
                    <Button variant="danger" onClick={() => handleApproval(selectedRequest, false)}>Reject</Button>
                    <Button onClick={() => handleApproval(selectedRequest, true)}>Approve</Button>
                </div>
            </Modal>
        )
    }

    return (
        <>
        <div>
            {renderRequestForm()}
            {user?.role !== Role.INTERN && (
                <Card>
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                        <h2 className="text-xl font-bold">Exit Requests History</h2>
                        <div className="w-full sm:w-72"><Input icon={<SearchIcon />} placeholder="Search by intern name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                    </div>
                    {isLoading ? <Spinner /> : (
                        <Table headers={['Intern', 'Status', 'Approvals', 'Actions']}>
                            {filteredExits.map(req => {
                                const internUser = getInternUser(req.intern);
                                return (
                                    <tr key={req.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{internUser?.name || 'N/A'}</td>
                                        <td className="px-6 py-4"><Badge status={req.status} /></td>
                                        <td className="px-6 py-4"><div className="flex flex-col space-y-1 text-xs">
                                            <span>HR: <Badge status={req.hr_approval} /></span><span>Mentor: <Badge status={req.mentor_approval} /></span>
                                            <span>HOD: <Badge status={req.hod_approval} /></span>
                                        </div></td>
                                        <td className="px-6 py-4">{renderActions(req)}</td>
                                    </tr>
                                )
                            })}
                            {filteredExits.length === 0 && (<tr><td colSpan={4} className="text-center py-10 text-slate-500">No exit requests found.</td></tr>)}
                        </Table>
                    )}
                </Card>
            )}
        </div>
        <ConfirmationModal isOpen={confirmationState.isOpen} onClose={closeConfirmation} onConfirm={confirmationState.onConfirm} title={confirmationState.title} message={confirmationState.message} confirmText={confirmationState.confirmText} confirmVariant={confirmationState.confirmVariant} isConfirming={isSubmitting} />
        {internInfo && 
            <Modal isOpen={isCertificateModalOpen} onClose={() => setIsCertificateModalOpen(false)} title="Confirm & Submit" size="4xl">
                <div className="p-2 bg-light-gray max-h-[70vh] overflow-y-auto">
                    <InternshipCertificate 
                        referenceNo={`SIIL/HR/DART/${String(Date.now()).slice(-4)}`}
                        date={new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        internName={internInfo.user.name}
                        startDate={new Date(internInfo.profile.joining_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        endDate={new Date(calculateEndDate(internInfo.profile.joining_date)).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        departmentName={internInfo.department.name}
                        hodName={internInfo.hod.name}
                    />
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
                    <Button variant="secondary" onClick={() => setIsCertificateModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={executeRequestSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Accept & Submit'}
                    </Button>
                </div>
            </Modal>
        }
        {renderReviewModal()}
        </>
    );
};

export default ExitProcess;
