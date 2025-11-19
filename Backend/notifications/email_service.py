from django.core.mail import EmailMessage
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """
    Email service for sending notifications using Django's email backend
    """
    
    @staticmethod
    def send_email(to_email, subject, body, cc_emails=None, attachments=None):
        """
        Send email using Django's configured SMTP backend.
        Can handle attachments.
        
        Args:
            to_email (str): Recipient email address
            subject (str): Email subject
            body (str): Email body content
            cc_emails (list): Optional list of CC email addresses
            attachments (list): List of tuples, e.g., [('invoice.pdf', pdf_content, 'application/pdf')]
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        try:
            from_email = settings.EMAIL_HOST_USER
            recipient_list = [to_email]
            
            if cc_emails:
                if isinstance(cc_emails, str):
                    cc_emails = [email.strip() for email in cc_emails.split(',')]
            else:
                cc_emails = []

            # Use EmailMessage which can handle attachments
            email = EmailMessage(
                subject=subject,
                body=body,
                from_email=from_email,
                to=recipient_list,
                cc=cc_emails
            )

            # Add attachments if they are provided
            if attachments:
                for filename, content, mimetype in attachments:
                    email.attach(filename, content, mimetype)
            
            email.send(fail_silently=False)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    @staticmethod
    def send_mentor_interview_notification(mentor_email, mentor_name, hod_email, candidate_name):
        """Send interview assignment notification to mentor"""
        subject = f"Interview Assignment: {candidate_name}"
        body = f"""Hi {mentor_name},

You have been assigned to interview the candidate '{candidate_name}'. Please conduct the interview and submit your feedback in the IMS portal.

Thanks,
HR"""
        
        return EmailService.send_email(
            to_email=mentor_email,
            subject=subject,
            body=body,
            cc_emails=[hod_email]
        )
    
    @staticmethod
    def send_hod_assessment_notification(hod_email, hod_name, mentor_name, candidate_name):
        """Send assessment notification to HOD"""
        subject = f"Interview Assessment Submitted for {candidate_name}"
        body = f"""Hi {hod_name},

Mentor {mentor_name} has submitted the interview assessment for '{candidate_name}'. Please review and provide your feedback.

Thanks,
IMS System"""
        
        return EmailService.send_email(
            to_email=hod_email,
            subject=subject,
            body=body
        )
    
    @staticmethod
    def send_selection_notification(candidate_email, candidate_name, joining_date, joining_time, joining_location, hr_name="HR Department"):
        """Send selection notification to candidate"""
        subject = "Congratulations! You've been selected!"
        body = f"""Hi {candidate_name},

We are pleased to inform you that you have been selected for the internship.

Joining Date: {joining_date}
Time: {joining_time}
Location: {joining_location}

Welcome aboard!

Thanks,
{hr_name}"""
        
        return EmailService.send_email(
            to_email=candidate_email,
            subject=subject,
            body=body
        )
    
    @staticmethod
    def send_stipend_approval_notification(approver_email, approver_name, intern_name, month):
        """Send stipend approval notification"""
        subject = f"Stipend Approval Required for {intern_name}"
        body = f"""Hi {approver_name},

The stipend for {intern_name} for the month of {month} is pending your approval. Please log in to the IMS to review.

Thanks,
IMS System"""
        
        return EmailService.send_email(
            to_email=approver_email,
            subject=subject,
            body=body
        )
    
    @staticmethod
    def send_leave_request_notification(mentor_email, mentor_name, hod_email, hr_email, intern_name, start_date, end_date, leave_type, reason):
        """Send leave request notification"""
        dates = start_date if start_date == end_date else f"{start_date} to {end_date}"
        subject = f"Leave Request Approval Required for {intern_name}"
        body = f"""Hi {mentor_name},

Intern {intern_name} has submitted a leave request.

Details:
- Dates: {dates}
- Type: {leave_type}
- Reason: {reason}

Please log in to the IMS to approve or reject this request.

Thanks,
IMS System"""
        
        return EmailService.send_email(
            to_email=mentor_email,
            subject=subject,
            body=body,
            cc_emails=[hod_email, hr_email]
        )
    
    @staticmethod
    def send_leave_status_notification(intern_email, intern_name, dates, status):
        """Send leave status update to intern"""
        subject = "Update on Your Leave Request"
        body = f"""Hi {intern_name},

Your leave request for {dates} has been {status}.

Thanks,
IMS System"""
        
        return EmailService.send_email(
            to_email=intern_email,
            subject=subject,
            body=body
        )
    
    @staticmethod
    def send_exit_approval_notification(approver_email, approver_name, intern_name):
        """Send exit process approval notification"""
        subject = f"Exit Process Approval Required for {intern_name}"
        body = f"""Hi {approver_name},

The exit form for intern {intern_name} is pending your approval. Please review it in the IMS.

Thanks,
IMS System"""
        
        return EmailService.send_email(
            to_email=approver_email,
            subject=subject,
            body=body
        )
    
    @staticmethod
    def send_extension_approval_notification(approver_email, approver_name, intern_name):
        """Send extension approval notification"""
        subject = f"Internship Extension Approval Required for {intern_name}"
        body = f"""Hi {approver_name},

The extension request for intern {intern_name} is pending your approval. Please review it in the IMS.

Thanks,
IMS System"""
        
        return EmailService.send_email(
            to_email=approver_email,
            subject=subject,
            body=body
        )
    
    @staticmethod
    def send_extension_status_notification(intern_email, intern_name, status):
        """Send extension status update to intern"""
        subject = "Update on Your Internship Extension Request"
        body = f"""Hi {intern_name},

Your request for an internship extension has been {status}.

Thanks,
HR Team"""
        
        return EmailService.send_email(
            to_email=intern_email,
            subject=subject,
            body=body
        )

    @staticmethod
    def send_stipend_creation_notification_to_intern(intern_user, stipend, attachments=None):
        """Send notification to intern when their stipend is created."""
        subject = f"Your Stipend for {stipend.month} Has Been Generated"
        body = f"""Hi {intern_user.name},

Your stipend for the month of {stipend.month} has been generated and is ready for your review and approval.

Please find the detailed invoice attached.

Please log in to the IMS portal to approve it.

Thanks,
HR Department"""
        
        return EmailService.send_email(
            to_email=intern_user.email,
            subject=subject,
            body=body,
            attachments=attachments # Pass attachments to the main sender
        )

    @staticmethod
    def send_stipend_intern_approval_notification_to_hr(intern_user, hr_user, stipend, attachments = None):
        """Send notification to HR when an intern approves their stipend."""
        subject = f"Stipend Approved by Intern: {intern_user.name}"
        body = f"""Hi {hr_user.name},

The intern {intern_user.name} has reviewed and approved their stipend for the month of {stipend.month}.

It is now pending your final approval. Please log in to the IMS portal to proceed.

Thanks,
IMS System"""
        
        return EmailService.send_email(
            to_email=hr_user.email,
            subject=subject,
            body=body,
            attachments=attachments
        )

    @staticmethod
    def send_stipend_hr_approval_notification_to_hod(intern_user, hod_user, stipend, attachments = None):
        """Send notification to HOD when HR approves a stipend."""
        subject = f"Stipend Action Required: {intern_user.name} for {stipend.month}"
        body = f"""Hi {hod_user.name},

The stipend for the intern {intern_user.name} for the month of {stipend.month} has been approved by HR.

It is now pending your final approval. Please log in to the IMS portal to review and take action.

Thanks,
IMS System"""
        
        return EmailService.send_email(
            to_email=hod_user.email,
            subject=subject,
            body=body,
            attachments=attachments
        )