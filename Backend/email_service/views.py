from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings

@api_view(['POST'])
@permission_classes([AllowAny])
def send_email(request):
    """
    Send a simple email
    """
    try:
        to = request.data.get('to')
        subject = request.data.get('subject', 'No Subject')
        body = request.data.get('body', '')
        cc = request.data.get('cc')

        if not to:
            return Response(
                {'error': 'to field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # For now, just log the email instead of actually sending
        # In production, you would configure SMTP settings
        print(f"""
========== EMAIL ==========
To: {to}
{'(CC: ' + cc + ')' if cc else ''}
Subject: {subject}
Body:
{body}
===========================
""")

        # Uncomment the below lines to actually send emails (requires SMTP setup)
        send_mail(
            subject=subject,
            message=body,
            from_email='bpm@solargroup.com',
            recipient_list=[to] + ([cc] if cc else []),
            fail_silently=False,
        )

        return Response({'message': 'Email logged successfully'})

    except Exception as e:
        return Response(
            {'error': f'Failed to send email: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def send_notification_email(request):
    """
    Send a notification email based on type
    """
    try:
        notification_type = request.data.get('type')
        data = request.data.get('data', {})

        if not notification_type:
            return Response(
                {'error': 'type field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate email content based on notification type
        subject, body = generate_email_content(notification_type, data)

        # Get recipient email
        to = data.get('approver_email') or data.get('mentor_email') or data.get('hod_email') or data.get('intern_email')

        if not to:
            return Response(
                {'error': 'No recipient email found in data'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Log the notification
        print(f"""
========== NOTIFICATION ==========
Type: {notification_type}
To: {to}
Subject: {subject}
Body:
{body}
=================================
""")
        

        return Response({'message': 'Notification sent successfully'})

    except Exception as e:
        return Response(
            {'error': f'Failed to send notification: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def generate_email_content(notification_type, data):
    """Generate email subject and body based on notification type"""

    subjects = {
        'mentor_interview': 'New Interview Assignment',
        'hod_assessment': 'New Assessment Review Required',
        'selection': 'Candidate Selection - Action Required',
        'stipend_approval': 'Stipend Approval Required',
        'leave_request': 'New Leave Request',
        'leave_status': 'Leave Request Status Update',
        'exit_approval': 'Exit Request Approval Required',
        'extension_approval': 'Extension Request Approval Required',
        'extension_status': 'Extension Request Status Update',
    }

    base_subject = subjects.get(notification_type, 'Notification')

    # Generate body based on type
    if notification_type == 'stipend_approval':
        subject = f"{base_subject}: {data.get('intern_name')} - {data.get('month')}"
        body = f"""
Dear {data.get('approver_name')},

A stipend approval is required for the following:
- Intern: {data.get('intern_name')}
- Month: {data.get('month')}

Please review and approve the stipend in the IMS system.

Best regards,
IMS System
"""
    elif notification_type == 'leave_request':
        subject = f"{base_subject}: {data.get('intern_name')}"
        body = f"""
Dear Team,

A new leave request has been submitted:
- Intern: {data.get('intern_name')}
- From: {data.get('start_date')}
- To: {data.get('end_date')}
- Type: {data.get('leave_type')}
- Reason: {data.get('reason')}

Please review and take appropriate action.

Best regards,
IMS System
"""
    elif notification_type == 'extension_approval':
        subject = f"{base_subject}: {data.get('intern_name')}"
        body = f"""
Dear {data.get('approver_name')},

An extension approval is required for:
- Intern: {data.get('intern_name')}

Please review and approve the extension request in the IMS system.

Best regards,
IMS System
"""
    else:
        subject = base_subject
        body = f"""
This is a notification from the IMS system.

Type: {notification_type}
Data: {data}

Best regards,
IMS System
"""

    return subject, body
