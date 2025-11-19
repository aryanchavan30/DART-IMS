

import React, { useState, useEffect, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import apiService from '../services/apiService.ts';
import { Candidate, User, Department, CandidateStatus, Role, Shift, InternStatus } from '../types';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Textarea from '../components/ui/Textarea';
import FileUpload from '@/components/ui/FileUpload.tsx';

const Onboarding: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allDepartments, setAllDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [confirmationState, setConfirmationState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm' });

    const initialFormState = {
        shift: Shift.GENERAL,
        weekOffs: [0, 6] as number[],
        joiningDate: '',
        contactNumber: '',
        linkedinProfile: '',
        qualification: '',
        branch: '',
        collegeName: '',
        yearOfPassing: '',
        applicantStatus: 'Fresher',
        areaOfInterest: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        plantLocation: '',
        bankName: '',
        accountNumber: '',
        panNumber: '',
        ifscCode: ''
    };
    
    const [onboardingData, setOnboardingData] = useState(initialFormState);
    const [files, setFiles] = useState({
            aadhar: null as File | null,
            pan: null as File | null,
            bankPassbook: null as File | null,
        });

    useEffect(() => {
        if (user?.role !== Role.HR) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [cands, usrs, depts] = await Promise.all([
                    apiService.getCandidates(),
                    apiService.getUsers(),
                    apiService.getDepartments()
                ]);
                
                const onboardable = cands.filter(c => c.status === CandidateStatus.SELECTED);
                setCandidates(onboardable);
                setAllUsers(usrs);
                setAllDepartments(depts);
            } catch (error) {
                addToast('Failed to load candidates for onboarding.', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user, addToast]);
    
    const mentors = useMemo(() => allUsers.filter(u => u.role === Role.MENTOR), [allUsers]);
    const getMentorName = (id?: string) => mentors.find(m => m.id === id)?.name || 'N/A';
    const getDepartmentName = (id?: string) => allDepartments.find(d => d.id === id)?.name || 'N/A';
    
    const openModal = (candidate: Candidate) => {
        setSelectedCandidate(candidate);
        // Reset form for new candidate with proper joining date formatting
        const formattedJoiningDate = candidate.joining_date || new Date().toISOString().split('T')[0];
        setOnboardingData({
            ...initialFormState,
            joiningDate: formattedJoiningDate
        });
        // Reset files for new candidate
        setFiles({
            aadhar: null,
            pan: null,
            bankPassbook: null,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedCandidate(null);
    };
    
    const closeConfirmation = () => setConfirmationState({ ...confirmationState, isOpen: false });

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setOnboardingData(prev => ({...prev, [name]: value}));
    };

    const handleWeekOffChange = (dayIndex: number) => {
        setOnboardingData(prev => {
            const newWeekOffs = new Set(prev.weekOffs);
            if (newWeekOffs.has(dayIndex)) {
                newWeekOffs.delete(dayIndex);
            } else {
                newWeekOffs.add(dayIndex);
            }
            return { ...prev, weekOffs: Array.from(newWeekOffs).sort() };
        });
    };
    const handleFileSelect = (field: keyof typeof files, file: File | null) => {
        setFiles(prev => ({ ...prev, [field]: file }));
    };

    const executeOnboard = async () => {
        if (!selectedCandidate) return;

        setIsSubmitting(true);
        try {
            // Use the Django API's onboard endpoint which handles the complete onboarding process
            const userData = {
                shift: onboardingData.shift,
                week_offs: onboardingData.weekOffs,
                login_id: `SIIL-I${selectedCandidate.id.slice(-4)}`,
            };

            const internData = {
                joining_date: onboardingData.joiningDate,
                bank_details: {
                    bank_name: onboardingData.bankName,
                    account_number: onboardingData.accountNumber,
                    ifsc_code: onboardingData.ifscCode,
                    pan_number: onboardingData.panNumber,
                }
            };

            // Prepare document files
            const documents = {
                aadhar: files.aadhar,
                pan: files.pan,
                bankPassbook: files.bankPassbook
            };

            await apiService.onboardCandidate(selectedCandidate.id, userData, internData, documents);

            addToast(`${selectedCandidate.name} has been successfully onboarded!`, 'success');
            setCandidates(prev => prev.filter(c => c.id !== selectedCandidate.id));
            closeModal();
            closeConfirmation();

        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Onboarding failed.', 'error');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOnboardSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setConfirmationState({
            isOpen: true,
            title: 'Confirm Onboarding',
            message: `Are you sure you want to onboard ${selectedCandidate?.name}? This will create their official intern profile.`,
            onConfirm: executeOnboard,
            confirmText: 'Confirm & Onboard'
        });
    };

    if (user?.role !== Role.HR) {
        // Redirect non-HR users away
        return <ReactRouterDOM.Navigate to="/dashboard" replace />;
    }

    return (
        <>
            <Card>
                <h1 className="text-2xl font-bold mb-4">Intern Onboarding</h1>
                <p className="text-slate-500 mb-6">The following candidates have been selected and are ready for onboarding.</p>
                {isLoading ? <Spinner /> : (
                    <Table headers={['Candidate', 'Department', 'Mentor', 'Joining Date', 'Actions']}>
                        {candidates.map(candidate => (
                            <tr key={candidate.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                                    <div className="text-sm text-gray-500">{candidate.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{getDepartmentName(candidate.department)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{getMentorName(candidate.assigned_mentor)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{candidate.joining_date}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Button size="sm" onClick={() => openModal(candidate)}>Onboard</Button>
                                </td>
                            </tr>
                        ))}
                        {candidates.length === 0 && !isLoading && (
                            <tr><td colSpan={5} className="text-center py-10 text-slate-500">No candidates are pending onboarding.</td></tr>
                        )}
                    </Table>
                )}
            </Card>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={`Onboard ${selectedCandidate?.name}`} size="3xl">
                <form onSubmit={handleOnboardSubmit}>
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
                        {/* Personal Information */}
                        <div>
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <Input label="Full Name" name="fullName" value={selectedCandidate?.name || ''} readOnly />
                               <Input 
                                 label="Date of Joining" 
                                 name="joiningDate" 
                                 type="date"
                                 value={onboardingData.joiningDate} 
                                 onChange={handleFormChange} 
                                 required 
                               />
                               <Input label="Contact No." name="contactNumber" value={onboardingData.contactNumber} onChange={handleFormChange} required />
                               <Input label="Email of Applicant" name="email" value={selectedCandidate?.email || ''} readOnly />
                               <Input label="Linkedin Profile" name="linkedinProfile" value={onboardingData.linkedinProfile} onChange={handleFormChange} />
                            </div>
                        </div>

                        {/* Academic & Professional */}
                        <div>
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Academic & Professional</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Qualification" name="qualification" value={onboardingData.qualification} onChange={handleFormChange} required />
                                <Input label="Branch" name="branch" value={onboardingData.branch} onChange={handleFormChange} required />
                                <Input label="College Name" name="collegeName" value={onboardingData.collegeName} onChange={handleFormChange} required />
                                <Input label="Year of Passing" name="yearOfPassing" type="number" placeholder="YYYY" value={onboardingData.yearOfPassing} onChange={handleFormChange} required />
                                <Select label="Applicant Status" name="applicantStatus" value={onboardingData.applicantStatus} onChange={handleFormChange}>
                                    <option>Fresher</option>
                                    <option>Experienced</option>
                                </Select>
                                <Input label="Area of Interest" name="areaOfInterest" value={onboardingData.areaOfInterest} onChange={handleFormChange} required />
                            </div>
                        </div>
                        
                        {/* Location & Other Details */}
                        <div>
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Location & Other Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="md:col-span-2">
                                     <Textarea label="Address" name="address" value={onboardingData.address} onChange={handleFormChange} required />
                                 </div>
                                 <Input label="City" name="city" value={onboardingData.city} onChange={handleFormChange} required />
                                 <Input label="State" name="state" value={onboardingData.state} onChange={handleFormChange} required />
                                 <Input label="Zip Code" name="zipCode" value={onboardingData.zipCode} onChange={handleFormChange} required />
                                 <Input label="Plant Location" name="plantLocation" value={onboardingData.plantLocation} onChange={handleFormChange} required />
                            </div>
                        </div>
                        
                        {/* Operational Details */}
                        <div>
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Operational Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select label="Shift" name="shift" value={onboardingData.shift} onChange={handleFormChange} required>
                                    {Object.values(Shift).map(s => <option key={s} value={s}>{s}</option>)}
                                </Select>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-blue mb-1">Week Offs</label>
                                    <div className="grid grid-cols-4 gap-2 mt-2">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                            <label key={index} className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer border-2 transition-colors ${onboardingData.weekOffs.includes(index) ? 'bg-light-blue border-secondary-blue' : 'bg-white border-gray-300'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={onboardingData.weekOffs.includes(index)}
                                                    onChange={() => handleWeekOffChange(index)}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary-red focus:ring-primary-red"
                                                />
                                                <span className="text-sm">{day}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Bank Details */}
                        <div>
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Bank Detail</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Bank Name" name="bankName" value={onboardingData.bankName} onChange={handleFormChange} required />
                                <Input label="Bank Account No." name="accountNumber" value={onboardingData.accountNumber} onChange={handleFormChange} required />
                                <Input label="PAN No." name="panNumber" value={onboardingData.panNumber} onChange={handleFormChange} required />
                                <Input label="IFSC Code" name="ifscCode" value={onboardingData.ifscCode} onChange={handleFormChange} required />
                             </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Document Uploads</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FileUpload id="aadhar" label="Aadhar Card" onFileSelect={file => handleFileSelect('aadhar', file)} accept=".pdf,image/*" />
                                <FileUpload id="pan" label="PAN Card" onFileSelect={file => handleFileSelect('pan', file)} accept=".pdf,image/*" />
                                <div className="md:col-span-2">
                                    <FileUpload id="bankPassbook" label="Bank Passbook / Cancelled Cheque" onFileSelect={file => handleFileSelect('bankPassbook', file)} accept=".pdf,image/*" />
                                </div>
                             </div>
                        </div>
                    </div>
                    {/* Document Uploads */}
                        

                    <div className="flex justify-end space-x-2 pt-6 border-t mt-6">
                        <Button variant="secondary" type="button" onClick={closeModal} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>Complete Onboarding</Button>
                    </div>
                </form>
            </Modal>
            
             <ConfirmationModal
                isOpen={confirmationState.isOpen}
                onClose={closeConfirmation}
                onConfirm={confirmationState.onConfirm}
                title={confirmationState.title}
                message={confirmationState.message}
                confirmText={confirmationState.confirmText}
                isConfirming={isSubmitting}
            />
        </>
    );
};

export default Onboarding;
