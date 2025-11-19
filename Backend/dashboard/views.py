from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q, Sum
from candidates.models import Candidate
from interns.models import Intern
from users.models import User
from departments.models import Department
from stipends.models import Stipend
from datetime import datetime, timedelta
import calendar


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Get dashboard statistics for the current user.
    Returns role-specific statistics.
    """
    user = request.user

    # Base statistics that apply to all roles
    stats = {
        'total_candidates': Candidate.objects.count(),
        'total_interns': Intern.objects.count(),
        'total_departments': Department.objects.count(),
        'total_users': User.objects.count(),
    }

    # Candidate status breakdown
    candidate_statuses = Candidate.objects.values('status').annotate(
        count=Count('status')
    )
    stats['candidate_status_breakdown'] = {
        item['status']: item['count'] for item in candidate_statuses
    }

    # Intern status breakdown
    intern_statuses = Intern.objects.values('status').annotate(
        count=Count('status')
    )
    stats['intern_status_breakdown'] = {
        item['status']: item['count'] for item in intern_statuses
    }

    # Role-specific statistics
    if user.role == User.Role.HR:
        # HR can see all pending approvals and recent activity
        stats['pending_assignments'] = Candidate.objects.filter(
            status='Pending Mentor Assignment'
        ).count()
        stats['pending_interviews'] = Candidate.objects.filter(
            status='Pending Interview Assessment'
        ).count()
        stats['pending_hod_approval'] = Candidate.objects.filter(
            status='Pending HOD Approval'
        ).count()

    elif user.role == User.Role.HOD:
        # HOD can see candidates in their departments
        hod_departments = Department.objects.filter(hod=user.id)
        hod_dept_ids = [dept.id for dept in hod_departments]

        stats['my_departments'] = hod_departments.count()
        stats['pending_hod_approval'] = Candidate.objects.filter(
            status='Pending HOD Approval',
            department__in=hod_dept_ids
        ).count()
        stats['my_interns'] = Intern.objects.filter(
            department__in=hod_dept_ids
        ).count()

    elif user.role == User.Role.MENTOR:
        # Mentors can see their assigned candidates
        stats['assigned_candidates'] = Candidate.objects.filter(
            assigned_mentor=user.id
        ).count()
        stats['pending_interviews'] = Candidate.objects.filter(
            assigned_mentor=user.id,
            status='Pending Interview Assessment'
        ).count()

    elif user.role == User.Role.INTERN:
        # Interns can see basic info
        intern_profile = Intern.objects.filter(user=user.id).first()
        if intern_profile:
            stats['my_intern_id'] = intern_profile.id
            stats['my_mentor'] = intern_profile.mentor.name if intern_profile.mentor else None

    # Recent activity (last 30 days)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    stats['recent_activity'] = {
        'new_candidates_last_30_days': Candidate.objects.filter(
            created_at__gte=thirty_days_ago
        ).count(),
        'new_interns_last_30_days': Intern.objects.filter(
            created_at__gte=thirty_days_ago
        ).count(),
    }

    # Monthly stipend statistics for current year
    try:
        from django.db.models.functions import ExtractMonth
        current_year = datetime.now().year
        monthly_stipends = Stipend.objects.filter(
            created_at__year=current_year
        ).annotate(
            month_num=ExtractMonth('month')
        ).values('month_num').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        )

        stats['monthly_stipends'] = {
            str(item['month_num']): {
                'count': item['count'],
                'total_amount': float(item['total_amount']) if item['total_amount'] else 0
            }
            for item in monthly_stipends
        }
    except Exception as e:
        stats['monthly_stipends'] = {}

    return Response(stats, status=status.HTTP_200_OK)
