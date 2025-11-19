
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import db from '../services/db';
import { Intern, User, Department, LeaveRequest, Role, ApprovalStatus, LeaveType } from '../types';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import { SearchIcon } from '../components/icons';

interface LeaveBalanceData {
  internId: string;
  internName: string;
  internEmail: string;
  departmentName: string;
  mentorName: string;
  credited: number;
  taken: number;
  balance: number;
}

const LeaveBalance: React.FC = () => {
    const { user: authUser } = useAuth();
    const [interns, setInterns] = useState<Intern[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [allInterns, allUsers, allDepartments, allLeaves] = await Promise.all([
                    db.interns.getAll(),
                    db.users.find({}),
                    db.departments.getAll(),
                    db.leaves.getAll(),
                ]);
                setInterns(allInterns);
                setUsers(allUsers);
                setDepartments(allDepartments);
                setLeaveRequests(allLeaves);
            } catch (error) {
                console.error("Failed to fetch leave balance data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const calculateLeaveDays = (leave: LeaveRequest): number => {
        if (leave.leaveType === LeaveType.HALF_DAY) {
            return 0.5;
        }
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const leaveBalanceData = useMemo<LeaveBalanceData[]>(() => {
        return interns.map(intern => {
            const internUser = users.find(u => u.id === intern.userId);
            if (!internUser) return null;

            const department = departments.find(d => d.id === internUser.departmentId);
            const mentor = users.find(u => u.id === intern.mentorId);

            // Calculate credited leaves (2 per month)
            const joiningDate = new Date(intern.joiningDate);
            const today = new Date();
            const monthsWorked = (today.getFullYear() - joiningDate.getFullYear()) * 12 + (today.getMonth() - joiningDate.getMonth()) + 1;
            const credited = monthsWorked * 2;

            // Calculate taken leaves
            const taken = leaveRequests
                .filter(lr => lr.internId === intern.id && lr.status === ApprovalStatus.APPROVED)
                .reduce((total, lr) => total + calculateLeaveDays(lr), 0);

            const balance = credited - taken;

            return {
                internId: intern.id,
                internName: internUser.name,
                internEmail: internUser.email,
                departmentName: department?.name || 'N/A',
                mentorName: mentor?.name || 'N/A',
                credited,
                taken,
                balance,
            };
        }).filter((item): item is LeaveBalanceData => item !== null);
    }, [interns, users, departments, leaveRequests]);

    const filteredData = useMemo(() => {
        let data = leaveBalanceData;

        if (authUser?.role === Role.MENTOR) {
            const myMenteeIds = interns.filter(i => i.mentorId === authUser.id).map(i => i.id);
            data = data.filter(d => myMenteeIds.includes(d.internId));
        }
        
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            data = data.filter(d =>
                d.internName.toLowerCase().includes(lowerSearch) ||
                d.internEmail.toLowerCase().includes(lowerSearch) ||
                d.departmentName.toLowerCase().includes(lowerSearch) ||
                d.mentorName.toLowerCase().includes(lowerSearch)
            );
        }

        return data;
    }, [leaveBalanceData, searchTerm, authUser, interns]);

    const getBalanceBadge = (balance: number) => {
        let colorClass = 'bg-secondary-blue text-white'; // High balance
        if (balance <= 2) {
             colorClass = 'bg-dark-red/20 text-dark-red'; // Low balance
        } else if (balance <= 5) {
            colorClass = 'bg-light-blue text-secondary-blue'; // Medium balance
        }
        return <span className={`px-2.5 py-1 text-sm font-bold rounded-full inline-block whitespace-nowrap leading-tight ${colorClass}`}>{balance}</span>;
    };
    
    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Intern Leave Balance</h1>
            </div>
            <div className="mb-4 max-w-lg">
                <Input
                    icon={<SearchIcon />}
                    placeholder="Search by name, department, mentor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading ? <Spinner /> : (
                <Table headers={['Intern Name', 'Department', 'Mentor', 'Credited', 'Taken', 'Balance']}>
                    {filteredData.map(data => (
                        <tr key={data.internId} className="hover:bg-light-blue/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-primary-navy">{data.internName}</div>
                                <div className="text-sm text-gray-500">{data.internEmail}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{data.departmentName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{data.mentorName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-semibold text-center">{data.credited}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-semibold text-center">{data.taken}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">{getBalanceBadge(data.balance)}</td>
                        </tr>
                    ))}
                    {filteredData.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-10 text-slate-500">No data found matching your criteria.</td></tr>
                    )}
                </Table>
            )}
        </Card>
    );
};
export default LeaveBalance;
