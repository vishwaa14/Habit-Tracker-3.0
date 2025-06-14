"use client";

import { useState, useEffect, useCallback } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button"; // For potential future actions per row
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Lowercase 't' in table
import { toast } from "sonner";

// Type for a single habit - consistent with dashboard page
export type Habit = {
  id: number;
  name: string;
  description: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
};

// Type for daily completion status: habitId -> boolean
export type DailyCompletions = Record<number, boolean>;

interface HabitDailyTableProps {
  habits: Habit[];
  userId: string; // For API calls
  targetDate: string; // YYYY-MM-DD format for the day this table represents
  onCompletionChange: (habitId: number, newStatus: boolean) => void; // Callback to notify parent
  initialCompletions: DailyCompletions; // Completions for the targetDate
}

export function HabitDailyTable({
  habits,
  userId,
  targetDate,
  onCompletionChange,
  initialCompletions,
}: HabitDailyTableProps) {
  const [completions, setCompletions] = useState<DailyCompletions>(initialCompletions);

  useEffect(() => {
    setCompletions(initialCompletions);
  }, [initialCompletions]);

  const handleCheckboxChange = async (habitId: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      const response = await fetch(
        `http://localhost:9090/api/users/${userId}/habits/${habitId}/completions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: targetDate, completed: newStatus }),
        }
      );

      if (response.ok) {
        setCompletions(prev => ({ ...prev, [habitId]: newStatus }));
        onCompletionChange(habitId, newStatus); // Notify parent
        toast.success(`Habit "${habits.find(h => h.id === habitId)?.name}" marked ${newStatus ? 'complete' : 'incomplete'} for ${targetDate}.`);
      } else {
        const errorData = await response.text();
        toast.error(`Failed to update completion for habit ${habitId}: ${errorData}`);
      }
    } catch (error: any) {
      toast.error(`Error updating completion for habit ${habitId}: ${error.message}`);
    }
  };

  if (!habits || habits.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-4">No habits to display for this day.</p>;
  }

  return (
    <div className="border rounded-lg shadow-sm overflow-hidden dark:border-gray-700">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-800">
            <TableHead className="w-[50px] text-center">Done</TableHead>
            <TableHead>Habit</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            {/* <TableHead className="text-right">Actions</TableHead> */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {habits.map((habit) => (
            <TableRow
              key={habit.id}
              className={`transition-colors duration-150 ease-in-out hover:bg-gray-50/50 dark:hover:bg-gray-700/50 ${completions[habit.id] ? 'bg-green-50/50 dark:bg-green-900/20' : ''}`}
            >
              <TableCell className="text-center">
                <Checkbox
                  id={`completion-${habit.id}-${targetDate}`}
                  checked={completions[habit.id] || false}
                  onCheckedChange={() => handleCheckboxChange(habit.id, completions[habit.id] || false)}
                  aria-label={`Mark habit ${habit.name} as completed for ${targetDate}`}
                  className="transform scale-110"
                />
              </TableCell>
              <TableCell className="font-medium text-gray-800 dark:text-gray-100">{habit.name}</TableCell>
              <TableCell className="hidden md:table-cell text-sm text-gray-600 dark:text-gray-300">
                {habit.description || <span className="text-gray-400 dark:text-gray-500 italic">No description</span>}
              </TableCell>
              {/* <TableCell className="text-right">
                <Button variant="ghost" size="sm">Details</Button>
              </TableCell> */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
