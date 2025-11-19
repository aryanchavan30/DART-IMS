import React from 'react';
import { ApprovalStatus, CandidateStatus, InternStatus } from '../../types';

interface BadgeProps {
  status: string;
}

const statusColors: { [key: string]: string } = {
  // CandidateStatus
  [CandidateStatus.PENDING_ASSIGNMENT]: 'bg-light-blue text-secondary-blue',
  [CandidateStatus.PENDING_INTERVIEW]: 'bg-light-blue text-secondary-blue',
  [CandidateStatus.PENDING_HOD_APPROVAL]: 'bg-light-blue text-secondary-blue',
  [CandidateStatus.PENDING_MHR_APPROVAL]: 'bg-light-blue text-secondary-blue',
  [CandidateStatus.SELECTED]: 'bg-secondary-blue text-white font-semibold',
  [CandidateStatus.ONBOARDED]: 'bg-secondary-blue text-white',
  [CandidateStatus.REJECTED]: 'bg-primary-red/20 text-primary-red',
  // InternStatus
  [InternStatus.ACTIVE]: 'bg-secondary-blue text-white',
  [InternStatus.COMPLETED]: 'bg-primary-navy text-light-gray',
  [InternStatus.LEFT]: 'bg-dark-red/20 text-dark-red',
  // ApprovalStatus
  [ApprovalStatus.PENDING]: 'bg-light-blue text-secondary-blue',
  [ApprovalStatus.APPROVED]: 'bg-secondary-blue text-white',
  // FIX: Removed duplicate key for 'Rejected' status.
  // The `[ApprovalStatus.REJECTED]` key resolves to the same string as `[CandidateStatus.REJECTED]`, which was causing an error.
};

const Badge: React.FC<BadgeProps> = ({ status }) => {
  const colorClass = statusColors[status] || 'bg-gray-200 text-gray-800';
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full inline-block whitespace-nowrap leading-tight ${colorClass}`}>
      {status}
    </span>
  );
};

export default Badge;
