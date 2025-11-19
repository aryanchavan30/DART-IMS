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
  isFuture,
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import apiService from '../services/apiService';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';
import { useToast } from '../hooks/useToast';

// Define the possible attendance statuses
type AttendanceStatus = 'Present' | 'Absent' | 'Half Day' | 'Holiday' | 'Week Off' | 'Pending';

// Interface for a single attendance record
interface AttendanceRecord {
  id: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  has_pending_ticket?: boolean;
}

// Interface for attendance ticket
interface AttendanceTicket {
  id: string;
  attendance: string;
  attendance_date: string;
  current_status: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requested_status: string;
  review_comments?: string;
  created_at: string;
}


const Attendance = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [tickets, setTickets] = useState<AttendanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [ticketReason, setTicketReason] = useState('');
  const { showToast } = useToast();

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
  const startingDayIndex = getDay(firstDayOfMonth);

  // Fetch attendance data
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const monthStr = format(currentMonth, 'yyyy-MM');
      const data = await apiService.getMyAttendance(monthStr);

      const attendanceMap = new Map<string, AttendanceRecord>();
      data.forEach((record: any) => {
        attendanceMap.set(record.date, {
          id: record.id,
          date: record.date,
          status: record.status,
          notes: record.notes,
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

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      const data = await apiService.getMyAttendanceTickets();
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchTickets();
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const markPresent = async (date: Date) => {
    try {
      await apiService.markTodayAttendance();
      showToast('Attendance marked successfully', 'success');
      fetchAttendance();
    } catch (error: any) {
      console.error('Failed to mark attendance:', error);
      showToast(error.message || 'Failed to mark attendance', 'error');
    }
  };

  const openTicketModal = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = attendance.get(dateStr);

    if (!record) {
      showToast('No attendance record found for this date', 'error');
      return;
    }

    if (record.has_pending_ticket) {
      showToast('A pending ticket already exists for this date', 'warning');
      return;
    }

    setSelectedDate(date);
    setTicketReason('');
    setShowTicketModal(true);
  };

  const submitTicket = async () => {
    if (!selectedDate) return;

    if (!ticketReason.trim()) {
      showToast('Please provide a reason', 'error');
      return;
    }

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const record = attendance.get(dateStr);

      if (!record) {
        showToast('No attendance record found', 'error');
        return;
      }

      await apiService.createAttendanceTicket(record.id, ticketReason, 'Present');
      showToast('Ticket submitted successfully', 'success');
      setShowTicketModal(false);
      setTicketReason('');
      fetchAttendance();
      fetchTickets();
    } catch (error: any) {
      console.error('Failed to submit ticket:', error);
      showToast(error.message || 'Failed to submit ticket', 'error');
    }
  };

  const getDayStatus = (day: Date): AttendanceStatus => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const record = attendance.get(dateStr);

    if (record) {
      return record.status;
    }

    const dayOfWeek = getDay(day);
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 'Week Off';
    }

    if (isFuture(day)) {
      return 'Pending';
    }

    return 'Absent';
  };

  const getStatusColor = (status: AttendanceStatus): string => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
      </div>

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
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="font-semibold text-center text-gray-600 py-2">
                {day}
              </div>
            ))}

            {Array.from({ length: startingDayIndex }).map((_, index) => (
              <div key={`empty-${index}`} className="border rounded-md bg-gray-50"></div>
            ))}

            {daysInMonth.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const record = attendance.get(dateStr);
              const dayStatus = getDayStatus(day);
              const isCurrentDay = isToday(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const canMarkPresent = isCurrentDay && dayStatus !== 'Present';
              const canRaiseTicket = dayStatus === 'Absent' && !isFuture(day) && !record?.has_pending_ticket;

              return (
                <div
                  key={day.toString()}
                  className={`p-3 border rounded-md flex flex-col items-center justify-center min-h-[100px] relative ${
                    isCurrentDay ? 'border-2 border-blue-500 bg-blue-50' : ''
                  } ${!isCurrentMonth ? 'text-gray-400 bg-gray-50' : 'bg-white'}`}
                >
                  <span className="font-medium text-sm">{format(day, 'd')}</span>

                  <div className="mt-2 text-xs">
                    <span className={`px-2 py-1 rounded-full ${getStatusColor(dayStatus)}`}>
                      {dayStatus}
                    </span>
                  </div>

                  {record?.has_pending_ticket && (
                    <div className="mt-1 text-xs text-orange-600 font-semibold">
                      Ticket Pending
                    </div>
                  )}

                  <div className="mt-2 flex flex-col gap-1 w-full">
                    {canMarkPresent && (
                      <button
                        onClick={() => markPresent(day)}
                        className="px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
                      >
                        Mark Present
                      </button>
                    )}
                    {canRaiseTicket && (
                      <button
                        onClick={() => openTicketModal(day)}
                        className="px-2 py-1 text-xs text-white bg-orange-500 rounded hover:bg-orange-600 transition-colors"
                      >
                        Raise Ticket
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">My Tickets</h2>

        {tickets.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tickets raised yet</p>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`p-4 border rounded-lg ${
                  ticket.status === 'Pending'
                    ? 'border-orange-300 bg-orange-50'
                    : ticket.status === 'Approved'
                    ? 'border-green-300 bg-green-50'
                    : 'border-red-300 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Date: {format(parseISO(ticket.attendance_date), 'dd MMM yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Current Status: <span className="font-medium">{ticket.current_status}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Requested: <span className="font-medium">{ticket.requested_status}</span>
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      ticket.status === 'Pending'
                        ? 'bg-orange-200 text-orange-800'
                        : ticket.status === 'Approved'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Reason:</span> {ticket.reason}
                </p>
                {ticket.review_comments && (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Review:</span> {ticket.review_comments}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Submitted: {format(parseISO(ticket.created_at), 'dd MMM yyyy, hh:mm a')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        title="Raise Attendance Correction Ticket"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Request correction for:{' '}
            <span className="font-semibold">
              {selectedDate && format(selectedDate, 'dd MMMM yyyy')}
            </span>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for correction<span className="text-red-500">*</span>
            </label>
            <Textarea
              value={ticketReason}
              onChange={(e) => setTicketReason(e.target.value)}
              placeholder="Please explain why you were marked absent incorrectly..."
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowTicketModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submitTicket}
            >
              Submit Ticket
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Attendance;