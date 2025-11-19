import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import db from '../services/db_new';
import apiService from '../services/apiService.ts';
import { Role, Intern, User, ExtensionPermission } from '../types_extended';

// Backend permission interface (different field names)
interface BackendExtensionPermission {
  id: string;
  intern: string; // Backend uses 'intern' field instead of 'internId'
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
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Textarea from '../components/ui/Textarea';
import Input from '../components/ui/Input';
import { SearchIcon, CheckIcon, XIcon, UserIcon } from '../components/icons';

interface ExtensionPermissionWithDetails extends ExtensionPermission {
  internName?: string;
  internEmail?: string;
  internDepartment?: string;
  hrApprovedByName?: string;
  hodApprovedByName?: string;
}

const ExtensionPermissions: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [permissions, setPermissions] = useState<ExtensionPermissionWithDetails[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<ExtensionPermissionWithDetails | null>(null);
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [approvalType, setApprovalType] = useState<'hr' | 'hod'>('hr');
  const [approvalDecision, setApprovalDecision] = useState<boolean>(true);
  const [approvalComments, setApprovalComments] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [permsData, internsData, usersData] = await Promise.all([
        apiService.getExtensionPermissions(),
        db.interns.getAll(),
        db.users.find({})
      ]);

      // Convert backend format to frontend format
      const convertedPermissions: ExtensionPermissionWithDetails[] = permsData.map((perm: BackendExtensionPermission) => ({
        id: perm.id,
        internId: perm.intern, // Convert 'intern' to 'internId'
        internName: perm.intern_name,
        internEmail: perm.intern_email,
        internDepartment: perm.intern_department,
        hrApproved: perm.hr_approved,
        hrApprovedBy: perm.hr_approved_by,
        hrApprovedByName: perm.hr_approved_by_name,
        hrApprovedAt: perm.hr_approved_at,
        hrComments: perm.hr_comments,
        hodApproved: perm.hod_approved,
        hodApprovedBy: perm.hod_approved_by,
        hodApprovedByName: perm.hod_approved_by_name,
        hodApprovedAt: perm.hod_approved_at,
        hodComments: perm.hod_comments,
        isApproved: perm.is_approved,
        createdAt: perm.created_at,
        updatedAt: perm.updated_at,
      }));

      setPermissions(convertedPermissions);
      setInterns(internsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Extension permissions fetch error:', error);
      addToast('Failed to fetch extension permissions data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePermission = async () => {
    if (!selectedIntern) return;
    
    setIsSubmitting(true);
    try {
      await apiService.createExtensionPermission({ intern_id: selectedIntern.id });
      const internUser = users.find(u => u.id === selectedIntern.userId);
      addToast(`Extension permission created for ${internUser?.name || 'intern'}`, 'success');
      setIsCreateModalOpen(false);
      setSelectedIntern(null);
      await fetchData();
    } catch (error) {
      console.error('Create permission error:', error);
      addToast('Failed to create extension permission', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproval = async () => {
    if (!selectedPermission) return;
    
    setIsSubmitting(true);
    try {
      if (approvalType === 'hr') {
        await apiService.hrApproveExtensionPermission(
          selectedPermission.id,
          approvalDecision,
          approvalComments
        );
      } else {
        await apiService.hodApproveExtensionPermission(
          selectedPermission.id,
          approvalDecision,
          approvalComments
        );
      }

      addToast(
        `Extension permission ${approvalDecision ? 'approved' : 'rejected'} successfully`,
        'success'
      );
      
      setIsApprovalModalOpen(false);
      setSelectedPermission(null);
      setApprovalComments('');
      await fetchData();
    } catch (error) {
      console.error('Approval error:', error);
      addToast('Failed to process approval', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openApprovalModal = (permission: ExtensionPermissionWithDetails, type: 'hr' | 'hod') => {
    setSelectedPermission(permission);
    setApprovalType(type);
    setApprovalDecision(true);
    setApprovalComments('');
    setIsApprovalModalOpen(true);
  };

  const openCreateModal = (intern: Intern) => {
    setSelectedIntern(intern);
    setIsCreateModalOpen(true);
  };

  const canUserApprove = (permission: ExtensionPermissionWithDetails, type: 'hr' | 'hod'): boolean => {
    if (!user) return false;
    
    if (type === 'hr') {
      return user.role === Role.HR && !permission.hrApproved;
    } else {
      return user.role === Role.HOD && !permission.hodApproved;
    }
  };

  const getEligibleInterns = () => {
    return interns.filter(intern => {
      // Only show interns who don't have extension permission yet
      return !permissions.some(p => p.internId === intern.id);
    });
  };

  const getPermissionStatus = (permission: ExtensionPermissionWithDetails) => {
    if (permission.hrApproved && permission.hodApproved) {
      return { status: 'Approved', color: 'success' as const };
    } else if (!permission.hrApproved && !permission.hodApproved) {
      return { status: 'Pending', color: 'warning' as const };
    } else {
      return { status: 'Partial', color: 'info' as const };
    }
  };

  const filteredPermissions = permissions.filter(permission =>
    !searchTerm || 
    permission.internName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.internEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || (user.role !== Role.HR && user.role !== Role.HOD)) {
    return (
      <Card>
        <p className="text-center text-slate-600">
          You do not have permission to access this page. Only HR and HOD users can manage extension permissions.
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Extension Permissions Management</h2>
              <p className="text-sm text-slate-600">
                Manage intern eligibility for requesting internship extensions. Both HR and HOD approval is required.
              </p>
            </div>
            
            {user.role === Role.HR && (
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                disabled={getEligibleInterns().length === 0}
              >
                Create Permission
              </Button>
            )}
          </div>

          <div className="mb-4">
            <Input
              icon={<SearchIcon />}
              placeholder="Search by intern name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoading ? (
            <Spinner />
          ) : (
            <Table headers={['Intern', 'Department', 'HR Approval', 'HOD Approval', 'Overall Status', 'Actions']}>
              {filteredPermissions.map(permission => {
                const permissionStatus = getPermissionStatus(permission);
                return (
                  <tr key={permission.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{permission.internName || 'Unknown'}</p>
                        <p className="text-sm text-slate-500">{permission.internEmail || 'No email'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {permission.internDepartment || 'No department'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <Badge status={permission.hrApproved ? 'Approved' : 'Pending'} />
                        {permission.hrApprovedByName && (
                          <p className="text-xs text-slate-500">by {permission.hrApprovedByName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <Badge status={permission.hodApproved ? 'Approved' : 'Pending'} />
                        {permission.hodApprovedByName && (
                          <p className="text-xs text-slate-500">by {permission.hodApprovedByName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={permissionStatus.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {canUserApprove(permission, 'hr') && (
                          <Button 
                            size="sm" 
                            onClick={() => openApprovalModal(permission, 'hr')}
                          >
                            HR Review
                          </Button>
                        )}
                        {canUserApprove(permission, 'hod') && (
                          <Button 
                            size="sm" 
                            onClick={() => openApprovalModal(permission, 'hod')}
                          >
                            HOD Review
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPermissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No extension permissions found.
                  </td>
                </tr>
              )}
            </Table>
          )}
        </Card>

        {/* Statistics Card */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Extension Permission Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{permissions.length}</div>
              <div className="text-sm text-blue-800">Total Permissions</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {permissions.filter(p => p.hrApproved && p.hodApproved).length}
              </div>
              <div className="text-sm text-green-800">Fully Approved</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {permissions.filter(p => p.hrApproved !== p.hodApproved).length}
              </div>
              <div className="text-sm text-yellow-800">Partially Approved</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {permissions.filter(p => !p.hrApproved && !p.hodApproved).length}
              </div>
              <div className="text-sm text-red-800">Pending</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Create Permission Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Extension Permission"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Select an intern to create an extension permission record. This will allow HR and HOD to approve the intern for extension eligibility.
          </p>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Select Intern</label>
            <div className="max-h-60 overflow-y-auto border rounded-md">
              {getEligibleInterns().map(intern => {
                const internUser = users.find(u => u.id === intern.userId);
                return (
                  <div
                    key={intern.id}
                    className={`p-3 cursor-pointer hover:bg-slate-50 border-b border-slate-200 ${
                      selectedIntern?.id === intern.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => setSelectedIntern(intern)}
                  >
                    <div className="flex items-center space-x-3">
                      <UserIcon />
                      <div>
                        <p className="font-medium text-slate-900">{internUser?.name || 'Unknown'}</p>
                        <p className="text-sm text-slate-500">{internUser?.email || 'No email'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {getEligibleInterns().length === 0 && (
                <p className="text-center py-6 text-slate-500">
                  No eligible interns found. All interns already have extension permission records.
                </p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePermission}
              disabled={!selectedIntern || isSubmitting}
            >
              Create Permission
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approval Modal */}
      <Modal 
        isOpen={isApprovalModalOpen} 
        onClose={() => setIsApprovalModalOpen(false)}
        title={`${approvalType.toUpperCase()} Approval - ${selectedPermission?.internName || 'Intern'}`}
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-md">
            <h4 className="font-medium text-slate-800 mb-2">Intern Information</h4>
            <p><strong>Name:</strong> {selectedPermission?.internName}</p>
            <p><strong>Email:</strong> {selectedPermission?.internEmail}</p>
            <p><strong>Department:</strong> {selectedPermission?.internDepartment}</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Decision</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={approvalDecision}
                  onChange={() => setApprovalDecision(true)}
                  className="mr-2"
                />
                <CheckIcon className="w-4 h-4 text-green-600 mr-1" />
                Approve
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!approvalDecision}
                  onChange={() => setApprovalDecision(false)}
                  className="mr-2"
                />
                <XIcon className="w-4 h-4 text-red-600 mr-1" />
                Reject
              </label>
            </div>
          </div>

          <Textarea
            label="Comments (Optional)"
            value={approvalComments}
            onChange={(e) => setApprovalComments(e.target.value)}
            placeholder="Provide additional comments for your decision..."
            rows={3}
          />

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApproval}
              disabled={isSubmitting}
              variant={approvalDecision ? 'success' : 'danger'}
            >
              {approvalDecision ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ExtensionPermissions;