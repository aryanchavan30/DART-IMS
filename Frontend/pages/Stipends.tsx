import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import apiService from '../services/apiService.ts';
import notificationService from '../services/notificationService';
import { Stipend, Intern, User, Role, ApprovalStatus, InternStatus, Department } from '../types';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import { FilePlusIcon, SearchIcon, EditIcon, DownloadIcon, EyeIcon } from '../components/icons';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import SignatureModal from '../components/ui/SignatureModal';
import { invoiceService } from '../services/invoiceService';
import InvoicePreview from '../components/stipends/InvoicePreview';
import InvoicePreviewModal from '../components/stipends/InvoicePreviewModal';
import SignaturePad, { SignaturePadRef } from '../components/ui/SignaturePad';
import * as XLSX from 'xlsx';

const Stipends: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [stipends, setStipends] = useState<Stipend[]>([]);
    const [interns, setInterns] = useState<Intern[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedStipends, setSelectedStipends] = useState<Set<string>>(new Set());
    const [viewFilter, setViewFilter] = useState<'pending' | 'all'>('pending');
    const [confirmationState, setConfirmationState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm', confirmVariant: 'primary' as 'primary' | 'danger' });
    const [searchTerm, setSearchTerm] = useState('');
    const [monthFilter, setMonthFilter] = useState('all');
    const [downloadMonth, setDownloadMonth] = useState('');
    const [invoiceLoadingState, setInvoiceLoadingState] = useState<Record<string, boolean>>({});

    const [isAddFormVisible, setIsAddFormVisible] = useState(false);
    const hrSignaturePadRef = useRef<SignaturePadRef>(null);
    
    const [monthlyConfig, setMonthlyConfig] = useState({
        baseAmount: '10000',
        totalWorkingDays: '',
        holidays: ''
    });

    const [newStipendData, setNewStipendData] = useState({
        internId: '',
        month: '',
        daysPresent: '',
        comments: ''
    });

    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [stipendToSign, setStipendToSign] = useState<Stipend | null>(null);
    const [invoicePreviewData, setInvoicePreviewData] = useState<{ stipend: Stipend; internUser: User; department: Department; hodUser: User; internProfile: Intern; hrSignatureUrl?: string; internSignatureUrl?: string; } | null>(null);
    
    // Preview Modal State
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewInvoiceData, setPreviewInvoiceData] = useState<{ stipend: Stipend; internUser: User; department: Department; hodUser: User; internProfile: Intern; hrSignatureUrl?: string; internSignatureUrl?: string; } | null>(null);


    const handleDownloadExcel = async () => {
        console.log('EXCEL DOWNLOAD STARTED!');
        console.log('Selected month:', downloadMonth);

        if (!downloadMonth) {
            addToast('Please select a month to download.', 'error');
            return;
        }

        try {
            // Filter stipends for the selected month
            const monthStipends = stipends.filter(s => s.month === downloadMonth);
            console.log('Stipends found for month:', monthStipends.length);

            if (monthStipends.length === 0) {
                addToast('No stipends found for the selected month.', 'info');
                return;
            }

            // Prepare data for Excel
            const dataForExcel = monthStipends.map(stipend => {
                const internProfile = interns.find(i => i.id === stipend.intern);
                const internUser = internProfile ? users.find(u => u.id === internProfile.user) : undefined;
                const department = internUser ? departments.find(d => d.id === internUser.department) : undefined;

                // Calculate present days = Total working days - Absent days
                const totalWorkingDays = stipend.working_days || 0;
                const absentDays = stipend.leaves_taken || 0;
                const presentDays = totalWorkingDays - absentDays;

                return {
                    'Intern Name': internUser?.name || 'N/A',
                    'Department': department?.name || 'N/A',
                    'Month': downloadMonth,
                    'Amount (₹)': stipend.amount,
                    'Total Working Days': totalWorkingDays,
                    'Present Days': presentDays,
                    'Absent Days': absentDays,
                    'Leaves Taken': absentDays,
                    'Intern Approval': stipend.intern_approval,
                    'HR Approval': stipend.hr_approval,
                    'HOD Approval': stipend.hod_approval,
                    'Bank Name': internProfile?.bankName || 'N/A',
                    'Account Number': internProfile?.accountNumber || 'N/A',
                    'IFSC Code': internProfile?.ifscCode || 'N/A',
                    'Invoice Link': stipend.invoice_url || 'N/A',
                };
            });

            console.log('Excel data prepared:', dataForExcel.length, 'rows');

            // Create workbook and worksheet
            const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Stipend Report');

            // Generate filename with current date
            const fileName = `Stipend_Report_${downloadMonth}_${new Date().toISOString().split('T')[0]}.xlsx`;
            console.log('Generating file:', fileName);

            // Download the file
            XLSX.writeFile(workbook, fileName);

            console.log('✅ EXCEL DOWNLOAD SUCCESSFUL!');
            addToast(`✅ Excel downloaded successfully! (${dataForExcel.length} records)`, 'success');

        } catch (error) {
            console.error('❌ Excel generation failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            addToast(`❌ Failed to generate Excel: ${errorMessage}`, 'error');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [allStipends, allInterns, allUsers, allDepts] = await Promise.all([
                    apiService.getStipends(),
                    apiService.getInterns(),
                    apiService.getUsers(),
                    apiService.getDepartments(),
                ]);
                setStipends(allStipends);
                setInterns(allInterns);
                setUsers(allUsers);
                setDepartments(allDepts);
            } catch (error) {
                addToast("Failed to fetch stipend data.", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [addToast]);

    useEffect(() => {
        // Clear selection when view changes
        setSelectedStipends(new Set());
    }, [viewFilter]);
    
    const getInternUser = useCallback((internId: string) => {
        const intern = interns.find(i => i.id === internId);
        return intern ? users.find(u => u.id === intern.user) : undefined;
    }, [interns, users]);

    const getDepartment = useCallback((deptId?: string) => {
        if (!deptId) return undefined;
        return departments.find(d => d.id === deptId);
    }, [departments]);

    const closeConfirmation = () => setConfirmationState({ ...confirmationState, isOpen: false });

    const formatStipendMonth = (monthStr: string) => {
        if (!monthStr || !monthStr.includes('-')) return monthStr;
        const [year, month] = monthStr.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        const monthName = date.toLocaleString('default', { month: 'long' });
        return `${monthName} ${year}`;
    };
    
    const approveInternStipend = async (stipendToApprove: Stipend, signatureDataUrl: string) => {
        setIsSubmitting(true);
        try {
            // --- MODIFIED: Generate the PDF before sending the approval ---
            const internUser = getInternUser(stipendToApprove.intern);
            const department = getDepartment(internUser?.department);
            const hodUser = users.find(u => u.id === department?.hod);
            const internProfile = interns.find(i => i.id === stipendToApprove.intern);
            
            if (!internUser || !department || !hodUser || !internProfile) {
                addToast("Could not find all necessary data to generate the invoice.", "error");
                setIsSubmitting(false);
                return;
            }

            const pdfDataUri = await invoiceService.generateInvoicePdf(
                stipendToApprove,
                internUser,
                department,
                hodUser,
                internProfile,
                signatureDataUrl, // Use the new signature from the intern
                stipendToApprove.hr_signature_url // Use the existing HR signature
            );
            // --- END OF MODIFICATION ---

            // Pass the signature AND the generated PDF to the API service
            const updatedStipend = await apiService.approveStipend(stipendToApprove.id, signatureDataUrl, pdfDataUri);
            
            // The frontend notification call is now redundant because the backend handles it.
            // We can safely remove this block.
            // const hrUser = users.find(u => u.role === Role.HR);
            // if (hrUser) {
            //     const internName = getInternUser(updatedStipend.intern)?.name || 'Intern';
            //     await notificationService.notifyForStipendApproval(hrUser, internName, String(updatedStipend.month));
            // }

            setStipends(prevStipends =>
                prevStipends.map(s => (s.id === updatedStipend.id ? updatedStipend : s))
            );
            addToast("Stipend approved successfully! It has been sent to HR for final approval.", "success");

            setIsSignatureModalOpen(false);
            setStipendToSign(null);

        } catch (error) {
            console.error("Failed to approve stipend:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to approve stipend.";
            addToast(errorMessage, "error");
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleInternApprovalClick = (stipend: Stipend) => {
        const internUser = getInternUser(stipend.intern);
        if (!internUser) return addToast("Intern details not found.", "error");

        const internProfile = interns.find(i => i.id === stipend.intern);
        if (!internProfile) return addToast("Intern profile not found.", "error");

        const department = getDepartment(internUser.department);
        if (!department) return addToast("Department details not found.", "error");
        
        // Check if department has a HOD assigned
        if (!department.hod) {
            return addToast(`The ${department.name} department does not have a HOD assigned. Please contact HR to assign a HOD to this department.`, "error");
        }
        
        const hodUser = users.find(u => u.id === department.hod);
        if (!hodUser) {
            return addToast(`HOD user not found (ID: ${department.hod}) for department ${department.name}. Please contact HR to resolve this issue.`, "error");
        }

        setInvoicePreviewData({ stipend, internUser, department, hodUser, internProfile, hrSignatureUrl: stipend.hr_signature_url, internSignatureUrl: stipend.intern_signature_url });
        setStipendToSign(stipend);
        setIsSignatureModalOpen(true);
    };

    const handleSignAndApprove = (signatureUrl: string) => {
        if (!stipendToSign) return addToast("No stipend selected for signing.", "error");
        approveInternStipend(stipendToSign, signatureUrl);
    };
    
    const executeBulkApprove = async () => {
        if (!user || selectedStipends.size === 0) return;
        
        setIsSubmitting(true);
        let updateData: Partial<Stipend> = {};
        let roleForUpdate: Role | null = null;
        let nextApproverRole: Role | null = null;
        
        if (user.role === Role.HR) {
            updateData = { hr_approval: ApprovalStatus.APPROVED };
            roleForUpdate = Role.HR;
            nextApproverRole = Role.HOD;
        } else if (user.role === Role.HOD) {
            updateData = { hod_approval: ApprovalStatus.APPROVED };
            roleForUpdate = Role.HOD;
            nextApproverRole = Role.MHR; // MHR gets notification, not approval
        }

        if (!roleForUpdate) {
            setIsSubmitting(false);
            return;
        }
        
        try {
            const result = await apiService.bulkApproveStipends(Array.from(selectedStipends));
            const updated = await apiService.getStipends(); // Refresh stipends after bulk approval
            
            if (nextApproverRole === Role.HOD) {
                const notifyPromises = updated.filter(s => selectedStipends.has(s.id)).map(stipend => {
                    const internUser = getInternUser(stipend.intern);
                    const department = internUser ? getDepartment(internUser.department) : undefined;
                    const hodUser = department ? users.find(u => u.id === department.hod) : undefined;
                    if (hodUser && internUser) {
                        return notificationService.notifyForStipendApproval(hodUser, internUser.name, String(stipend.month));
                    }
                    return Promise.resolve();
                });
                await Promise.all(notifyPromises);
            } else if (nextApproverRole === Role.MHR) {
                // When HOD approves, notify MHR that stipends are fully approved
                const mhrUser = users.find(u => u.role === Role.MHR);
                if (mhrUser) {
                    const notifyPromises = updated.filter(s => selectedStipends.has(s.id)).map(stipend => {
                        const internName = getInternUser(stipend.intern)?.name || 'Intern';
                        return notificationService.notifyForStipendApproval(mhrUser, internName, String(stipend.month));
                    });
                    await Promise.all(notifyPromises);
                }

                // Also notify finance team for payment processing
                const paidInterns = updated.filter(s => selectedStipends.has(s.id)).map(s => ({
                    name: getInternUser(s.intern)?.name || '',
                    email: getInternUser(s.intern)?.email || '',
                    amount: s.amount
                }));
                const month = updated[0]?.month;
                if (month) {
                    await notificationService.notifyConcurForPayment(paidInterns, String(month));
                }
            }
            
            setStipends(stipends.map(s => {
                const u = updated.find(upd => upd.id === s.id);
                return u || s;
            }));
            addToast(`${selectedStipends.size} stipends approved.`, "success");
            setSelectedStipends(new Set());
            closeConfirmation();
        } catch (error) {
            addToast("Bulk approval failed.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkApprove = () => {
        setConfirmationState({
            isOpen: true,
            title: 'Confirm Bulk Approval',
            message: `Are you sure you want to approve all ${selectedStipends.size} selected stipends? This action cannot be undone.`,
            onConfirm: executeBulkApprove,
            confirmText: `Approve ${selectedStipends.size} Stipends`,
            confirmVariant: 'primary'
        });
    }
    
    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedStipends);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedStipends(newSelection);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewStipendData(prev => ({ ...prev, [name]: value }));
    };

    const handleMonthlyConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMonthlyConfig(prev => ({ ...prev, [name]: value }));
    };

    const { stipendPerDay, calculatedLeaves, finalAmount } = useMemo(() => {
        const base = parseFloat(monthlyConfig.baseAmount) || 0;
        const working = parseInt(monthlyConfig.totalWorkingDays, 10) || 0;
        const hols = parseInt(monthlyConfig.holidays, 10) || 0;
        const daysPresentNum = parseInt(newStipendData.daysPresent, 10) || 0;

        const effectiveWorkingDays = working - hols;

        let spd = 0;
        if (base > 0 && effectiveWorkingDays > 0) {
            spd = base / effectiveWorkingDays;
        }
        
        const fAmount = spd > 0 && daysPresentNum > 0 ? (spd * daysPresentNum) : 0;
        
        const leaves = effectiveWorkingDays > 0 && daysPresentNum >= 0 
            ? Math.max(0, effectiveWorkingDays - daysPresentNum) 
            : 0;

        return {
            stipendPerDay: spd,
            calculatedLeaves: leaves,
            finalAmount: Number(fAmount.toFixed(2))
        };
    }, [monthlyConfig, newStipendData.daysPresent]);

    const executeStipendSubmit = async () => {
        const { internId, month, daysPresent, comments } = newStipendData;
        if (!internId || !month || !daysPresent || !monthlyConfig.baseAmount || !monthlyConfig.totalWorkingDays) {
            addToast('Please fill all required fields.', 'error');
            return;
        }

        const existingStipend = stipends.find(s => s.intern === internId && s.month === month);
        if (existingStipend) {
            const internName = activeInterns.find(i => i.id === internId)?.name || 'this intern';
            addToast(`A stipend for ${internName} already exists for ${formatStipendMonth(month)}. Please choose a different month.`, 'error');
            return;
        }

        const hrSignature = hrSignaturePadRef.current?.getSignature();
        if (!hrSignature) {
            addToast('HR signature is required to create a stipend.', 'error');
            return;
        }

        setIsSubmitting(true);
    
        const newStipendPayload = {
            intern: internId,
            month,
            amount: Number(finalAmount),
            working_days: Number(daysPresent),
            leaves_taken: calculatedLeaves,
            comments,
            intern_approval: ApprovalStatus.PENDING,
            hr_approval: ApprovalStatus.PENDING,
            hod_approval: ApprovalStatus.PENDING,
            hr_signature_url: hrSignature,
        };
    
        try {
            // --- STEP 1: Create the stipend record in the database. ---
            const createdStipend = await apiService.createStipend(newStipendPayload);
            addToast('Stipend created successfully!', 'success');
            
            // --- STEP 2: Generate the PDF on the frontend. ---
            // Fetch all the data required by your invoiceService.
            const internProfile = interns.find(i => i.id === createdStipend.intern);
            if (!internProfile) throw new Error("Could not find intern profile for PDF generation.");

            const internUser = users.find(u => u.id === internProfile.user);
            if (!internUser) throw new Error("Could not find intern user for PDF generation.");

            const department = departments.find(d => d.id === internUser.department);
            if (!department) throw new Error("Could not find department for PDF generation.");

            const hodUser = users.find(u => u.id === department.hod);
            if (!hodUser) throw new Error("Could not find HOD for PDF generation.");

            // Generate the PDF as a base64 string
            const pdfDataUri = await invoiceService.generateInvoicePdf(
                createdStipend,
                internUser,
                department,
                hodUser,
                internProfile,
                '', // Intern signature is blank at creation
                hrSignature // Use the HR signature from the signature pad
            );

            // --- STEP 3: Send the PDF to the backend to be emailed. ---
            await apiService.sendStipendCreationEmailWithPdf(createdStipend.id, pdfDataUri);
            addToast('Invoice email has been sent to the intern.', 'info');

            // Update UI and reset form
            setStipends([createdStipend, ...stipends]);
            setIsAddFormVisible(false);
            setNewStipendData({ internId: '', month: '', daysPresent: '', comments: '' });
            hrSignaturePadRef.current?.clear();
            closeConfirmation();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add stipend and send email.';
            addToast(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleStipendSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (hrSignaturePadRef.current?.isEmpty()) {
            addToast('Please provide your signature before submitting.', 'error');
            return;
        }

        const internName = (activeInterns.find(i => i.id === newStipendData.internId))?.name;
        setConfirmationState({
            isOpen: true,
            title: 'Confirm New Stipend',
            message: `Are you sure you want to add a stipend of ₹${finalAmount.toFixed(2)} for ${internName} for ${formatStipendMonth(newStipendData.month)}?`,
            onConfirm: executeStipendSubmit,
            confirmText: 'Add Stipend',
            confirmVariant: 'primary'
        });
    };

    const handleToggleAddForm = () => {
        if (!isAddFormVisible) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            setNewStipendData(prev => ({ ...prev, month: `${year}-${month}` }));
        }
        setIsAddFormVisible(!isAddFormVisible);
    };

    const isManagementRole = useMemo(() => user && [Role.HR, Role.HOD].includes(user.role), [user]);
    
    const uniqueMonths = useMemo(() => {
        const months = new Set(stipends.map(s => s.month));
        return Array.from(months).sort().reverse();
    }, [stipends]);

    const filteredStipends = useMemo(() => {
        if (!user) return [];
        
        let filtered = stipends;

        // First filter by role and view (pending vs all)
        if (user.role === Role.HR) {
            if (viewFilter === 'pending') {
                filtered = filtered.filter(stipend => 
                    stipend.intern_approval === ApprovalStatus.APPROVED && 
                    stipend.hr_approval === ApprovalStatus.PENDING
                );
            }
            // For 'all' view, HR sees all stipends (no additional filtering)
        } else if (user.role === Role.HOD) {
            // For now, HOD can see all stipends - we'll add department filtering after confirming basic functionality works
            if (viewFilter === 'pending') {
                filtered = filtered.filter(stipend => 
                    stipend.hr_approval === ApprovalStatus.APPROVED && 
                    stipend.hod_approval === ApprovalStatus.PENDING
                );
            }
        } else if (user.role === Role.MHR) {
            // MHR can view all stipends but doesn't have approval workflow
            // No pending items for MHR since they only receive notifications
            if (viewFilter === 'pending') {
                filtered = []; // MHR has no pending approvals
            }
        } else if (user.role === Role.INTERN) {
            const internProfile = interns.find(i => i.user === user.id);
            filtered = internProfile ? filtered.filter(stipend => stipend.intern === internProfile.id) : [];
             if (viewFilter === 'pending') {
                filtered = filtered.filter(s => s.intern_approval === ApprovalStatus.PENDING);
            }
        }
        
        if (monthFilter !== 'all') {
            filtered = filtered.filter(stipend => stipend.month === monthFilter);
        }
        
        if (searchTerm.trim() !== '' && user.role !== Role.INTERN) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(stipend => {
                const internName = stipend.intern_name || getInternUser(stipend.intern)?.name || '';
                return internName.toLowerCase().includes(lowerSearch);
            });
        }

        return filtered.sort((a,b) => b.month.localeCompare(a.month));

    }, [stipends, user, interns, getInternUser, viewFilter, isManagementRole, monthFilter, searchTerm]);

    const handleSelectAll = () => {
        if (selectedStipends.size === filteredStipends.length) {
            setSelectedStipends(new Set());
        } else {
            setSelectedStipends(new Set(filteredStipends.map(s => s.id)));
        }
    };
    
    const canBulkApprove = user && [Role.HR, Role.HOD].includes(user.role) && viewFilter === 'pending' && selectedStipends.size > 0;
    const numSelected = selectedStipends.size;
    const numRows = filteredStipends.length;
    const isAllSelected = numRows > 0 && numSelected === numRows;
    const isIndeterminate = numSelected > 0 && numSelected < numRows;
    
    let headers: React.ReactNode[] = ['Intern', 'Month', 'Amount', 'Approval Status', 'Actions'];

    if (user && [Role.HR, Role.HOD].includes(user.role) && viewFilter === 'pending') {
        const selectAllCheckbox = (
            <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary-red focus:ring-primary-red"
                ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                checked={isAllSelected}
                onChange={handleSelectAll}
                disabled={numRows === 0}
                aria-label="Select all stipends"
            />
        );
        headers.unshift(selectAllCheckbox);
    }

    const handleDownloadInvoice = async (stipend: Stipend) => {
        setInvoiceLoadingState(prev => ({ ...prev, [stipend.id]: true }));
        try {
            if (stipend.intern_approval !== ApprovalStatus.APPROVED) {
                throw new Error("An invoice cannot be generated until the intern approves the stipend.");
            }
            const internSignatureUrl = stipend.intern_signature_url;
            if (!internSignatureUrl) throw new Error("Invoice generation failed: Intern signature is missing.");
            
            // Try to get intern user from lookup, or create from API data
            let internUser = getInternUser(stipend.intern);
            let internProfile = interns.find(i => i.id === stipend.intern);
            
            // If we can't find intern details via lookup, use API-provided data
            if (!internUser && stipend.intern_name && stipend.intern_email) {
                // Try to find department from any available intern or use first available department
                const fallbackDept = departments.length > 0 ? departments[0].id : '';
                
                // Create a mock user object from API data
                internUser = {
                    id: 'mock-' + stipend.intern,
                    name: stipend.intern_name,
                    email: stipend.intern_email,
                    department: fallbackDept
                } as User;
            }
            
            if (!internUser) throw new Error("Could not find intern details.");
            
            // Try to find intern profile, or create minimal mock
            if (!internProfile && stipend.intern_name) {
                internProfile = {
                    id: stipend.intern,
                    user: internUser.id,
                    joining_date: new Date().toISOString().split('T')[0], // Fallback date
                    status: 'Active'
                } as Intern;
            }
            
            if (!internProfile) throw new Error("Could not find intern profile.");

            let department = getDepartment(internUser.department);
            
            // If department not found, create a mock department
            if (!department && departments.length > 0) {
                department = departments[0]; // Use first available department
            }
            
            if (!department) throw new Error("Could not find department details.");
            
            let hodUser = users.find(u => u.id === department.hod);
            
            // If HOD not found, use any available HOD or create mock
            if (!hodUser) {
                hodUser = users.find(u => u.role === Role.HOD);
                if (!hodUser) {
                    // Create mock HOD for PDF generation
                    hodUser = {
                        id: 'mock-hod',
                        name: 'HOD',
                        email: 'hod@company.com',
                        role: Role.HOD
                    } as User;
                }
            }

            const pdfDataUrl = await invoiceService.generateInvoicePdf(
                stipend, internUser, department, hodUser, internProfile, internSignatureUrl, stipend.hr_signature_url
            );

            if (!pdfDataUrl) throw new Error("Failed to generate PDF invoice.");

            const link = document.createElement('a');
            link.href = pdfDataUrl;
            // FIX: Explicitly cast month to a string to satisfy the function's type requirement.
            const filename = `Invoice-${(stipend.intern_name || internUser.name).replace(/\s+/g, '_')}-${formatStipendMonth(String(stipend.month))}.pdf`;
            link.download = filename;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            addToast(errorMessage, 'error');
        } finally {
            setInvoiceLoadingState(prev => ({ ...prev, [stipend.id]: false }));
        }
    };
    
    const handlePreviewInvoice = async (stipend: Stipend) => {
        try {
            if (stipend.intern_approval !== ApprovalStatus.APPROVED) {
                addToast("An invoice cannot be previewed until the intern approves the stipend.", "error");
                return;
            }
            const internSignatureUrl = stipend.intern_signature_url;
            
            // Try to get intern user from lookup, or create from API data
            let internUser = getInternUser(stipend.intern);
            let internProfile = interns.find(i => i.id === stipend.intern);
            
            // If we can't find intern details via lookup, use API-provided data
            if (!internUser && stipend.intern_name && stipend.intern_email) {
                // Try to find department from any available intern or use first available department
                const fallbackDept = departments.length > 0 ? departments[0].id : '';
                
                // Create a mock user object from API data
                internUser = {
                    id: 'mock-' + stipend.intern,
                    name: stipend.intern_name,
                    email: stipend.intern_email,
                    department: fallbackDept
                } as User;
            }
            
            if (!internUser) throw new Error("Could not find intern details.");
            
            // Try to find intern profile, or create minimal mock
            if (!internProfile && stipend.intern_name) {
                internProfile = {
                    id: stipend.intern,
                    user: internUser.id,
                    joining_date: new Date().toISOString().split('T')[0], // Fallback date
                    status: 'Active'
                } as Intern;
            }
            
            if (!internProfile) throw new Error("Could not find intern profile.");

            let department = getDepartment(internUser.department);
            
            // If department not found, create a mock department
            if (!department && departments.length > 0) {
                department = departments[0]; // Use first available department
            }
            
            if (!department) throw new Error("Could not find department details.");
            
            let hodUser = users.find(u => u.id === department.hod);
            
            // If HOD not found, use any available HOD or create mock
            if (!hodUser) {
                hodUser = users.find(u => u.role === Role.HOD);
                if (!hodUser) {
                    // Create mock HOD for preview
                    hodUser = {
                        id: 'mock-hod',
                        name: 'HOD',
                        email: 'hod@company.com',
                        role: Role.HOD
                    } as User;
                }
            }

            // Set preview data and open modal
            setPreviewInvoiceData({
                stipend,
                internUser,
                department,
                hodUser,
                internProfile,
                hrSignatureUrl: stipend.hr_signature_url,
                internSignatureUrl: stipend.intern_signature_url
            });
            setIsPreviewModalOpen(true);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            addToast(errorMessage, 'error');
        }
    };
    
    const renderActions = (stipend: Stipend) => {
        if (!user) return null;
        
        if (user.role === Role.INTERN && stipend.intern_approval === ApprovalStatus.PENDING) {
             return <Button size="sm" onClick={() => handleInternApprovalClick(stipend)}><EditIcon />Approve & Sign</Button>;
        }
        
        const isDownloadable = stipend.intern_approval === ApprovalStatus.APPROVED;
        const canView = [Role.INTERN, Role.HR, Role.HOD].includes(user.role);
        const isLoading = invoiceLoadingState[stipend.id];

        if (isDownloadable && canView) {
            return (
                <div className="flex space-x-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 text-sm hover:underline flex items-center"
                        onClick={() => handlePreviewInvoice(stipend)}
                        title="Preview Invoice"
                    >
                        <EyeIcon />
                        <span className="ml-1">Preview</span>
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary-red text-sm hover:underline flex items-center"
                        onClick={() => handleDownloadInvoice(stipend)}
                        disabled={isLoading}
                        title="Download Invoice"
                    >
                        {isLoading ? (
                            'Preparing...'
                        ) : (
                            <>
                                <DownloadIcon />
                                <span className="ml-1">Download</span>
                            </>
                        )}
                    </Button>
                </div>
            );
        }
        
        return <span className="text-xs text-slate-400">Not Available</span>;
    };

    const renderFilterToggle = () => {
        if (!user || ![Role.HR, Role.HOD, Role.MHR, Role.INTERN].includes(user.role)) return null;
        return (
            <div className="flex space-x-2 rounded-lg bg-light-blue p-1 mb-4 w-fit">
                <Button 
                    variant={viewFilter === 'pending' ? 'primary' : 'ghost'} 
                    size="sm"
                    className={`w-44 transition-all duration-200 ${viewFilter === 'pending' ? 'shadow' : ''}`}
                    onClick={() => setViewFilter('pending')}
                >
                    Pending My Approval
                </Button>
                <Button 
                    variant={viewFilter === 'all' ? 'primary' : 'ghost'} 
                    size="sm"
                     className={`w-44 transition-all duration-200 ${viewFilter === 'all' ? 'shadow' : ''}`}
                    onClick={() => setViewFilter('all')}
                >
                    Complete History
                </Button>
            </div>
        )
    };
    
    const activeInterns = interns
        .filter(i => i.status === InternStatus.ACTIVE)
        .map(i => {
            const internUser = users.find(u => u.id === i.user);
            return internUser ? { id: i.id, name: internUser.name } : null;
        })
        .filter(Boolean) as { id: string, name: string }[];

    const renderAddStipendForm = () => {
        if (!isAddFormVisible || user?.role !== Role.HR) return null;
        return (
            <Card className="mb-6 bg-white border border-gray-200 animate-in fade-in-0 slide-in-from-top-4">
                <h2 className="text-xl font-bold mb-4">Add Stipend with Calculator</h2>
                <form onSubmit={handleStipendSubmit} className="space-y-6">
                    {/* Section 1: Monthly Config */}
                    <div>
                        <h3 className="text-lg font-semibold border-b pb-2 mb-4">1. Monthly Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="Base Stipend (₹)" name="baseAmount" type="number" placeholder="e.g., 10000" value={monthlyConfig.baseAmount} onChange={handleMonthlyConfigChange} required />
                            <Input label="Total Working Days" name="totalWorkingDays" type="number" placeholder="e.g., 26" value={monthlyConfig.totalWorkingDays} onChange={handleMonthlyConfigChange} required />
                            <Input label="Paid Holidays" name="holidays" type="number" placeholder="e.g., 2" value={monthlyConfig.holidays} onChange={handleMonthlyConfigChange} required />
                        </div>
                        {stipendPerDay > 0 && (
                            <div className="mt-4 p-3 bg-light-blue text-secondary-blue rounded-md font-semibold">
                                Calculated Stipend per day: ₹{stipendPerDay.toFixed(2)}
                            </div>
                        )}
                    </div>

                    {/* Section 2: Intern Details */}
                    <div>
                        <h3 className="text-lg font-semibold border-b pb-2 mb-4">2. Intern Details</h3>
                        <div className="space-y-4">
                            <Select label="Select Intern" name="internId" value={newStipendData.internId} onChange={handleFormChange} required>
                                <option value="">-- Choose an Intern --</option>
                                {activeInterns.map(intern => <option key={intern.id} value={intern.id}>{intern.name}</option>)}
                            </Select>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Stipend Month" name="month" type="month" value={newStipendData.month} onChange={handleFormChange} required />
                                <Input label="Days Present" name="daysPresent" type="number" placeholder="No. of days intern was present" value={newStipendData.daysPresent} onChange={handleFormChange} required />
                            </div>

                             {/* Calculated Fields */}
                            {(finalAmount > 0 || newStipendData.daysPresent !== '') && (
                                <div className="mt-4 p-3 bg-light-gray border border-gray-200 rounded-md grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-500">Calculated Leaves</p>
                                        <p className="font-bold text-lg">{calculatedLeaves}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Final Stipend Amount</p>
                                        <p className="font-bold text-lg text-secondary-blue">₹{finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                            )}
                            
                            <Textarea label="Comments (Optional)" name="comments" value={newStipendData.comments} onChange={handleFormChange} placeholder="e.g., Performance bonus included" />
                        </div>
                    </div>
                    
                    {/* Section 3: HR Signature */}
                    <div>
                        <h3 className="text-lg font-semibold border-b pb-2 mb-4">3. HR Signature & Approval</h3>
                        <div className="flex flex-col items-center gap-2">
                             <p className="text-sm text-slate-600">Please sign below to approve and create this stipend record.</p>
                             <SignaturePad ref={hrSignaturePadRef} />
                             <Button variant="secondary" size="sm" type="button" onClick={() => hrSignaturePadRef.current?.clear()}>
                                Clear Signature
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 border-t pt-4">
                        <Button variant="secondary" type="button" onClick={() => setIsAddFormVisible(false)}>Cancel</Button>
                        <Button type="submit"><FilePlusIcon /> Sign & Create Stipend</Button>
                    </div>
                </form>
            </Card>
        )
    };
    
    const renderApprovalStatus = (stipend: Stipend) => (
        <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
            <div className="flex items-center gap-1"><Badge status={stipend.intern_approval} /><span className="text-xs text-slate-400">Intern</span></div>
            <div className="flex items-center gap-1"><Badge status={stipend.hr_approval} /><span className="text-xs text-slate-400">HR</span></div>
            <div className="flex items-center gap-1"><Badge status={stipend.hod_approval} /><span className="text-xs text-slate-400">HOD</span></div>
        </div>
    );

    return (
        <>
        <Card>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h1 className="text-2xl font-bold">Stipend Management</h1>
                <div className="flex items-center space-x-2">
                    {canBulkApprove && (
                        <Button onClick={handleBulkApprove}>
                            Approve Selected ({selectedStipends.size})
                        </Button>
                    )}
                    {user?.role === Role.HR && (
                         <Button variant="secondary" onClick={handleToggleAddForm}>
                            {isAddFormVisible ? 'Cancel' : 'Add New Stipend'}
                        </Button>
                    )}
                </div>
            </div>

            {renderFilterToggle()}
            
            {((user?.role === Role.HR && viewFilter === 'all') || (user?.role !== Role.INTERN && user?.role !== Role.HR)) && (
                <div className="flex flex-wrap gap-4 my-4">
                    <div className="flex-grow">
                        <Input 
                            icon={<SearchIcon />}
                            placeholder="Search by intern name..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <Select
                            value={monthFilter}
                            onChange={e => setMonthFilter(e.target.value)}
                        >
                            <option value="all">All Months</option>
                            {uniqueMonths.map(month => (
                                <option key={month} value={month}>{formatStipendMonth(month)}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="w-full sm:w-48">
                        <Select
                            value={downloadMonth}
                            onChange={e => setDownloadMonth(e.target.value)}
                        >
                            <option value="">Select Month to Download</option>
                            {uniqueMonths.map(month => (
                                <option key={month} value={month}>{formatStipendMonth(month)}</option>
                            ))}
                        </Select>
                    </div>
                    <Button onClick={handleDownloadExcel} disabled={!downloadMonth}>
                        <DownloadIcon />
                        <span className="ml-2">Download Excel</span>
                    </Button>
                </div>
            )}

            {renderAddStipendForm()}

            {isLoading ? <Spinner /> : (
                <Table headers={headers}>
                    {filteredStipends.map(stipend => {
                         const internUser = getInternUser(stipend.intern);
                         return (
                             <tr key={stipend.id} className="hover:bg-light-blue/50 transition-colors duration-150">
                                {user && [Role.HR, Role.HOD].includes(user.role) && viewFilter === 'pending' && (
                                     <td className="px-6 py-4">
                                         <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-red focus:ring-primary-red"
                                             checked={selectedStipends.has(stipend.id)}
                                             onChange={() => toggleSelection(stipend.id)}
                                             aria-labelledby={`intern-name-${stipend.id}`}
                                         />
                                     </td>
                                 )}
                                 <td id={`intern-name-${stipend.id}`} className="px-6 py-4 whitespace-nowrap text-sm font-medium">{stipend.intern_name || internUser?.name || 'N/A'}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm">{formatStipendMonth(stipend.month)}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm">₹{stipend.amount.toLocaleString('en-IN')}</td>
                                 <td className="px-6 py-4 whitespace-nowrap">{renderApprovalStatus(stipend)}</td>
                                 <td className="px-6 py-4 whitespace-nowrap">{renderActions(stipend)}</td>
                             </tr>
                         );
                    })}
                     {filteredStipends.length === 0 && !isLoading && (
                        <tr><td colSpan={headers.length} className="text-center py-10 text-slate-500">
                           { "No stipends found matching your criteria." }
                        </td></tr>
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
        <SignatureModal
            isOpen={isSignatureModalOpen}
            onClose={() => { setIsSignatureModalOpen(false); setStipendToSign(null); setInvoicePreviewData(null); }}
            onConfirm={handleSignAndApprove}
            title={`Approve Stipend Invoice: ${stipendToSign ? formatStipendMonth(stipendToSign.month) : ''}`}
            isConfirming={isSubmitting}
        >
          {invoicePreviewData && <InvoicePreview {...invoicePreviewData} />}
        </SignatureModal>
        
        {/* Invoice Preview Modal */}
        {previewInvoiceData && (
            <InvoicePreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => {
                    setIsPreviewModalOpen(false);
                    setPreviewInvoiceData(null);
                }}
                stipend={previewInvoiceData.stipend}
                internUser={previewInvoiceData.internUser}
                department={previewInvoiceData.department}
                hodUser={previewInvoiceData.hodUser}
                internProfile={previewInvoiceData.internProfile}
                hrSignatureUrl={previewInvoiceData.hrSignatureUrl}
                internSignatureUrl={previewInvoiceData.internSignatureUrl}
            />
        )}
        </>
    );
};

export default Stipends;