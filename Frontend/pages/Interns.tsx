import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService.ts';
import { Intern, User, Department, InternStatus, Role, Candidate } from '../types';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import { SearchIcon, MoreVerticalIcon, EyeIcon } from '../components/icons';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Modal from '../components/ui/Modal';
import CandidateApplicationView from '../components/candidates/CandidateApplicationView';

const Interns: React.FC = () => {
  const { user: authUser } = useAuth();
  const { addToast } = useToast();
  const [interns, setInterns] = useState<Intern[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InternStatus | 'all'>('all');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationState, setConfirmationState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm', confirmVariant: 'primary' as 'primary' | 'danger' });

  // State for details modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedInternDetails, setSelectedInternDetails] = useState<{ intern: Intern, user: User, candidate: Candidate } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [allInterns, allUsers, allDepartments] = await Promise.all([
          apiService.getInterns(),
          apiService.getUsers(),
          apiService.getDepartments(),
        ]);
        setInterns(allInterns);
        setUsers(allUsers);
        setDepartments(allDepartments);
      } catch (error) {
        console.error("Failed to fetch intern data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (actionMenuId && !target.closest('.action-menu-container')) {
        setActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionMenuId]);

  const getUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    console.log(`[Interns] getUser(${userId}) ->`, user);
    return user;
  };
  const getDepartment = (deptId?: string) => {
    const dept = departments.find(d => d.id === deptId);
    console.log(`[Interns] getDepartment(${deptId}) ->`, dept);
    return dept;
  };
  const getMentor = (mentorId?: string) => {
    const mentor = users.find(u => u.id === mentorId);
    console.log(`[Interns] getMentor(${mentorId}) ->`, mentor);
    return mentor;
  };
  
  const closeConfirmation = () => setConfirmationState({ ...confirmationState, isOpen: false });

  const handleStatusChange = (intern: Intern, newStatus: InternStatus) => {
    setActionMenuId(null);
    const actionText = newStatus === InternStatus.COMPLETED ? 'mark as completed' : 'mark as left';
    const internUser = getUser(intern.user);
    setConfirmationState({
      isOpen: true,
      title: `Confirm Status Change`,
      message: `Are you sure you want to ${actionText} the internship for ${internUser?.name}? This action cannot be undone.`,
      onConfirm: () => executeUpdateStatus(intern.id, newStatus),
      confirmText: `Yes, ${actionText}`,
      confirmVariant: newStatus === InternStatus.LEFT ? 'danger' : 'primary',
    });
  };

  const executeUpdateStatus = async (internId: string, status: InternStatus) => {
    setIsSubmitting(true);
    try {
      const updatedIntern = await apiService.updateIntern(internId, { status });
      setInterns(prev => prev.map(i => i.id === internId ? updatedIntern : i));
      addToast('Intern status updated successfully.', 'success');
    } catch (error) {
      addToast('Failed to update intern status.', 'error');
    } finally {
      setIsSubmitting(false);
      closeConfirmation();
    }
  };

  const openDetailsModal = async (intern: Intern) => {
    const user = getUser(intern.user);
    if (!user) {
        addToast('Could not find user details for this intern.', 'error');
        return;
    }
    try {
        setIsLoading(true);
        const candidate = await apiService.getCandidateById(intern.candidate);
        if (!candidate) {
            addToast('Could not find application details for this intern.', 'error');
            return;
        }
        setSelectedInternDetails({ intern, user, candidate });
        setIsDetailsModalOpen(true);
    } catch (e) {
        addToast('Error fetching intern details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedInternDetails(null);
  };


  const filteredInterns = interns
    .map(intern => ({
      ...intern,
      userDetails: getUser(intern.user),
      mentorDetails: getMentor(intern.mentor)
    }))
    .filter(internWithUser => {
      if (!internWithUser.userDetails) return false;
      const department = getDepartment(internWithUser.userDetails.department);
      
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = 
        internWithUser.userDetails.name.toLowerCase().includes(lowerSearch) ||
        internWithUser.userDetails.email.toLowerCase().includes(lowerSearch) ||
        (department && department.name.toLowerCase().includes(lowerSearch)) ||
        (internWithUser.mentorDetails && internWithUser.mentorDetails.name.toLowerCase().includes(lowerSearch)) ||
        (internWithUser.userName && internWithUser.userName.toLowerCase().includes(lowerSearch)) ||
        (internWithUser.departmentName && internWithUser.departmentName.toLowerCase().includes(lowerSearch)) ||
        (internWithUser.mentorName && internWithUser.mentorName.toLowerCase().includes(lowerSearch));

      const matchesStatus = statusFilter === 'all' || internWithUser.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

  const headers = ['Name', 'Department', 'Mentor', 'Joining Date', 'Status', 'Actions'];

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">All Interns</h1>
        </div>
        <div className="flex space-x-4 mb-4">
          <div className="flex-grow">
            <Input 
              icon={<SearchIcon />}
              placeholder="Search by name, email, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="block w-48 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-red focus:border-primary-red sm:text-sm rounded-md"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as InternStatus | 'all')}
          >
            <option value="all">All Statuses</option>
            <option value={InternStatus.ACTIVE}>Active</option>
            <option value={InternStatus.COMPLETED}>Completed</option>
            <option value={InternStatus.LEFT}>Left</option>
          </select>
        </div>

        {isLoading ? <Spinner /> : (
          <Table headers={headers}>
              {filteredInterns.map(intern => {
                const user = intern.userDetails || { name: intern.userName || 'N/A', email: intern.userEmail || 'N/A', id: intern.user };
                const departmentName = intern.departmentName || getDepartment(user.department)?.name || 'N/A';
                const mentorName = intern.mentorName || intern.mentorDetails?.name || 'N/A';
                return (
                <tr key={intern.id} className="hover:bg-light-blue/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img className="h-10 w-10 rounded-full" src={`https://i.pravatar.cc/150?u=${user.id}`} alt="" />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-primary-navy">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{departmentName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{mentorName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{intern.joiningDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><Badge status={intern.status} /></td>
                  {authUser?.role !== Role.INTERN && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-1">
                              <Button variant="ghost" size="sm" onClick={() => openDetailsModal(intern)} title="View Details">
                                  <EyeIcon />
                              </Button>
                              {authUser?.role === Role.HR && intern.status === InternStatus.ACTIVE && (
                                  <div className="relative inline-block text-left action-menu-container">
                                      <Button variant="ghost" size="sm" onClick={() => setActionMenuId(actionMenuId === intern.id ? null : intern.id)}>
                                          <MoreVerticalIcon />
                                      </Button>
                                      {actionMenuId === intern.id && (
                                          <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                              <div className="py-1" role="menu" aria-orientation="vertical">
                                                  <button onClick={() => handleStatusChange(intern, InternStatus.COMPLETED)} className="w-full text-left block px-4 py-2 text-sm text-secondary-blue hover:bg-light-gray" role="menuitem">
                                                      Mark as Completed
                                                  </button>
                                                  <button onClick={() => handleStatusChange(intern, InternStatus.LEFT)} className="w-full text-left block px-4 py-2 text-sm text-primary-red hover:bg-dark-red/10" role="menuitem">
                                                      Mark as Left
                                                  </button>
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>
                      </td>
                  )}
                </tr>
              );
            })}
            {filteredInterns.length === 0 && (
              <tr><td colSpan={headers.length} className="text-center py-10 text-slate-500">No interns found matching your criteria.</td></tr>
            )}
          </Table>
        )}
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
      <Modal isOpen={isDetailsModalOpen} onClose={closeDetailsModal} title={`Intern Details: ${selectedInternDetails?.user.name}`} size="4xl">
        {selectedInternDetails ? (
            <div className="max-h-[80vh] overflow-y-auto p-1">
                <h2 className="text-xl font-bold mb-4 text-primary-navy">Application Details</h2>
                <CandidateApplicationView questData={selectedInternDetails.candidate.questData} />
            </div>
        ) : <Spinner />}
      </Modal>
    </>
  );
};

export default Interns;