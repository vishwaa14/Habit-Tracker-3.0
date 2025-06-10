"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { habitService } from '@/services/habitService';
import { HabitEntry } from '@/services/types'; // Using HabitEntry type from service
import { addMonths, startOfMonth, endOfMonth, formatISO, parseISO } from 'date-fns'; // date-fns for date manipulation

interface HabitCalendarProps {
  habitId: string;
  userId: string;
  onEntryLogged: () => void; // Callback to refresh parent data (e.g., streak)
}

const HabitCalendar: React.FC<HabitCalendarProps> = ({ habitId, userId, onEntryLogged }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntriesForMonth = useCallback(async (month: Date) => {
    setIsLoading(true);
    setError(null);
    const startDate = formatISO(startOfMonth(month), { representation: 'date' });
    const endDate = formatISO(endOfMonth(month), { representation: 'date' });
    try {
      const fetchedEntries = await habitService.getHabitEntries(userId, habitId, startDate, endDate);
      setEntries(fetchedEntries);
    } catch (err) {
      console.error("Failed to fetch entries:", err);
      setError(err instanceof Error ? err.message : "Could not load entries for this month.");
    } finally {
      setIsLoading(false);
    }
  }, [userId, habitId]);

  useEffect(() => {
    fetchEntriesForMonth(currentMonth);
  }, [currentMonth, fetchEntriesForMonth]);

  const handleDayClick = async (day: Date | undefined) => {
    if (!day || day > new Date()) { // Don't log for future dates
      alert("Cannot log for a future date.");
      return;
    }

    // Determine next status: if already completed, maybe cycle to skipped, then missed, then clear?
    // For simplicity: click toggles 'completed'. If already 'completed', it becomes 'missed' (or clear it).
    // More advanced: open a small dialog to choose status or add notes.
    const existingEntry = entries.find(e => parseISO(e.entryDate).toDateString() === day.toDateString());
    let nextStatus: HabitEntry['status'] = 'completed';
    if (existingEntry?.status === 'completed') {
      nextStatus = 'missed'; // Or allow clearing, or cycle through statuses
    }
    // If 'missed', make it 'completed'. This is a simplified toggle.

    const entryData = {
      entryDate: formatISO(day, { representation: 'date' }),
      status: nextStatus,
      // value and notes can be added later via a more complex UI
    };

    try {
      await habitService.logHabitEntry(userId, habitId, entryData);
      fetchEntriesForMonth(currentMonth); // Refresh entries for the current view
      onEntryLogged(); // Notify parent (e.g., to refresh streak)
    } catch (err) {
      console.error("Failed to log entry:", err);
      setError(err instanceof Error ? err.message : "Could not save entry.");
    }
  };

  const completedDays = entries
    .filter(entry => entry.status === 'completed')
    .map(entry => parseISO(entry.entryDate));

  const missedDays = entries
    .filter(entry => entry.status === 'missed')
    .map(entry => parseISO(entry.entryDate));

  const skippedDays = entries
    .filter(entry => entry.status === 'skipped')
    .map(entry => parseISO(entry.entryDate));

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-1 text-gray-700">Monthly Progress</h3>
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      {isLoading && <p className="text-sm text-gray-500 mb-2">Loading calendar...</p>}
      <Calendar
        mode="single"
        selected={undefined} // We are not using single selection state for now
        onSelect={handleDayClick}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        className="rounded-md border"
        modifiers={{
          completed: completedDays,
          missed: missedDays,
          skipped: skippedDays,
        }}
        modifiersClassNames={{
          completed: 'bg-green-500 text-white rounded-full',
          missed: 'bg-red-500 text-white rounded-full',
          skipped: 'bg-yellow-500 text-black rounded-full',
        }}
        disabled={(date) => date > new Date()} // Disable future dates
      />
      <p className="text-xs text-gray-500 mt-2">
        Click a day to mark it (toggles completion).
      </p>
    </div>
  );
};

export default HabitCalendar;
