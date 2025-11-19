import React, { useState } from 'react';
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
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

// Define the possible attendance statuses
type AttendanceStatus = 'Present' | 'Absent' | 'Holiday' | 'Pending';

// Interface for a single attendance record
interface AttendanceRecord {
  date: Date;
  status: AttendanceStatus;
}

// Helper function to generate dummy attendance data
const generateDummyData = (date: Date): AttendanceRecord[] => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return days.map((day) => {
    // Mark weekends as holidays
    const dayOfWeek = getDay(day);
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      return { date: day, status: 'Holiday' };
    }
    // Simulate some past attendance data for the current month
    if (day < new Date() && !isToday(day)) {
        return { date: day, status: Math.random() > 0.5 ? 'Present' : 'Absent' };
    }
    return { date: day, status: 'Pending' };
  });
};


const Attendance = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(generateDummyData(currentMonth));

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
  const startingDayIndex = getDay(firstDayOfMonth); // 0 = Sunday, 1 = Monday, etc.


  const goToPreviousMonth = () => {
    const previousMonth = subMonths(currentMonth, 1);
    setCurrentMonth(previousMonth);
    setAttendance(generateDummyData(previousMonth));
  };


  const goToNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    setCurrentMonth(nextMonth);
    setAttendance(generateDummyData(nextMonth));
  };

  const markPresent = (date: Date) => {
    const updatedAttendance = attendance.map(record =>
      record.date.toDateString() === date.toDateString()
        ? { ...record, status: 'Present' }
        : record
    );
    setAttendance(updatedAttendance);
    // Here you would also make an API call to save this to the backend
    console.log(`Marked ${format(date, 'yyyy-MM-dd')} as Present`);
  };

  // Helper function to get status color
  const getStatusColor = (status: AttendanceStatus): string => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      case 'Holiday':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day labels */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="font-semibold text-center text-gray-600">
            {day}
          </div>
        ))}

        {/* Empty cells for the start of the month */}
        {Array.from({ length: startingDayIndex }).map((_, index) => (
          <div key={`empty-${index}`} className="border rounded-md"></div>
        ))}

        {/* Calendar days */}
        {daysInMonth.map((day) => {
          const dayAttendance = attendance.find(a => a.date.toDateString() === day.toDateString());
          const isCurrentDay = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);


          return (
            <div
              key={day.toString()}
              className={`p-2 border rounded-md flex flex-col items-center justify-center min-h-[100px] ${
                isCurrentDay ? 'border-2 border-blue-500' : ''
              } ${!isCurrentMonth ? 'text-gray-400' : ''}`}
            >
              <span className="font-medium">{format(day, 'd')}</span>
              {dayAttendance && (
                <div className="mt-2 text-sm">
                  <span className={`px-2 py-1 rounded-full ${getStatusColor(dayAttendance.status)}`}>
                    {dayAttendance.status}
                  </span>
                </div>
              )}
              {isCurrentDay && dayAttendance?.status === 'Pending' && (
                 <button
                 onClick={() => markPresent(day)}
                 className="mt-2 px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600"
               >
                 Mark Present
               </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


export default Attendance;