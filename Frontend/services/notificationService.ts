import { User, Candidate, Role, LeaveType } from '../types';
import db from './db';
import apiService from './apiService';

interface EmailParams {
  to: string;
  subject: string;
  body: string;
  cc?: string;
}

// Real email service using backend API
const notificationService = {
  sendEmail: async (params: EmailParams): Promise<void> => {
    try {
      await apiService.sendEmail({
        to: params.to,
        subject: params.subject,
        body: params.body,
        cc: params.cc
      });
      console.log(`✓ Email sent successfully to ${params.to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      // Fallback to console logging for debugging
      console.log("--- EMAIL SEND FAILED - FALLBACK LOG ---");
      console.log(`To: ${params.to}`);
      if (params.cc) {
        console.log(`CC: ${params.cc}`);
      }
      console.log(`Subject: ${params.subject}`);
      console.log("Body:", params.body);
      console.log("Error:", error);
      console.log("-----------------------");
    }
  },

  sendNotificationEmail: async (type: string, data: any): Promise<void> => {
    try {
      await apiService.sendNotificationEmail(type, data);
      console.log(`✓ ${type} notification sent successfully`);
    } catch (error) {
      console.error(`Failed to send ${type} notification:`, error);
    }
  },
  
  notifyMentorForInterview: (mentor: User, hod: User, candidate: Candidate) => {
    return notificationService.sendNotificationEmail('mentor_interview', {
      mentor_email: mentor.email,
      mentor_name: mentor.name,
      hod_email: hod.email,
      candidate_name: candidate.name
    });
  },

  notifyHodForAssessment: (hod: User, mentor: User, candidate: Candidate) => {
     return notificationService.sendNotificationEmail('hod_assessment', {
      hod_email: hod.email,
      hod_name: hod.name,
      mentor_name: mentor.name,
      candidate_name: candidate.name
    });
  },

  notifyInternOfSelection: async (candidate: Candidate) => {
    const hrUsers = await db.users.find({ role: Role.HR });
    const hrName = hrUsers[0]?.name || 'HR Department';
    
    return notificationService.sendNotificationEmail('selection', {
      candidate_email: candidate.email,
      candidate_name: candidate.name,
      joining_date: candidate.joining_date,
      joining_time: candidate.joining_time,
      joining_location: candidate.joining_location,
      hr_name: hrName
    });
  },

  notifyForStipendApproval: (nextApprover: User, internName: string, month: string) => {
     return notificationService.sendNotificationEmail('stipend_approval', {
      approver_email: nextApprover.email,
      approver_name: nextApprover.name,
      intern_name: internName,
      month: month
    });
  },

  notifyConcurForPayment: (interns: {name: string, email: string, amount: number}[], month: string) => {
    const internDetails = interns.map(i => `- ${i.name} (${i.email}): ${i.amount}`).join('\n');
    return notificationService.sendEmail({
        to: 'concur@example.com',
        subject: `Intern Stipend Payment for ${month}`,
        body: `Hi Concur Team,\n\nPlease process the stipend payments for the following interns for ${month}. Invoices are attached in the IMS.\n\nThanks,\nIMS System`
    });
  },

  notifyForLeaveRequest: (mentor: User, hod: User, hr: User, internName: string, startDate: string, endDate: string, leaveType: LeaveType, reason: string) => {
     return notificationService.sendNotificationEmail('leave_request', {
        mentor_email: mentor.email,
        mentor_name: mentor.name,
        hod_email: hod.email,
        hr_email: hr.email,
        intern_name: internName,
        start_date: startDate,
        end_date: endDate,
        leave_type: leaveType,
        reason: reason
     });
  },
  
  notifyInternOfLeaveStatus: (internEmail: string, internName: string, dates: string, status: string) => {
     return notificationService.sendNotificationEmail('leave_status', {
        intern_email: internEmail,
        intern_name: internName,
        dates: dates,
        status: status
     });
  },

  notifyForExitApproval: (approver: User, internName: string) => {
    return notificationService.sendNotificationEmail('exit_approval', {
        approver_email: approver.email,
        approver_name: approver.name,
        intern_name: internName
    });
  },

  notifyForExtensionApproval: (approver: User, internName: string) => {
     return notificationService.sendNotificationEmail('extension_approval', {
        approver_email: approver.email,
        approver_name: approver.name,
        intern_name: internName
     });
  },

  notifyInternOfExtensionStatus: (internEmail: string, internName: string, status: string) => {
     return notificationService.sendNotificationEmail('extension_status', {
        intern_email: internEmail,
        intern_name: internName,
        status: status
     });
  },
};

export default notificationService;