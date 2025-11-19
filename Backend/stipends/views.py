import io
from datetime import datetime
import base64 

from django.http import HttpResponse
from openpyxl import Workbook
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.models import User
from .models import Stipend
from .serializers import StipendSerializer

# --- 1. ADD THESE IMPORTS ---
from notifications.email_service import EmailService
import logging
logger = logging.getLogger(__name__)
# -----------------------------


class StipendViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Stipend model.
    """
    queryset = Stipend.objects.all()
    serializer_class = StipendSerializer
    permission_classes = [IsAuthenticated]

    # # --- 2. ADD THIS METHOD TO HANDLE EMAIL ON CREATION ---
    # def perform_create(self, serializer):
    #     # First, save the stipend object
    #     stipend = serializer.save()
        
    #     # Now, send the email notification to the intern
    #     try:
    #         intern_user = stipend.intern.user
    #         EmailService.send_stipend_creation_notification_to_intern(intern_user, stipend)
    #         logger.info(f"Stipend creation email sent to {intern_user.email}")
    #     except Exception as e:
    #         # Log the error but don't crash the request if email fails
    #         logger.error(f"Failed to send stipend creation email for stipend {stipend.id}: {e}")
    # # ----------------------------------------------------

     # V V V ADD THIS NEW METHOD HERE V V V
    @action(detail=True, methods=['post'])
    def send_creation_email(self, request, pk=None):
        """
        Receives a base64 encoded PDF from the frontend and emails it to the intern.
        """
        stipend = self.get_object()
        
        pdf_data_uri = request.data.get('pdf_data_uri')
        
        if not pdf_data_uri:
            return Response({'error': 'PDF data URI is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Decode the base64 string from the frontend
            header, encoded = pdf_data_uri.split(',', 1)
            pdf_content = base64.b64decode(encoded)
            
            intern_user = stipend.intern.user
            
            # Create the attachment tuple for the email service
            attachments = [
                (f'Stipend-Invoice-{stipend.month}.pdf', pdf_content, 'application/pdf')
            ]

            # Call the email service with the PDF attachment
            success = EmailService.send_stipend_creation_notification_to_intern(
                intern_user, 
                stipend, 
                attachments=attachments
            )
            
            if success:
                logger.info(f"Stipend creation email with PDF invoice sent to {intern_user.email}")
                return Response({'message': 'Email sent successfully.'})
            else:
                logger.error(f"Failed to send stipend creation email for stipend {stipend.id}")
                return Response({'error': 'Failed to send email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            logger.error(f"Error processing PDF for stipend {stipend.id}: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    # ^ ^ ^ END OF THE NEW METHOD ^ ^ ^

    def get_queryset(self):
        """
        Return stipends filtered by user role.
        """
        # ... (this method remains unchanged)
        user = self.request.user

        if not user.is_authenticated:
            return Stipend.objects.none()

        if user.role in [User.Role.HR, User.Role.HOD]:
            return Stipend.objects.select_related(
                'intern',
                'intern__user',
                'intern__user__department',
                'intern__mentor'
            ).all()
        elif user.role == User.Role.MENTOR:
            return Stipend.objects.select_related(
                'intern',
                'intern__user',
                'intern__user__department',
                'intern__mentor'
            ).filter(intern__mentor=user)
        elif user.role == User.Role.INTERN:
            return Stipend.objects.select_related(
                'intern',
                'intern__user',
                'intern__user__department',
                'intern__mentor'
            ).filter(intern__user=user)
        else:
            return Stipend.objects.none()

    @action(detail=False, methods=['get'])
    def download_excel(self, request):
        # ... (this method remains unchanged)
        month = request.query_params.get('month', None)
        if not month:
            return Response(
                {'error': 'Month parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        queryset = self.get_queryset().filter(month=month)
        workbook = Workbook()
        worksheet = workbook.active
        worksheet.title = f"Stipends_{month}"
        headers = [
            "Intern Name", "Month", "Amount", "Working Days", "Leaves Taken",
            "Intern Approval", "HR Approval", "HOD Approval", "Comments"
        ]
        worksheet.append(headers)
        for stipend in queryset:
            try:
                month_obj = datetime.strptime(stipend.month, "%Y-%m")
                formatted_month = month_obj.strftime("%B %Y")
            except (ValueError, TypeError):
                formatted_month = stipend.month
            row = [
                stipend.intern.user.name if stipend.intern and stipend.intern.user else 'N/A',
                formatted_month,
                stipend.amount,
                stipend.working_days,
                stipend.leaves_taken,
                stipend.intern_approval,
                stipend.hr_approval,
                stipend.hod_approval,
                stipend.comments
            ]
            worksheet.append(row)
        mem_file = io.BytesIO()
        workbook.save(mem_file)
        mem_file.seek(0)
        response = HttpResponse(
            mem_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="stipends_{month}.xlsx"'
        return response

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve a stipend (intern, HR, or HOD action).
        """
        stipend = self.get_object()
        user = request.user

        if user.role == User.Role.INTERN:
            if stipend.intern.user != user:
                return Response({'error': 'You can only approve your own stipend'}, status=status.HTTP_403_FORBIDDEN)
            stipend.intern_approval = 'Approved'
            signature_url = request.data.get('signature_url')
            if signature_url:
                stipend.intern_signature_url = signature_url
            
            stipend.save() # Save before sending email

            # --- MODIFIED: Logic to receive and attach PDF ---
            try:
                hr_user = User.objects.filter(role=User.Role.HR).first()
                if hr_user:
                    attachments = None
                    # Check if the frontend sent the PDF data
                    pdf_data_uri = request.data.get('pdf_data_uri')
                    if pdf_data_uri:
                        try:
                            # Decode the PDF and prepare it for attachment
                            header, encoded = pdf_data_uri.split(',', 1)
                            pdf_content = base64.b64decode(encoded)
                            attachments = [(f'Invoice-{stipend.month}-Approved.pdf', pdf_content, 'application/pdf')]
                        except Exception as e:
                            logger.error(f"Failed to decode PDF during intern approval for stipend {stipend.id}: {e}")
                    
                    # Call the email service, passing the attachments
                    EmailService.send_stipend_intern_approval_notification_to_hr(
                        stipend.intern.user, 
                        hr_user, 
                        stipend,
                        attachments=attachments # Pass the attachments here
                    )
                    logger.info(f"Intern approval email sent to HR {hr_user.email}")
                else:
                    logger.warning("No HR user found to send stipend approval notification to.")
            except Exception as e:
                logger.error(f"Failed to send intern approval email for stipend {stipend.id}: {e}")
            # --- END OF MODIFICATION ---

        elif user.role == User.Role.HR:
            # ... (The HR approval logic remains unchanged)
            stipend.hr_approval = 'Approved'
            stipend.save() # Save before sending email

            try:
                hod_user = stipend.intern.user.department.hod
                if hod_user:
                    EmailService.send_stipend_hr_approval_notification_to_hod(stipend.intern.user, hod_user, stipend)
                    logger.info(f"HR approval email sent to HOD {hod_user.email}")
                else:
                    logger.warning(f"No HOD found for department {stipend.intern.user.department} to send stipend approval notification to.")
            except Exception as e:
                logger.error(f"Failed to send HR approval email for stipend {stipend.id}: {e}")

        elif user.role == User.Role.HOD:
            stipend.hod_approval = 'Approved'
            stipend.save()
        else:
            return Response({'error': 'You do not have permission to approve stipends'}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(stipend)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        # ... (this method remains unchanged)
        stipend = self.get_object()
        user = request.user
        if user.role == User.Role.INTERN:
            stipend.intern_approval = 'Rejected'
        elif user.role == User.Role.HR:
            stipend.hr_approval = 'Rejected'
        elif user.role == User.Role.HOD:
            stipend.hod_approval = 'Rejected'
        else:
            return Response({'error': 'You do not have permission to reject stipends'}, status=status.HTTP_403_FORBIDDEN)
        stipend.save()
        serializer = self.get_serializer(stipend)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_approve(self, request):
        # ... (this method remains unchanged)
        user = request.user
        if user.role not in [User.Role.HR, User.Role.HOD]:
            return Response({'error': 'Only HR or HOD can bulk approve stipends'}, status=status.HTTP_403_FORBIDDEN)
        stipend_ids = request.data.get('stipend_ids', [])
        if not stipend_ids:
            return Response({'error': 'stipend_ids is required'}, status=status.HTTP_400_BAD_REQUEST)
        if user.role == User.Role.HR:
            updated_count = Stipend.objects.filter(id__in=stipend_ids).update(hr_approval='Approved')
        else:
            updated_count = Stipend.objects.filter(id__in=stipend_ids).update(hod_approval='Approved')
        return Response({'message': f'Successfully approved {updated_count} stipends', 'updated_count': updated_count})