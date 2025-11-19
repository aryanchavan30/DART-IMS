import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import apiService from '../services/apiService';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import { useToast } from '../hooks/useToast';
import { Intern } from '../types';

// Define the possible attendance statuses
type AttendanceStatus = 'Present' | 'Absent' | 'Half Day' | 'Holiday' | 'Week Off';

// Interface for a single attendance record
interface AttendanceRecord {
  id: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  marked_by_name?: string;
  has_pending_ticket?: boolean;
}

// Interface for attendance ticket
interface AttendanceTicket {
  id: string;
  attendance: string;
  attendance_date: string;
  current_status: string;
  intern_name: string;
  intern_email: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requested_status: string;
  review_comments?: string;
  created_at: string;
}

const AttendanceHistory = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [interns, setInterns] = useState<Intern[]>([]);
  const [selectedIntern, setSelectedIntern] = useState<string>('');
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [allTickets, setAllTickets] = useState<AttendanceTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInterns, setLoadingInterns] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>('Present');
  const [notes, setNotes] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<AttendanceTicket | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const { showToast } = useToast();

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
  const startingDayIndex = getDay(firstDayOfMonth);

  // Fetch all interns
  const fetchInterns = async () => {
    try {
      setLoadingInterns(true);
      const data = await apiService.getInterns();
      // Filter only active interns
      const activeInterns = data.filter((intern: Intern) => intern.status === 'Active');
      setInterns(activeInterns);

      // Auto-select first intern if available
      if (activeInterns.length > 0 && !selectedIntern) {
        setSelectedIntern(activeInterns[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch interns:', error);
      showToast('Failed to load interns', 'error');
    } finally {
      setLoadingInterns(false);
    }
  };

  // Fetch attendance for selected intern
  const fetchAttendance = async () => {
    if (!selectedIntern) return;

    try {
      setLoading(true);
      const monthStr = format(currentMonth, 'yyyy-MM');
      const data = await apiService.getAttendance({ intern_id: selectedIntern, month: monthStr });

      const attendanceMap = new Map<string, AttendanceRecord>();
      data.forEach((record: any) => {
        attendanceMap.set(record.date, {
          id: record.id,
          date: record.date,
          status: record.status,
          notes: record.notes,
          marked_by_name: record.marked_by_name,
          has_pending_ticket: record.has_pending_ticket,
        });
      });

      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      showToast('Failed to load attendance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all pending tickets
  const fetchAllTickets = async () => {
    try {
      const data = await apiService.getPendingAttendanceTickets();
      setAllTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };

  useEffect(() => {
    fetchInterns();
    fetchAllTickets();
  }, []);

  useEffect(() => {
    if (selectedIntern) {
      fetchAttendance();
    }
  }, [selectedIntern, currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const openEditModal = (date: string) => {
    const record = attendance.get(date);
    if (record) {
      setSelectedAttendance(record);
      setNewStatus(record.status);
      setNotes(record.notes || '');
    } else {
      // Create new attendance record
      setSelectedAttendance({
        id: '',
        date,
        status: 'Present',
        notes: '',
      });
      setNewStatus('Present');
      setNotes('');
    }
    setShowEditModal(true);
  };

  const handleUpdateAttendance = async () => {
    if (!selectedIntern || !selectedAttendance) return;

    try {
      if (selectedAttendance.id) {
        // Update existing attendance
        await apiService.updateAttendanceStatus(selectedAttendance.id, newStatus, notes);
        showToast('Attendance updated successfully', 'success');
      } else {
        // Create new attendance
        await apiService.markAttendance(selectedAttendance.date, newStatus, selectedIntern, notes);
        showToast('Attendance created successfully', 'success');
      }

      setShowEditModal(false);
      fetchAttendance();
      fetchAllTickets(); // Refresh tickets in case status changed
    } catch (error: any) {
      console.error('Failed to update attendance:', error);
      showToast(error.message || 'Failed to update attendance', 'error');
    }
  };

  const openTicketReviewModal = (ticket: AttendanceTicket) => {
    setSelectedTicket(ticket);
    setReviewComments('');
    setShowTicketModal(true);
  };

  const handleReviewTicket = async (approved: boolean) => {
    if (!selectedTicket) return;

    try {
      await apiService.reviewAttendanceTicket(selectedTicket.id, approved, reviewComments);
      showToast(
        approved ? 'Ticket approved successfully' : 'Ticket rejected successfully',
        'success'
      );
      setShowTicketModal(false);
      fetchAttendance();
      fetchAllTickets();
    } catch (error: any) {
      console.error('Failed to review ticket:', error);
      showToast(error.message || 'Failed to review ticket', 'error');
    }
  };

  const getDayStatus = (day: Date): AttendanceStatus | 'Pending' => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const record = attendance.get(dateStr);

    if (record) {
      return record.status;
    }

    // Check if it's a weekend
    const dayOfWeek = getDay(day);
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 'Week Off';
    }

    // Check if it's in the future
    if (day > new Date()) {
      return 'Pending';
    }

    // Past dates without records are considered absent
    return 'Absent';
  };

  const getStatusColor = (status: AttendanceStatus | 'Pending'): string => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      case 'Half Day':
        return 'bg-yellow-100 text-yellow-800';
      case 'Holiday':
      case 'Week Off':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedInternData = interns.find((i) => i.id === selectedIntern);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Intern Attendance Management</h1>
      </div>

      {/* Intern Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Intern
          </label>
          {loadingInterns ? (
            <div className="text-gray-500">Loading interns...</div>
          ) : (
            <Select
              value={selectedIntern}
              onChange={(e) => setSelectedIntern(e.target.value)}
            >
              <option value="">-- Select an intern --</option>
              {interns.map((intern) => (
                <option key={intern.id} value={intern.id}>
                  {intern.userName || intern.userEmail} - {intern.departmentName || 'No Department'}
                </option>
              ))}
            </Select>
          )}
        </div>

        {selectedInternData && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-900">Selected Intern Details</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>{' '}
                <span className="font-medium">{selectedInternData.userName}</span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>{' '}
                <span className="font-medium">{selectedInternData.userEmail}</span>
              </div>
              <div>
                <span className="text-gray-600">Department:</span>{' '}
                <span className="font-medium">{selectedInternData.departmentName}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>{' '}
                <span className="font-medium">{selectedInternData.status}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attendance Calendar */}
      {selectedIntern && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPreviousMonth}
                className="p-2 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Day labels */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="font-semibold text-center text-gray-600 py-2">
                  {day}
                </div>
              ))}

              {/* Empty cells for the start of the month */}
              {Array.from({ length: startingDayIndex }).map((_, index) => (
                <div key={`empty-${index}`} className="border rounded-md bg-gray-50"></div>
              ))}

              {/* Calendar days */}
              {daysInMonth.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const record = attendance.get(dateStr);
                const dayStatus = getDayStatus(day);
                const isCurrentDay = isToday(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isPast = day <= new Date();
                const canEdit = isPast && dayStatus !== 'Week Off';

                return (
                  <div
                    key={day.toString()}
                    className={`p-3 border rounded-md flex flex-col items-center justify-center min-h-[120px] relative cursor-pointer hover:border-blue-300 transition-colors ${
                      isCurrentDay ? 'border-2 border-blue-500 bg-blue-50' : ''
                    } ${!isCurrentMonth ? 'text-gray-400 bg-gray-50' : 'bg-white'}`}
                    onClick={() => canEdit && openEditModal(dateStr)}
                  >
                    <span className="font-medium text-sm">{format(day, 'd')}</span>

                    <div className="mt-2 text-xs">
                      <span className={`px-2 py-1 rounded-full ${getStatusColor(dayStatus)}`}>
                        {dayStatus}
                      </span>
                    </div>

                    {record?.has_pending_ticket && (
                      <div className="mt-1 text-xs text-orange-600 font-semibold">
                        <« Ticket
                      </div>
                    )}

                    {record?.marked_by_name && (
                      <div className="mt-1 text-xs text-gray-500 text-center">
                        By: {record.marked_by_name}
                      </div>
                    )}

                    {canEdit && (
                      <div className="mt-2 text-xs text-blue-600 font-medium">
                        Click to edit
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pending Tickets Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Pending Correction Tickets ({allTickets.length})
          </h2>
          <Button variant="secondary" onClick={fetchAllTickets}>
            Refresh
          </Button>
        </div>

        {allTickets.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No pending tickets</p>
        ) : (
          <div className="space-y-3">
            {allTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 border border-orange-300 bg-orange-50 rounded-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {ticket.intern_name} ({ticket.intern_email})
                    </p>
                    <p className="text-sm text-gray-600">
                      Date: {format(parseISO(ticket.attendance_date), 'dd MMM yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Current: <span className="font-medium text-red-600">{ticket.current_status}</span> ’
                      Requested: <span className="font-medium text-green-600">{ticket.requested_status}</span>
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-200 text-orange-800">
                    {ticket.status}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  <span className="font-semibold">Reason:</span> {ticket.reason}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Submitted: {format(parseISO(ticket.created_at), 'dd MMM yyyy, hh:mm a')}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={() => openTicketReviewModal(ticket)}
                    size="sm"
                  >
                    Review Ticket
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Attendance Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={selectedAttendance?.id ? 'Edit Attendance' : 'Mark Attendance'}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Date:{' '}
            <span className="font-semibold">
              {selectedAttendance && format(parseISO(selectedAttendance.date), 'dd MMMM yyyy')}
            </span>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attendance Status<span className="text-red-500">*</span>
            </label>
            <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value as AttendanceStatus)}>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Half Day">Half Day</option>
              <option value="Holiday">Holiday</option>
              <option value="Week Off">Week Off</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this attendance record..."
              rows={3}
            />
          </div>

          {selectedAttendance?.marked_by_name && (
            <div className="text-xs text-gray-500">
              Last updated by: {selectedAttendance.marked_by_name}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateAttendance}>
              {selectedAttendance?.id ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Ticket Modal */}
      <Modal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        title="Review Attendance Correction Ticket"
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Intern:</span>{' '}
                  <span className="font-medium">{selectedTicket.intern_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>{' '}
                  <span className="font-medium">
                    {format(parseISO(selectedTicket.attendance_date), 'dd MMM yyyy')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Current Status:</span>{' '}
                  <span className="font-medium text-red-600">{selectedTicket.current_status}</span>
                </div>
                <div>
                  <span className="text-gray-600">Requested Status:</span>{' '}
                  <span className="font-medium text-green-600">{selectedTicket.requested_status}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Reason for Correction:</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedTicket.reason}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Comments (Optional)
              </label>
              <Textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Add comments about your decision..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowTicketModal(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleReviewTicket(false)}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                onClick={() => handleReviewTicket(true)}
              >
                Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AttendanceHistory;
