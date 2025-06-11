"use client"

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// Assuming sonner is used for toasts. If not, replace with console.log/error or other notification system.
// You might need to add `import { Toaster } from "@/components/ui/sonner"` to your layout.tsx
// and install sonner: npm install sonner
import { toast } from "sonner";

// Simulated User ID for development
const SIMULATED_USER_ID = "user123"; // TODO: Replace with actual auth later

// Updated Habit type based on backend entities
type Habit = {
  id: number; // Backend Long maps to number here
  name: string;
  description: string;
  userId: string;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
};

// Helper to get ISO date string (YYYY-MM-DD)
const getTodayKey = (): string => new Date().toISOString().split("T")[0];
const getYearMonth = (date: Date): { year: number; month: number } => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1, // Month is 1-indexed for API
});

// Props for HabitCalendar
interface HabitCalendarProps {
  habitId: number;
  userId: string;
  initialYearMonth: { year: number; month: number };
  onCompletionChange?: () => void; // Optional callback to notify parent of data change
}

function HabitCalendar({ habitId, userId, initialYearMonth, onCompletionChange }: HabitCalendarProps) {
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
  const [currentYearMonth, setCurrentYearMonth] = useState(initialYearMonth);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCompletions = useCallback(async (year: number, month: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:9090/api/users/${userId}/habits/${habitId}/completions?year=${year}&month=${month}`);
      if (response.ok) {
        const dates: string[] = await response.json(); // Backend returns List<LocalDate> as string array
        setCompletedDates(new Set(dates));
      } else {
        const errorText = await response.text();
        toast.error(`Failed to fetch completions for habit ${habitId}: ${errorText}`);
        setCompletedDates(new Set());
      }
    } catch (error: any) {
      toast.error(`Error fetching completions: ${error.message}`);
      setCompletedDates(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [userId, habitId]);

  useEffect(() => {
    fetchCompletions(currentYearMonth.year, currentYearMonth.month);
  }, [fetchCompletions, currentYearMonth]);

  const handleDayClick = async (dateKey: string, isCurrentlyCompleted: boolean) => {
    const newCompletedStatus = !isCurrentlyCompleted;
    try {
      const response = await fetch(`http://localhost:9090/api/users/${userId}/habits/${habitId}/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateKey, completed: newCompletedStatus }),
      });
      if (response.ok) {
        toast.success(`Habit marked as ${newCompletedStatus ? 'complete' : 'incomplete'} for ${dateKey}`);
        fetchCompletions(currentYearMonth.year, currentYearMonth.month); // Refetch to update
        if (onCompletionChange) onCompletionChange();
      } else {
        const errorData = await response.text();
        toast.error(`Failed to update habit completion: ${errorData}`);
      }
    } catch (error: any) {
      toast.error(`Error updating habit completion: ${error.message}`);
    }
  };

  const daysInMonth = new Date(currentYearMonth.year, currentYearMonth.month, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }).map((_, i) => {
    const dayNumber = i + 1;
    const date = new Date(currentYearMonth.year, currentYearMonth.month - 1, dayNumber);
    const key = date.toISOString().split("T")[0];
    return { date, key, dayNumber, done: completedDates.has(key) };
  });

  return (
    <div className="mt-3">
      <div className="mb-2 text-center text-sm font-medium">
        {new Date(currentYearMonth.year, currentYearMonth.month - 1).toLocaleString('default', { month: 'long' })} {currentYearMonth.year}
      </div>
      {isLoading && <p className="text-sm text-muted-foreground text-center">Loading calendar...</p>}
      {!isLoading && (
        <div className="grid grid-cols-7 gap-1.5">
          {monthDays.map(({ date, key, dayNumber, done }) => (
            <div
              key={key}
              title={`${date.toDateString()} - ${done ? 'Completed' : 'Incomplete'}
Click to toggle.`}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs cursor-pointer transition-colors
                          ${done ? "bg-green-500 text-white hover:bg-green-600"
                                : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"}`}
              onClick={() => handleDayClick(key, done)}
            >
              {dayNumber}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export default function Dashboard() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitDescription, setNewHabitDescription] = useState("");
  const [isLoadingHabits, setIsLoadingHabits] = useState(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [streaks, setStreaks] = useState<Record<number, number>>({});

  const fetchUserHabits = useCallback(async () => {
    setIsLoadingHabits(true);
    try {
      const response = await fetch(`http://localhost:9090/api/users/${SIMULATED_USER_ID}/habits`);
      if (response.ok) {
        const userHabits: Habit[] = await response.json();
        setHabits(userHabits);
        userHabits.forEach(habit => fetchStreak(habit.id));
      } else {
        toast.error("Failed to fetch habits.");
      }
    } catch (error: any) {
      toast.error(`Error fetching habits: ${error.message}`);
    } finally {
      setIsLoadingHabits(false);
    }
  }, []);

  useEffect(() => {
    fetchUserHabits();
  }, [fetchUserHabits]);

  const fetchStreak = async (habitId: number) => {
    try {
      const response = await fetch(`http://localhost:9090/api/users/${SIMULATED_USER_ID}/habits/${habitId}/streak`);
      if (response.ok) {
        const data = await response.json();
        setStreaks(prev => ({ ...prev, [habitId]: data.streak }));
      } else {
        console.error(`Failed to fetch streak for habit ${habitId}`);
      }
    } catch (error) {
      console.error(`Error fetching streak for habit ${habitId}:`, error);
    }
  };

  const handleAddHabit = async () => {
    if (newHabitName.trim() === "") {
      toast.error("Habit name cannot be empty.");
      return;
    }
    const habitData = { name: newHabitName, description: newHabitDescription, userId: SIMULATED_USER_ID };
    try {
      const response = await fetch(`http://localhost:9090/api/users/${SIMULATED_USER_ID}/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(habitData),
      });
      if (response.ok) {
        const savedHabit: Habit = await response.json();
        setHabits(prevHabits => [...prevHabits, savedHabit]);
        fetchStreak(savedHabit.id);
        setNewHabitName("");
        setNewHabitDescription("");
        setIsPopoverOpen(false);
        toast.success(`Habit "${savedHabit.name}" added!`);
      } else {
        const errorData = await response.text();
        toast.error(`Failed to save habit: ${errorData}`);
      }
    } catch (error: any) {
      toast.error(`Error saving habit: ${error.message}`);
    }
  };

  const handleCompletionChange = (habitId: number) => {
    fetchStreak(habitId);
  };

  const markDoneTodayExternal = async (habitId: number) => {
    const todayKey = getTodayKey();
    try {
      const response = await fetch(`http://localhost:9090/api/users/${SIMULATED_USER_ID}/habits/${habitId}/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: todayKey, completed: true }),
      });
      if (response.ok) {
        toast.success(`Habit marked as complete for today! Calendar will update.`);
        fetchStreak(habitId);
        // To trigger calendar refresh, we could re-fetch all habits or use a more direct method.
        // For now, the calendar will update on its own if its internal fetch is re-triggered by prop changes or internal logic.
        // A simple (but less efficient) way to ensure the specific calendar updates is to force-remount it or change a key prop.
        // Or, the `onCompletionChange` can be used by finding the right child component, which is complex.
        // The calendar will show the update if the user interacts with it (e.g. changes month back and forth).
      } else {
        const errorData = await response.text();
        toast.error(`Failed to mark habit for today: ${errorData}`);
      }
    } catch (error: any) {
      toast.error(`Error marking habit for today: ${error.message}`);
    }
  };

  const deleteHabit = async (habitId: number) => {
    if (!confirm("Are you sure you want to delete this habit? This action cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:9090/api/users/${SIMULATED_USER_ID}/habits/${habitId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setHabits(prevHabits => prevHabits.filter(h => h.id !== habitId));
        setStreaks(prev => {
            const newStreaks = {...prev};
            delete newStreaks[habitId];
            return newStreaks;
        });
        toast.success("Habit deleted successfully.");
      } else {
        const errorData = await response.text();
        toast.error(`Failed to delete habit: ${errorData}`);
      }
    } catch (error: any) {
      toast.error(`Error deleting habit: ${error.message}`);
    }
  };

  if (isLoadingHabits) {
    return <div className="p-6 text-center">Loading habits dashboard...</div>;
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">
          My Habits
        </h1>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="default" size="lg">Add New Habit</Button>
          </PopoverTrigger>
          <PopoverContent className="w-96">
            <div className="grid gap-4 py-4">
              <h4 className="font-medium leading-none text-center mb-2 text-lg">Create a New Habit</h4>
              <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
                <Label htmlFor="habitName" className="text-right col-span-1">Name</Label>
                <Input
                  id="habitName"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., Read for 30 minutes"
                />
                <Label htmlFor="description" className="text-right col-span-1">Details</Label>
                <Input
                  id="description"
                  value={newHabitDescription}
                  onChange={(e) => setNewHabitDescription(e.target.value)}
                  className="col-span-3"
                  placeholder="Optional: e.g., any book"
                />
              </div>
              <Button onClick={handleAddHabit} className="mt-4 w-full py-2.5 text-base">
                Save Habit
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {habits.length === 0 && !isLoadingHabits && (
        <p className="text-center text-gray-500 dark:text-gray-400 text-lg py-10">
          No habits yet. Click "Add New Habit" to get started!
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {habits.map((habit) => (
          <div key={habit.id} className="border dark:border-gray-700 rounded-xl p-5 shadow-lg bg-white dark:bg-gray-800 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-grow mr-2"> {/* Added mr-2 for spacing */}
                  <h2 className="font-semibold text-xl text-gray-900 dark:text-white">{habit.name}</h2>
                  {habit.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 break-words mt-1">
                      {habit.description}
                    </p>
                  )}
                </div>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => markDoneTodayExternal(habit.id)}
                    title="Mark today as completed"
                    className="text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </Button>
              </div>
              <HabitCalendar
                habitId={habit.id}
                userId={SIMULATED_USER_ID}
                initialYearMonth={getYearMonth(new Date())}
                onCompletionChange={() => handleCompletionChange(habit.id)}
              />
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t dark:border-gray-700">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                    Streak: <span className="font-bold text-lg">{streaks[habit.id] !== undefined ? streaks[habit.id] : "..."}</span> days
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteHabit(habit.id)}
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white dark:border-red-600 dark:text-red-500 dark:hover:bg-red-600 dark:hover:text-white"
                >
                    Delete
                </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
