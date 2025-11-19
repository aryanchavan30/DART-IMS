
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import apiService from '../services/apiService.ts';
import notificationService from '../services/notificationService';
import { ExtensionRequest, Role, ApprovalStatus, Intern, User, Department } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Input from '../components/ui/Input';
import { SearchIcon, CalendarIcon } from '../components/icons';
import Modal from '../components/ui/Modal';

const ExtensionRequests: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [extensions, setExtensions] = useState<ExtensionRequest[]>([]);
    const [interns, setInterns] = useState<Intern[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmationState, setConfirmationState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm', confirmVariant: 'primary' as 'primary' | 'danger' });
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [months, setMonths] = useState<1 | 2 | 3>(1);
    const [reason, setReason] = useState('');

    // State for intern's own details
    const [internDetails, setInternDetails] = useState<{
        internProfile: Intern | null;
        department: Department | null;
        mentor: User | null;
        originalEndDate: string;
    }>({ internProfile: null, department: null, mentor: null, originalEndDate: '' });

    // State for approver's review modal
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ExtensionRequest | null>(null);

    const calculateEndDate = (startDate: string, monthsToAdd: number): string => {
        if (!startDate) return '';
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + monthsToAdd);
        return date.toISOString().split('T')[0];
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [allExt, allInt, allUsers, allDepts] = await Promise.all([
                    apiService.getExtensionRequests(),
                    apiService.getInterns(),
                    apiService.getUsers(),
                    apiService.getDepartments(),
                ]);
                setExtensions(allExt);
                setInterns(allInt);
                setUsers(allUsers);
                setDepartments(allDepts);

                if (user && user.role === Role.INTERN) {
                    const internProfile = allInt.find(i => i.user === user.id);
                    if (internProfile) {
                        const department = allDepts.find(d => d.id === user.department);
                        const mentor = allUsers.find(u => u.id === internProfile.mentor);
                        // Assuming a 6-month internship duration
                        const originalEndDate = calculateEndDate(internProfile.joining_date, 6);
                        
                        setInternDetails({
                            internProfile,
                            department: department || null,
                            mentor: mentor || null,
                            originalEndDate
                        });
                    }
                }
            } catch(e) {
                addToast("Failed to fetch extension data", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [addToast, user]);
    
    const closeConfirmation = () => setConfirmationState({ ...confirmationState, isOpen: false });

    const getInternUser = useCallback((internId: string) => {
        const intern = interns.find(i => i.id === internId);
        return intern ? users.find(u => u.id === intern.user) : undefined;
    }, [interns, users]);

    const executeRequestSubmit = async () => {
        if (!user || user.role !== Role.INTERN) return;
        const internProfile = interns.find(i => i.user === user.id);
        if (!internProfile) {
            addToast("Intern profile not found.", "error");
            return;
        }

        setIsSubmitting(true);
        const newRequest: Omit<ExtensionRequest, 'id'> = {
            intern: internProfile.id,
            months_requested: months,
            reason,
            status: ApprovalStatus.PENDING,
            hr_approval: ApprovalStatus.PENDING,
            mentor_approval: ApprovalStatus.PENDING,
            hod_approval: ApprovalStatus.PENDING
        };

        try {
            const createdRequest = await apiService.createExtensionRequest(newRequest);
            setExtensions([...extensions, createdRequest]);
            const hrUser = users.find(u => u.role === Role.HR);
            if (hrUser) {
                await notificationService.notifyForExtensionApproval(hrUser, user.name);
            }
            addToast("Extension request submitted successfully.", "success");
            setReason('');
            closeConfirmation();
        } catch(e) {
            addToast("Failed to submit request.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setConfirmationState({
            isOpen: true,
            title: 'Confirm Extension Request',
            message: `Are you sure you want to request a ${months}-month extension?`,
            onConfirm: executeRequestSubmit,
            confirmText: 'Submit Request',
            confirmVariant: 'primary'
        });
    };
    
    const executeApproval = async (req: ExtensionRequest, approved: boolean) => {
        if (!user) return;
        
        setIsSubmitting(true);
        let update: Partial<ExtensionRequest> = {};
        let nextApprover: User | undefined;
        const internUser = getInternUser(req.intern);
        
        // Use API-provided intern details if available, otherwise use lookup
        const internName = req.intern_name || internUser?.name || 'Intern';
        const internEmail = req.intern_email || internUser?.email || '';

        if (!internName || !internEmail) {
            addToast("Intern details not available for this request.", "error");
            setIsSubmitting(false);
            return;
        }
        
        const internProfile = interns.find(i => i.id === req.intern);
        const mentor = internProfile ? users.find(u => u.id === internProfile.mentor) : undefined;
        
        // Try to get department from internUser, or find any department as fallback
        let department: Department | undefined;
        if (internUser?.department) {
            department = departments.find(d => d.id === internUser.department);
        }
        // If no department found and we have departments available, use first one as fallback
        if (!department && departments.length > 0) {
            department = departments[0];
        }
        
        const hod = department ? users.find(u => u.id === department.hod) : undefined;
        
        const status = approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;

        switch(user.role) {
            case Role.HR:
                update = { hr_approval: status };
                if (approved && mentor) nextApprover = mentor;
                break;
            case Role.MENTOR:
                update = { mentor_approval: status };
                if (approved && hod) nextApprover = hod;
                break;
            case Role.HOD:
                update = { hod_approval: status, status: status };
                if (approved) {
                    await notificationService.notifyInternOfExtensionStatus(internEmail, internName, 'approved');
                } else {
                    await notificationService.notifyInternOfExtensionStatus(internEmail, internName, 'rejected');
                }
                break;
        }

        if (!approved) {
            update.status = ApprovalStatus.REJECTED;
             await notificationService.notifyInternOfExtensionStatus(internEmail, internName, 'rejected');
        }

        try {
            // Update the extension request via API
            const updatedReq = await apiService.updateExtensionRequest(req.id, update);
            
            // Update local state with the response from the API
            setExtensions(extensions.map(e => e.id === req.id ? updatedReq : e));
            
            // Notify next approver if applicable
            if (nextApprover) {
                await notificationService.notifyForExtensionApproval(nextApprover, internName);
            }
            
            addToast(`Request ${approved ? 'approved' : 'rejected'} successfully.`, "success");
            closeConfirmation();
            closeDetailsModal();
        } catch (e) {
            console.error('Failed to update extension request:', e);
            addToast("Failed to update status.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApproval = (req: ExtensionRequest, approved: boolean) => {
        const internName = req.intern_name || getInternUser(req.intern)?.name || 'the intern';
         setConfirmationState({
            isOpen: true,
            title: `Confirm ${approved ? 'Approval' : 'Rejection'}`,
            message: `Are you sure you want to ${approved ? 'approve' : 'reject'} the extension request for ${internName}?`,
            onConfirm: () => executeApproval(req, approved),
            confirmText: approved ? 'Approve' : 'Reject',
            confirmVariant: approved ? 'primary' : 'danger'
        });
    }

    const renderRequestForm = () => {
        if (user?.role !== Role.INTERN) return null;

        const { internProfile, department, mentor, originalEndDate } = internDetails;
        if (!internProfile && !isLoading) {
            return <Card className="mb-6"><p>Your intern profile could not be found.</p></Card>;
        }
        if (!internProfile) {
            return <Card className="mb-6"><Spinner /></Card>;
        }

        // Check if intern has permission to request extensions
        if (!internProfile.extension_allowed) {
            return (
                <Card className="mb-6">
                    <div className="text-center p-6">
                        <h2 className="text-xl font-bold mb-3 text-slate-800">Request Internship Extension</h2>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                            <p className="text-yellow-800 mb-2">
                                <strong>Extension requests are currently not available for your account.</strong>
                            </p>
                            <p className="text-sm text-yellow-700">
                                To request an extension, both HR and your department HOD must first approve your eligibility. 
                                Please contact HR or your HOD for more information.
                            </p>
                        </div>
                        <p className="text-sm text-slate-500">
                            If you believe this is an error, please reach out to the HR department for assistance.
                        </p>
                    </div>
                </Card>
            );
        }

        const newEndDate = calculateEndDate(originalEndDate, months);
        const myRequest = extensions.find(e => e.intern === internDetails.internProfile?.id);

        if (myRequest) {
            return (
                <Card className="mb-6">
                    <h2 className="text-xl font-bold mb-4">Extension Request Status</h2>
                    <p>You have already submitted an extension request. Its current status is: <Badge status={myRequest.status} /></p>
                </Card>
            )
        }

        return (
            <Card className="mb-6">
                <h2 className="text-xl font-bold mb-4">Request Internship Extension</h2>
                <form onSubmit={handleRequestSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Candidate Name" value={user.name} readOnly />
                        <Input label="Email ID" value={user.email} readOnly />
                        <Input label="Department" value={department?.name || 'N/A'} readOnly />
                        <div className="cursor-pointer" onClick={(e) => {
                            const input = e.currentTarget.querySelector('input');
                            if (input) input.focus();
                        }}>
                            <Input label="Current Internship End Date" value={originalEndDate} type="date" readOnly icon={<CalendarIcon />} />
                        </div>
                        <Input label="Mentor Name (Reporting Manager)" value={mentor?.name || 'N/A'} readOnly />
                        <Input label="Mentor Email" value={mentor?.email || 'N/A'} readOnly />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t mt-4">
                        <Select label="No. of months for extension" value={months} onChange={e => setMonths(Number(e.target.value) as 1 | 2 | 3)}>
                            <option value={1}>1 Month</option>
                            <option value={2}>2 Months</option>
                            <option value={3}>3 Months</option>
                        </Select>
                        <div className="cursor-pointer" onClick={(e) => {
                            const input = e.currentTarget.querySelector('input');
                            if (input) input.focus();
                        }}>
                            <Input label="New Extension Date" value={newEndDate} type="date" readOnly icon={<CalendarIcon />} />
                        </div>
                    </div>

                    <Textarea label="Reason for Extension" value={reason} onChange={e => setReason(e.target.value)} required rows={4} placeholder="Please provide a clear justification for your extension request." />
                    <div className="text-right">
                        <Button type="submit" disabled={isSubmitting}>Submit Request</Button>
                    </div>
                </form>
            </Card>
        );
    };
    
    const filteredExtensions = useMemo(() => {
        let baseList = extensions;
        if (user?.role === Role.INTERN) {
             const internProfile = interns.find(i => i.user === user.id);
             baseList = internProfile ? extensions.filter(req => req.intern === internProfile.id) : [];
        } else if (user?.role === Role.MENTOR) {
            // Filter to show only extension requests for interns mentored by current user
            baseList = extensions.filter(req => {
                const internProfile = interns.find(i => i.id === req.intern);
                return internProfile?.mentor === user.id;
            });
        }

        if (searchTerm && user?.role !== Role.INTERN) {
            const lowerSearch = searchTerm.toLowerCase();
            baseList = baseList.filter(req => {
                const internName = req.intern_name || getInternUser(req.intern)?.name || '';
                return internName.toLowerCase().includes(lowerSearch);
            });
        }

        return baseList.sort((a,b) => (a.status === ApprovalStatus.PENDING ? -1 : 1) - (b.status === ApprovalStatus.PENDING ? -1 : 1) || b.id.localeCompare(a.id));
    }, [extensions, user, interns, getInternUser, searchTerm]);
    
    const openDetailsModal = (req: ExtensionRequest) => {
        setSelectedRequest(req);
        setIsDetailsModalOpen(true);
    };

    const closeDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedRequest(null);
    };

    const renderActions = (req: ExtensionRequest) => {
        if (!user || req.status !== ApprovalStatus.PENDING) return null;
        
        const canApprove = (role: Role, req: ExtensionRequest) => {
             switch(role) {
                case Role.HR: return req.hr_approval === ApprovalStatus.PENDING;
                case Role.MENTOR: {
                    const internProfile = interns.find(i => i.id === req.intern);
                    return internProfile?.mentor === user.id && req.hr_approval === ApprovalStatus.APPROVED && req.mentor_approval === ApprovalStatus.PENDING;
                }
                case Role.HOD: {
                    const internUser = getInternUser(req.intern);
                    let department: Department | null = null;
                    if (internUser?.department) {
                        department = departments.find(d => d.id === internUser.department) || null;
                    }
                    return department?.hod === user.id && req.mentor_approval === ApprovalStatus.APPROVED && req.hod_approval === ApprovalStatus.PENDING;
                }
                default: return false;
            }
        };

        if(canApprove(user.role, req)) {
            return <Button size="sm" onClick={() => openDetailsModal(req)}>Review</Button>
        }
        return null;
    }

    const renderDetailsModal = () => {
        if (!selectedRequest) return null;

        const internUser = getInternUser(selectedRequest.intern);
        const internProfile = interns.find(i => i.id === selectedRequest.intern);
        let department: Department | null = null;
        if (internUser?.department) {
            department = departments.find(d => d.id === internUser.department) || null;
        }
        const mentor = internProfile ? users.find(u => u.id === internProfile.mentor) : null;
        const originalEndDate = internProfile ? calculateEndDate(internProfile.joining_date, 6) : '';
        const newEndDate = calculateEndDate(originalEndDate, selectedRequest.months_requested);

        return (
            <Modal isOpen={isDetailsModalOpen} onClose={closeDetailsModal} title={`Review Extension for ${selectedRequest.intern_name || internUser?.name || 'Intern'}`} size="2xl">
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm p-4 bg-light-gray rounded-lg">
                        <p><strong>Intern:</strong> {selectedRequest.intern_name || internUser?.name || 'N/A'}</p>
                        <p><strong>Email:</strong> {selectedRequest.intern_email || internUser?.email || 'N/A'}</p>
                        <p><strong>Department:</strong> {department?.name}</p>
                        <p><strong>Mentor:</strong> {mentor?.name}</p>
                        <p><strong>Current End Date:</strong> {originalEndDate}</p>
                        <p><strong>Requested Extension:</strong> {selectedRequest.months_requested} Month(s)</p>
                        <p className="font-bold col-span-2 text-base text-primary-red">New Proposed End Date: {newEndDate}</p>
                    </div>
                    <div>
                        <p className="font-semibold mb-1">Reason for Extension:</p>
                        <p className="text-slate-600 bg-slate-50 p-3 rounded-md border">{selectedRequest.reason}</p>
                    </div>
                    <div>
                        <p className="font-semibold mb-2">Approval Status</p>
                         <div className="flex flex-wrap gap-x-4 gap-y-2">
                            <span>HR: <Badge status={selectedRequest.hr_approval} /></span>
                            <span>Mentor: <Badge status={selectedRequest.mentor_approval} /></span>
                            <span>HOD: <Badge status={selectedRequest.hod_approval} /></span>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
                        <Button variant="secondary" onClick={closeDetailsModal} disabled={isSubmitting}>Cancel</Button>
                        <Button variant="danger" onClick={() => handleApproval(selectedRequest, false)} disabled={isSubmitting}>Reject</Button>
                        <Button onClick={() => handleApproval(selectedRequest, true)} disabled={isSubmitting}>Approve</Button>
                    </div>
                </div>
            </Modal>
        )
    }

    return (
        <>
        <div>
            {renderRequestForm()}
            <Card>
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold">Extension Requests History</h2>
                    {user?.role !== Role.INTERN && (
                        <div className="w-full sm:w-72">
                            <Input
                                icon={<SearchIcon />}
                                placeholder="Search by intern name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                </div>
                {isLoading ? <Spinner /> : (
                    <Table headers={['Intern', 'Duration', 'Reason', 'Status', 'Actions']}>
                        {filteredExtensions.map(req => {
                            const internUser = getInternUser(req.intern);
                            return (
                                <tr key={req.id} className="hover:bg-slate-50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap">{req.intern_name || internUser?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-center">{req.months_requested} Month(s)</td>
                                    <td className="px-6 py-4 text-sm text-slate-500 max-w-sm truncate" title={req.reason}>{req.reason}</td>
                                    <td className="px-6 py-4"><Badge status={req.status} /></td>
                                    <td className="px-6 py-4">{renderActions(req)}</td>
                                </tr>
                            )
                        })}
                         {filteredExtensions.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-10 text-slate-500">No extension requests found.</td></tr>
                        )}
                    </Table>
                )}
            </Card>
        </div>
        {renderDetailsModal()}
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

export default ExtensionRequests;
