import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import apiService from '../services/apiService.ts';
import notificationService from '../services/notificationService';
import { LeaveRequest, Role, Intern, User, Department, ApprovalStatus, LeaveType, LeaveHalf } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Table from '../components/ui/Table';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import { FilePlusIcon, SearchIcon } from '../components/icons';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Select from '../components/ui/Select';

const LeaveRequests: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationState, setConfirmationState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm', confirmVariant: 'primary' as 'primary' | 'danger' });
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for new leave request
  const [formState, setFormState] = useState({
    startDate: '',
    endDate: '',
    leaveType: LeaveType.FULL_DAY,
    leaveHalf: LeaveHalf.FIRST_HALF,
    reason: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [allLeaves, allInterns, allUsers, allDepts] = await Promise.all([
          apiService.getLeaveRequests(),
          apiService.getInterns(),
          apiService.getUsers(),
          apiService.getDepartments(),
        ]);
        setLeaves(allLeaves.sort((a,b) => b.id.localeCompare(a.id)));
        setInterns(allInterns);
        setUsers(allUsers);
        setDepartments(allDepts);
      } catch (error) {
        addToast("Failed to fetch data.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [addToast]);

  const internProfile = useMemo(() => {
    if (!user) return null;
    return interns.find(i => i.user === user.id);
  }, [user, interns]);

  const mentor = useMemo(() => {
    // --- Start of Debugging Block ---
    console.groupCollapsed("--- Mentor Calculation Debug ---"); // Creates a collapsible group in the console
    
    console.log("Timestamp:", new Date().toLocaleTimeString());
    console.log("Is data still loading?", isLoading);
    
    // Check if the necessary data is available
    if (isLoading) {
      console.log("Result: Returning null because data is still loading.");
      console.groupEnd();
      return null;
    }
    
    console.log("Intern Profile (State):", internProfile);
    
    if (!internProfile) {
      console.log("Result: Returning null because internProfile is not found.");
      console.groupEnd();
      return null;
    }
    
    const mentorIdToFind = internProfile.mentor;
    console.log("Mentor ID from Intern Profile:", mentorIdToFind);
    console.log("Data Type of Mentor ID:", typeof mentorIdToFind);
    
    if (!mentorIdToFind) {
      console.log("Result: Returning null because internProfile has no mentor ID.");
      console.groupEnd();
      return null;
    }

    console.log("All Users Array (State):", users);
    
    if (users.length === 0) {
      console.log("Result: Returning null because the 'users' array is empty.");
      console.groupEnd();
      return null;
    }
    
    // Attempt to find the mentor
    const foundMentor = users.find(u => {
      // Log each comparison for clarity
      const isMatch = String(u.id) === String(mentorIdToFind);
      if (isMatch) {
        console.log(`%cMATCH FOUND: User ID ${u.id} (type: ${typeof u.id}) matches Mentor ID ${mentorIdToFind} (type: ${typeof mentorIdToFind})`, 'color: green; font-weight: bold;');
      }
      return isMatch;
    });

    if (foundMentor) {
      console.log("%cFinal Result: Mentor was successfully FOUND.", 'color: green; font-weight: bold;', foundMentor);
    } else {
      console.log("%cFinal Result: Mentor was NOT FOUND in the users array.", 'color: red; font-weight: bold;');
      // If not found, let's log the IDs to see the mismatch
      console.log("IDs in users array:", users.map(u => ({ id: u.id, type: typeof u.id }) ));
    }
    
    console.groupEnd();
    // --- End of Debugging Block ---
    
    return foundMentor || null;
  }, [internProfile, users, isLoading]);
  
  const closeConfirmation = () => setConfirmationState({ ...confirmationState, isOpen: false });

  const getInternDetails = useCallback((internId: string) => {
    const intern = interns.find(i => i.id === internId);
    if (!intern) return { user: null, department: null, mentor: null };
    const internUser = users.find(u => u.id === intern.user);
    const department = internUser ? departments.find(d => d.id === internUser.department) : null;
    const mentorUser = users.find(u => u.id === intern.mentor);
    return { user: internUser, department, mentor: mentorUser };
  }, [interns, users, departments]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => {
      const newState = { ...prev, [name]: value };
      if (name === 'leaveType' && value === LeaveType.HALF_DAY) {
        newState.endDate = newState.startDate;
      }
      if (name === 'startDate' && newState.leaveType === LeaveType.HALF_DAY) {
        newState.endDate = value;
      }
      return newState;
    });
  };

  const executeLeaveSubmit = async () => {
    if (!user || user.role !== Role.INTERN || !internProfile) {
        addToast("Intern profile not found.", "error");
        return;
    }
    
    setIsSubmitting(true);
    try {
        const newLeaveData = {
            intern: internProfile.id,
            start_date: formState.startDate,
            end_date: formState.leaveType === LeaveType.HALF_DAY ? formState.startDate : formState.endDate,
            leave_type: formState.leaveType,
            leave_half: formState.leaveType === LeaveType.HALF_DAY ? formState.leaveHalf : undefined,
            reason: formState.reason,
        };

        // Just create the leave request. The backend now handles the email automatically.
        const newLeave = await apiService.createLeaveRequest(newLeaveData);

        // --- THE NOTIFICATION LOGIC IS REMOVED FROM HERE ---

        setLeaves([newLeave, ...leaves]);
        addToast("Leave request submitted successfully.", "success");
        setFormState({
            startDate: '',
            endDate: '',
            leaveType: LeaveType.FULL_DAY,
            leaveHalf: LeaveHalf.FIRST_HALF,
            reason: '',
        });
        closeConfirmation();
    } catch (error) {
        addToast("Failed to submit leave request.", "error");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
     setConfirmationState({
        isOpen: true,
        title: 'Confirm Leave Request',
        message: `Are you sure you want to request leave from ${formState.startDate} to ${formState.endDate}?`,
        onConfirm: executeLeaveSubmit,
        confirmText: 'Submit Request',
        confirmVariant: 'primary'
    });
  };

  const executeApproval = async (leaveId: string, status: ApprovalStatus) => {
    setIsSubmitting(true);
    try {
        const updatedLeave = await apiService.updateLeaveRequest(leaveId, { status });
        
        const internProfile = interns.find(i => i.id === updatedLeave.intern);
        const internUser = users.find(u => u.id === internProfile?.user);
        if (internUser) {
            await notificationService.notifyInternOfLeaveStatus(
                internUser.email,
                internUser.name,
                `${updatedLeave.start_date} to ${updatedLeave.end_date}`,
                status.toLowerCase()
            );
        }

        setLeaves(leaves.map(l => l.id === leaveId ? updatedLeave : l));
        addToast(`Leave request ${status.toLowerCase()}.`, 'success');
        closeConfirmation();
    } catch (error) {
        addToast('Failed to update leave status.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleApproval = (leave: LeaveRequest, approved: boolean) => {
    const internUser = getInternDetails(leave.intern)?.user;
    const action = approved ? 'approve' : 'reject';
    const status = approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;

    setConfirmationState({
        isOpen: true,
        title: `Confirm Leave ${approved ? 'Approval' : 'Rejection'}`,
        message: `Are you sure you want to ${action} the leave request from ${internUser?.name || 'the intern'} for ${leave.start_date} to ${leave.end_date}?`,
        onConfirm: () => executeApproval(leave.id, status),
        confirmText: approved ? 'Approve' : 'Reject',
        confirmVariant: approved ? 'primary' : 'danger'
    });
  };

  const renderLeaveForm = () => {
    if (user?.role !== Role.INTERN) return null;
    return (
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">Request Leave</h2>
        <form onSubmit={handleLeaveSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Candidate Name" value={user.name} readOnly />
                <Input label="Email ID" value={user.email} readOnly />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Leave Type" name="leaveType" value={formState.leaveType} onChange={handleFormChange}>
                    {Object.values(LeaveType).map(type => <option key={type} value={type}>{type}</option>)}
                </Select>
                 {formState.leaveType === LeaveType.HALF_DAY && (
                    <Select label="Leave Half" name="leaveHalf" value={formState.leaveHalf} onChange={handleFormChange}>
                        {Object.values(LeaveHalf).map(half => <option key={half} value={half}>{half}</option>)}
                    </Select>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Start Date" type="date" name="startDate" value={formState.startDate} onChange={handleFormChange} required />
                {formState.leaveType !== LeaveType.HALF_DAY && (
                    <Input label="End Date" type="date" name="endDate" value={formState.endDate} onChange={handleFormChange} required />
                )}
            </div>
            <Input label="Email of Mentor" value={mentor?.email || 'N/A'} readOnly />
            <Textarea label="Remark" name="reason" value={formState.reason} onChange={handleFormChange} required />
            <div className="text-right">
                <Button type="submit" disabled={isSubmitting}><FilePlusIcon /> Submit Request</Button>
            </div>
        </form>
      </Card>
    );
  };
  
  const filteredLeaves = useMemo(() => {
    if (!user) return [];
    let baseLeaves: LeaveRequest[] = [];
    switch (user.role) {
        case Role.INTERN: {
            const internProfile = interns.find(i => i.user === user.id);
            baseLeaves = internProfile ? leaves.filter(l => l.intern === internProfile.id) : [];
            break;
        }
        case Role.MENTOR: {
            const myMenteeIds = interns.filter(i => i.mentor === user.id).map(i => i.id);
            baseLeaves = leaves.filter(l => myMenteeIds.includes(l.intern));
            break;
        }
        case Role.HR:
        case Role.HOD:
        case Role.MHR:
            baseLeaves = leaves;
            break;
        default:
            baseLeaves = [];
    }
    
    if (searchTerm && user.role !== Role.INTERN) {
        const lowerSearch = searchTerm.toLowerCase();
        return baseLeaves.filter(l => {
            const { user: internUser } = getInternDetails(l.intern);
            return internUser?.name.toLowerCase().includes(lowerSearch);
        });
    }

    return baseLeaves;
  }, [user, leaves, interns, searchTerm, getInternDetails]);

  const renderActions = (leave: LeaveRequest) => {
    if (user?.role === Role.MENTOR && leave.status === ApprovalStatus.PENDING) {
        const internProfile = interns.find(i => i.id === leave.intern);
        if(internProfile?.mentor === user.id) {
            return (
                <div className="flex space-x-2">
                    <Button size="sm" variant="danger" onClick={() => handleApproval(leave, false)}>Reject</Button>
                    <Button size="sm" onClick={() => handleApproval(leave, true)}>Approve</Button>
                </div>
            );
        }
    }
    return <span className="text-sm text-slate-500">-</span>;
  };

  return (
    <>
    <div>
      {renderLeaveForm()}
      <Card>
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <h2 className="text-xl font-bold">Leave History</h2>
            {user && user.role !== Role.INTERN && (
                <div className="w-full sm:w-72">
                    <Input 
                        icon={<SearchIcon />}
                        placeholder="Search by intern name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            )}
        </div>
        {isLoading ? <Spinner /> : (
          <Table headers={['Intern Name', 'Department', 'Dates', 'Leave Type', 'Reason', 'Status', 'Actions']}>
            {filteredLeaves.map(leave => {
              const { user: internUser, department } = getInternDetails(leave.intern);
              return (
                <tr key={leave.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{internUser?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{department?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{leave.start_date} to {leave.end_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {leave.leave_type} {leave.leave_half ? `(${leave.leave_half})` : ''}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><Badge status={leave.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{renderActions(leave)}</td>
                </tr>
              );
            })}
            {filteredLeaves.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-slate-500">No leave requests found matching your criteria.</td></tr>
            )}
          </Table>
        )}
      </Card>
    </div>
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

export default LeaveRequests;
