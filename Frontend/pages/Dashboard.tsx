
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Role, Candidate, Intern, Stipend, CandidateStatus, InternStatus, ApprovalStatus, User, Department, ExtensionRequest, ExitRequest } from '../types';
import Card from '../components/ui/Card';
import { ClipboardListIcon, UserPlusIcon, DollarSignIcon, IndianRupeeIcon,BriefcaseIcon, LogOutIcon, UserCheckIcon, MilestoneIcon } from '../components/icons';
import BirthdayWidget from '../components/dashboard/BirthdayWidget';
import Spinner from '../components/ui/Spinner';
import apiService from '../services/apiService.ts';
import PendingTasksWidget, { Task } from '../components/dashboard/PendingTasksWidget';
import AnalyticsChart from '../components/dashboard/AnalyticsChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickActions from '../components/dashboard/QuickActions';
import PerformanceMetrics from '../components/dashboard/PerformanceMetrics';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({ loading: true, pendingTasks: [] });
  const [analyticsData, setAnalyticsData] = useState<any>({ loading: true });

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        const [allCandidates, allInterns, allStipends, allUsers, allDepartments, allExtensions, allExits] = await Promise.all([
          apiService.getCandidates(),
          apiService.getInterns(),
          apiService.getStipends(),
          apiService.getUsers(),
          apiService.getDepartments(),
          apiService.getExtensionRequests(),
          apiService.getExitRequests(),
        ]);
        
        let userSpecificData: any = {};
        const pendingTasks: Task[] = [];
        
        // General stats for management (will be overridden for HOD)
        userSpecificData.newCandidates = allCandidates.filter(c => c.status === CandidateStatus.PENDING_ASSIGNMENT).length;
        userSpecificData.activeInterns = allInterns.filter(i => i.status === InternStatus.ACTIVE).length;
        userSpecificData.pendingExits = allExits.filter(e => e.status === ApprovalStatus.PENDING).length;

        // Create a map from internId to departmentId for efficient lookups for HOD role
        const internToDeptMap = new Map<string, string | undefined>();
        allInterns.forEach(intern => {
            const internUser = allUsers.find(u => u.id === intern.user);
            if (internUser) {
                internToDeptMap.set(intern.id, internUser.department);
            }
        });


        // Role-specific stats and tasks
        switch (user.role) {
            case Role.INTERN: {
                const internProfile = allInterns.find(i => i.user === user.id);
                if (internProfile) {
                    const pendingStipendApproval = allStipends.filter(s => s.intern === internProfile.id && s.intern_approval === ApprovalStatus.PENDING).length;
                    if (pendingStipendApproval > 0) {
                        pendingTasks.push({ description: "Approve your monthly stipend", count: pendingStipendApproval, link: "/stipends", icon: <IndianRupeeIcon /> });
                    }
                    const myStipend = allStipends.find(s => s.intern === internProfile.id && s.intern_approval === ApprovalStatus.PENDING);
                    const department = allDepartments.find(d => d.id === user.department);
                    const mentor = allUsers.find(u => u.id === internProfile.mentor);

                    userSpecificData.stipendAmount = myStipend?.amount || 10000;
                    userSpecificData.stipendMonth = myStipend?.month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
                    userSpecificData.stipendStatus = myStipend ? 'Pending Your Approval' : 'No Pending Stipend';
                    userSpecificData.internStatus = internProfile.status;
                    userSpecificData.departmentName = department?.name || 'N/A';
                    userSpecificData.mentorName = mentor?.name || 'N/A';
                }
                break;
            }
            case Role.HR: {
                const newCandidates = allCandidates.filter(c => c.status === CandidateStatus.PENDING_ASSIGNMENT).length;
                if (newCandidates > 0) pendingTasks.push({ description: "Assign mentors to candidates", count: newCandidates, link: "/candidates", icon: <UserPlusIcon /> });

                const pendingStipendApproval = allStipends.filter(s => s.intern_approval === ApprovalStatus.APPROVED && s.hr_approval === ApprovalStatus.PENDING).length;
                if (pendingStipendApproval > 0) pendingTasks.push({ description: "Approve stipend payments", count: pendingStipendApproval, link: "/stipends", icon: <IndianRupeeIcon /> });
                
                const pendingExtensions = allExtensions.filter(r => r.status === ApprovalStatus.PENDING && r.hr_approval === ApprovalStatus.PENDING).length;
                if (pendingExtensions > 0) pendingTasks.push({ description: "Review extension requests", count: pendingExtensions, link: "/extensions", icon: <MilestoneIcon /> });

                const pendingExits = allExits.filter(r => r.status === ApprovalStatus.PENDING && r.hr_approval === ApprovalStatus.PENDING).length;
                if (pendingExits > 0) pendingTasks.push({ description: "Process exit forms", count: pendingExits, link: "/exit", icon: <LogOutIcon /> });
                break;
            }
            case Role.MENTOR: {
                const pendingInterviews = allCandidates.filter(c => c.assigned_mentor === user.id && c.status === CandidateStatus.PENDING_INTERVIEW).length;
                if (pendingInterviews > 0) pendingTasks.push({ description: "Conduct interviews", count: pendingInterviews, link: "/interviews", icon: <ClipboardListIcon /> });
                userSpecificData.pendingInterviews = pendingInterviews;

                const pendingExtensions = allExtensions.filter(r => r.status === ApprovalStatus.PENDING && r.hr_approval === ApprovalStatus.APPROVED && r.mentor_approval === ApprovalStatus.PENDING).length;
                if (pendingExtensions > 0) pendingTasks.push({ description: "Approve extension requests", count: pendingExtensions, link: "/extensions", icon: <MilestoneIcon /> });

                const pendingExits = allExits.filter(r => r.status === ApprovalStatus.PENDING && r.hr_approval === ApprovalStatus.APPROVED && r.mentor_approval === ApprovalStatus.PENDING).length;
                if (pendingExits > 0) pendingTasks.push({ description: "Approve exit forms", count: pendingExits, link: "/exit", icon: <LogOutIcon /> });
                
                userSpecificData.myMentees = allInterns.filter(i => i.mentor === user.id && i.status === InternStatus.ACTIVE).length;
                break;
            }
            case Role.HOD: {
                // Find the HOD's department from the departments table, which is the source of truth.
                const hodDepartment = allDepartments.find(d => d.hod === user.id);
                const hodDepartmentId = hodDepartment?.id;

                // Calculate department-specific tasks using the correct department ID.
                const pendingCandidateApproval = allCandidates.filter(c => c.status === CandidateStatus.PENDING_HOD_APPROVAL && c.department === hodDepartmentId).length;
                if (pendingCandidateApproval > 0) pendingTasks.push({ description: "Approve candidates", count: pendingCandidateApproval, link: "/candidates", icon: <UserCheckIcon /> });

                const pendingStipendApproval = allStipends.filter(s => s.hr_approval === ApprovalStatus.APPROVED && s.hod_approval === ApprovalStatus.PENDING && internToDeptMap.get(s.intern) === hodDepartmentId).length;
                if (pendingStipendApproval > 0) pendingTasks.push({ description: "Approve stipends", count: pendingStipendApproval, link: "/stipends", icon: <IndianRupeeIcon /> });
                
                const pendingExtensions = allExtensions.filter(r => r.status === ApprovalStatus.PENDING && r.mentor_approval === ApprovalStatus.APPROVED && r.hod_approval === ApprovalStatus.PENDING && internToDeptMap.get(r.intern) === hodDepartmentId).length;
                if (pendingExtensions > 0) pendingTasks.push({ description: "Approve extension requests", count: pendingExtensions, link: "/extensions", icon: <MilestoneIcon /> });

                const pendingExits = allExits.filter(r => r.status === ApprovalStatus.PENDING && r.mentor_approval === ApprovalStatus.APPROVED && r.hod_approval === ApprovalStatus.PENDING && internToDeptMap.get(r.intern) === hodDepartmentId).length;
                if (pendingExits > 0) pendingTasks.push({ description: "Approve exit forms", count: pendingExits, link: "/exit", icon: <LogOutIcon /> });

                // Override general stats with department-specific stats for the HOD's StatCards
                userSpecificData.newCandidates = pendingCandidateApproval;
                userSpecificData.pendingStipends = pendingStipendApproval;
                userSpecificData.pendingExits = pendingExits;
                userSpecificData.activeInterns = allInterns.filter(i => {
                    return internToDeptMap.get(i.id) === hodDepartmentId && i.status === InternStatus.ACTIVE;
                }).length;
                break;
            }
        }
        setStats({ ...userSpecificData, pendingTasks, loading: false });
      } catch (error) {
        console.error("Failed to load dashboard data", error);
        setStats({ loading: false, error: true, pendingTasks: [] });
      }
    };

    const fetchAnalyticsData = async () => {
      try {
        const data = await apiService.getDashboardStats();
        setAnalyticsData({ ...data, loading: false });
      } catch (error) {
        console.error("Failed to load analytics data", error);
        setAnalyticsData({ loading: false, error: true });
      }
    };

    fetchDashboardData();
    fetchAnalyticsData();
  }, [user]);

  const renderWelcomeMessage = () => (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-primary-navy">Welcome back, {user?.name}!</h1>
      <p className="text-slate-500 mt-1">Here's a summary of your tasks and activities.</p>
    </div>
  );
  
  const StatCard = ({icon, title, value}: {icon: React.ReactNode, title: string, value: string | number}) => (
      <Card>
          <div className="flex items-center">
              <div className="p-3 rounded-full bg-light-blue text-secondary-blue mr-4">{icon}</div>
              <div>
                  <p className="text-sm font-medium text-slate-500">{title}</p>
                  <p className="text-2xl font-bold">{value}</p>
              </div>
          </div>
      </Card>
  );

  const renderDashboardByRole = () => {
    if (stats.loading) return <div className="flex justify-center col-span-full"><Spinner /></div>;
    if (stats.error) return <Card><p>Could not load dashboard data.</p></Card>;

    const tasksWidget = <PendingTasksWidget tasks={stats.pendingTasks} />;

    switch (user?.role) {
      case Role.HR:
        const isHr = user.role === Role.HR;
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<UserPlusIcon />} title="New Candidates" value={stats.newCandidates} />
                <StatCard icon={<BriefcaseIcon />} title="Active Interns" value={stats.activeInterns} />
                <StatCard icon={<IndianRupeeIcon/>} title="Pending Stipends" value={stats.pendingStipends} />
                {!isHr && <StatCard icon={<ClipboardListIcon />} title="Pending Exits" value={stats.pendingExits} />}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tasksWidget}
              <QuickActions />
            </div>
            
            {!analyticsData.loading && !analyticsData.error && (
              <>
                <PerformanceMetrics 
                  candidateStats={analyticsData.candidate_stats}
                  internStats={analyticsData.intern_stats}
                />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AnalyticsChart
                    title="Candidate Pipeline"
                    type="donut"
                    data={[
                      { label: 'New', value: analyticsData.candidate_stats?.by_status?.NEW || 0, color: '#3b82f6' },
                      { label: 'Interview', value: analyticsData.candidate_stats?.by_status?.PENDING_INTERVIEW || 0, color: '#f59e0b' },
                      { label: 'HOD Review', value: analyticsData.candidate_stats?.by_status?.PENDING_HOD_APPROVAL || 0, color: '#8b5cf6' },
                      { label: 'MHR Review', value: analyticsData.candidate_stats?.by_status?.PENDING_MHR_APPROVAL || 0, color: '#06b6d4' },
                      { label: 'Selected', value: analyticsData.candidate_stats?.by_status?.SELECTED || 0, color: '#10b981' },
                      { label: 'Onboarded', value: analyticsData.candidate_stats?.by_status?.ONBOARDED || 0, color: '#059669' },
                      { label: 'Rejected', value: analyticsData.candidate_stats?.by_status?.REJECTED || 0, color: '#ef4444' },
                    ]}
                  />
                  <RecentActivity activities={analyticsData.recent_activity || []} />
                </div>
              </>
            )}
          </>
        );
      case Role.HOD:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<UserCheckIcon />} title="Pending Candidates" value={stats.newCandidates} />
                <StatCard icon={<BriefcaseIcon />} title="Active Interns (Dept.)" value={stats.activeInterns} />
                <StatCard icon={<IndianRupeeIcon />} title="Pending Stipends" value={stats.pendingStipends} />
                <StatCard icon={<LogOutIcon />} title="Pending Exits" value={stats.pendingExits} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tasksWidget}
              <QuickActions />
            </div>
          </>
        );
      case Role.MENTOR:
        return (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard icon={<ClipboardListIcon />} title="Pending Interviews" value={stats.pendingInterviews} />
                    <StatCard icon={<BriefcaseIcon />} title="My Mentees" value={stats.myMentees} />
                    <StatCard icon={<LogOutIcon />} title="Pending Exit Approvals" value={stats.pendingExits} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {tasksWidget}
                  <QuickActions />
                </div>
            </>
        );
      case Role.INTERN:
        return (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Card>
                        <h3 className="font-bold text-lg mb-2">Next Stipend</h3>
                        <p className="text-sm text-slate-500">{stats.stipendMonth}</p>
                        <p className="text-2xl font-bold mt-1">₹ {stats.stipendAmount?.toLocaleString()}</p>
                        {stats.stipendStatus === 'Pending Your Approval' && <p className="text-xs text-dark-red mt-2">{stats.stipendStatus}</p>}
                     </Card>
                     <Card>
                        <h3 className="font-bold text-lg mb-2">My Status</h3>
                        <p>Status: <span className="font-semibold text-secondary-blue">{stats.internStatus}</span></p>
                        <p>Department: <span className="font-semibold">{stats.departmentName}</span></p>
                        <p>Mentor: <span className="font-semibold">{stats.mentorName}</span></p>
                     </Card>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {tasksWidget}
                  <QuickActions />
                </div>
            </>
        );
      default:
        return <Card><p>Welcome to the Intern Management System.</p></Card>;
    }
  };

  return (
    <div className="space-y-6">
      {renderWelcomeMessage()}
      {renderDashboardByRole()}
      <BirthdayWidget />
    </div>
  );
};

export default Dashboard;