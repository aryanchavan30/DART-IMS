import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/apiService.ts';
import { Intern, User, Department, Role, Candidate } from '../types';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import { FileSpreadsheet } from 'lucide-react';
import CandidateApplicationView from '../components/candidates/CandidateApplicationView';
import InternDocuments from '../components/interns/InternDocumentsNew.tsx';
import ChangePassword from '../components/profile/ChangePassword';

import BankDetailsForm from '../components/interns/BankDetailsForm.tsx';

const Profile: React.FC = () => {
    const { user } = useAuth();
    const [internProfile, setInternProfile] = useState<Intern | null>(null);
    const [candidateProfile, setCandidateProfile] = useState<Candidate | null>(null);
    const [department, setDepartment] = useState<Department | null>(null);
    const [mentor, setMentor] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                // Fetch intern-specific profile
                const allInterns = await apiService.getInterns();
                const intern = allInterns.find(i => i.user === user.id);
                setInternProfile(intern || null);
                
                if (intern?.candidate) {
                    const candidate = await apiService.getCandidateById(intern.candidate);
                    setCandidateProfile(candidate || null);
                }

                // Fetch common details
                if (user.department) {
                    const dept = await apiService.getDepartmentById(user.department);
                    if(dept) setDepartment(dept);
                }
                if (intern?.mentor) {
                    const mentorUser = await apiService.getUserById(intern.mentor);
                    if (mentorUser) setMentor(mentorUser);
                }
            } catch (error) {
                console.error("Failed to fetch profile data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);
    

    const handleBankDetailsUpdate = (updatedIntern: Intern) => {
        setInternProfile(updatedIntern);
    };

    if (isLoading) return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    if (!user) return <Card><p>Could not load user profile.</p></Card>;

    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-primary-navy">My Profile</h1>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                        <img
                            className="h-32 w-32 rounded-full shadow-lg"
                            src={`https://i.pravatar.cc/200?u=${user.id}`}
                            alt="Profile"
                        />
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold">{user.name}</h2>
                            <p className="text-slate-500">{user.email}</p>
                            <p className="mt-1 text-md font-semibold text-primary-red">{user.role}</p>
                            
                            {internProfile && (
                                <div className="mt-2">
                                    <Badge status={internProfile.status} />
                                </div>
                            )}
                            
                            <div className="mt-6 border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-medium text-slate-500">Login ID</h3>
                                    <p className="mt-1 text-lg font-semibold">{user.login_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-slate-500">Department</h3>
                                    <p className="mt-1 text-lg font-semibold">{department?.name || 'N/A'}</p>
                                </div>
                                {internProfile && (
                                    <>
                                        <div>
                                            <h3 className="text-sm font-medium text-slate-500">Mentor</h3>
                                            <p className="mt-1 text-lg font-semibold">{mentor?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-slate-500">Joining Date</h3>
                                            <p className="mt-1 text-lg font-semibold">{new Date(internProfile.joining_date).toLocaleDateString()}</p>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-500">Assigned Shift</h3>
                                    <p className="mt-1 text-lg font-semibold">{user.shift}</p>
                                </div>
                                 <div className="md:col-span-2">
                                    <h3 className="text-sm font-medium text-slate-500">Week Offs</h3>
                                    <p className="mt-1 text-lg font-semibold">{user.week_offs?.map(d => weekDays[d]).join(', ') || 'Not specified'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
                 <div className="space-y-6">
                    {internProfile && (
                        <>
                        <Card>
                            <h3 className="font-bold text-lg mb-4">Bank Details</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <h4 className="font-medium text-slate-500">Bank Name</h4>
                                    <p className="font-semibold">{internProfile.bank_details?.bank_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-500">Account Number</h4>
                                    <p className="font-semibold tracking-wider">**** **** {internProfile.bank_details?.account_number?.slice(-4) || 'N/A'}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-500">IFSC Code</h4>
                                    <p className="font-semibold">{internProfile.bank_details?.ifsc_code || 'N/A'}</p>
                                </div>
                            </div>
                        </Card>
                        <Card>
                            <h3 className="font-bold text-lg mb-4">My Documents</h3>
                            <div className="space-y-3">
                                <ReactRouterDOM.Link to="/stipends" className="flex items-center text-primary-red hover:underline">
                                    <FileSpreadsheet size={18} className="mr-2" /> View Invoices
                                </ReactRouterDOM.Link>
                            </div>
                        </Card>
                        </>
                    )}
                </div>
            </div>



            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {user.role === Role.INTERN && internProfile && (
                    <BankDetailsForm
                        internId={internProfile.id}
                        initialData={internProfile.bank_details}
                        onUpdateSuccess={handleBankDetailsUpdate}
                    />
                )}

                {user.role === Role.INTERN && candidateProfile && (
                    <Card>
                        <h2 className="text-xl font-bold mb-4 text-primary-navy">My Application Details</h2>
                        <InternDocuments internId = {internProfile.id}/>
                    </Card>
                )}
                <div className="lg:col-span-1">
                    <ChangePassword />
                </div>
            </div>
        </div>
    );
};

export default Profile;
