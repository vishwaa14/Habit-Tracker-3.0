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
import { toast } from "sonner";
import { HabitDailyTable, type Habit as TableHabit, type DailyCompletions } from "@/components/HabitDailyTable"; // Import new table
import { CalendarDays, CheckCircle, PlusCircle, Trash2 } from "lucide-react"; // Example icons

// Simulated User ID
const SIMULATED_USER_ID = "user123";

// Habit type for this page (ensure compatibility with TableHabit if different)
type Habit = {
  id: number;
  name: string;
  description: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
};

const getTodayKey = (): string => new Date().toISOString().split("T")[0];
const getYearMonth = (date: Date): { year: number; month: number } => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
});

// Re-using HabitCalendar from previous version (ensure it's available or include its definition)
// For brevity, assuming HabitCalendar component definition exists as previously provided.
// Minimal HabitCalendar for this example if not already present:
interface HabitCalendarProps {
  habitId: number;
  userId: string;
  initialYearMonth: { year: number; month: number };
  onCompletionChange?: (habitId: number, date: string, newStatus: boolean) => void;
  // Add a key prop that can be changed to force re-fetch/re-render
  calendarVersion?: number;
}

function HabitCalendar({ habitId, userId, initialYearMonth, onCompletionChange, calendarVersion }: HabitCalendarProps) {
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
  const [currentYearMonth, setCurrentYearMonth] = useState(initialYearMonth);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCompletions = useCallback(async (year: number, month: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:9090/api/users/${userId}/habits/${habitId}/completions?year=${year}&month=${month}`);
      if (response.ok) {
        const dates: string[] = await response.json();
        setCompletedDates(new Set(dates));
      } else {
        toast.error(`Failed to fetch completions for habit ${habitId}`);
        setCompletedDates(new Set());
      }
    } catch (error: any) {
      toast.error(`Error fetching completions: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [userId, habitId]);

  useEffect(() => {
    fetchCompletions(currentYearMonth.year, currentYearMonth.month);
  }, [fetchCompletions, currentYearMonth, calendarVersion]); // calendarVersion forces re-fetch

  const handleDayClick = async (dateKey: string, isCurrentlyCompleted: boolean) => {
    const newCompletedStatus = !isCurrentlyCompleted;
    try {
      const response = await fetch(`http://localhost:9090/api/users/${userId}/habits/${habitId}/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateKey, completed: newCompletedStatus }),
      });
      if (response.ok) {
        toast.success(`Habit marked ${newCompletedStatus ? 'complete' : 'incomplete'} for ${dateKey}`);
        fetchCompletions(currentYearMonth.year, currentYearMonth.month);
        if (onCompletionChange) onCompletionChange(habitId, dateKey, newCompletedStatus);
      } else {
        const errorData = await response.text();
        toast.error(`Failed to update completion: ${errorData}`);
      }
    } catch (error: any) {
      toast.error(`Error updating completion: ${error.message}`);
    }
  };

  // Simplified calendar rendering for brevity
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
// End of HabitCalendar component


export default function Dashboard() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitDescription, setNewHabitDescription] = useState("");
  const [isLoadingHabits, setIsLoadingHabits] = useState(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [streaks, setStreaks] = useState<Record<number, number>>({});
  const [todaysCompletions, setTodaysCompletions] = useState<DailyCompletions>({});
  const [calendarVersions, setCalendarVersions] = useState<Record<number, number>>({});


  const fetchStreak = useCallback(async (habitId: number) => {
    const url = `http://localhost:9090/api/users/${SIMULATED_USER_ID}/habits/${habitId}/streak`;
    console.log(`Fetching streak for habit ${habitId} from URL: ${url}`); // Log URL
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStreaks(prev => ({ ...prev, [habitId]: data.streak }));
        console.log(`Successfully fetched streak for habit ${habitId}: ${data.streak}`);
      } else {
        const errorText = await response.text();
        console.error(`Failed to fetch streak for habit ${habitId}. URL: ${url}, Status: ${response.status}. Response: ${errorText}`);
        const habitName = habits.find(h => h.id === habitId)?.name || `ID ${habitId}`;
        toast.error(`Failed to load streak for ${habitName}. Server status: ${response.status}.`);
        setStreaks(prev => ({ ...prev, [habitId]: 0 })); // Default to 0 on error
      }
    } catch (error: any) {
      console.error(`Network or fetch error for URL ${url} (Habit ID: ${habitId}):`, error);
      const habitName = habits.find(h => h.id === habitId)?.name || `ID ${habitId}`;
      // Check if it's a TypeError which often indicates CORS or network issue
      if (error instanceof TypeError && error.message.toLowerCase().includes("failed to fetch")) {
        toast.error(`Network error fetching streak for ${habitName}. Server might be down or CORS issue.`);
        console.info("Hint: 'TypeError: Failed to fetch' often means the backend isn't reachable (is it running?) or a CORS policy is blocking the request.");
      } else {
        toast.error(`Error fetching streak for ${habitName}: ${error.message}`);
      }
      setStreaks(prev => ({ ...prev, [habitId]: 0 }));
    }
  }, [habits, SIMULATED_USER_ID]); // SIMULATED_USER_ID was missing from dep array, habits is present

  const fetchTodaysCompletionsForHabit = useCallback(async (habitId: number, todayDateKey: string) => {
    // This function is a bit redundant if the calendar already fetches monthly data.
    // However, for the table, we specifically need "today's" status.
    // Option 1: Fetch just for today (less efficient if calendar also fetches)
    // Option 2: Derive from monthly calendar data (more complex state sharing)
    // For simplicity, let's assume an endpoint or logic to get single-day status if available,
    // or reuse the monthly fetch and filter.
    // Given current backend, we fetch monthly and filter.
    // To avoid many individual fetches, we'll fetch all of today's completions in one go below.
  }, []);


  const fetchAllTodaysCompletions = useCallback(async (currentHabits: Habit[], todayDateKey: string) => {
    const newTodaysCompletions: DailyCompletions = {};
    // This ideally would be a single API call if backend supported: "get completions for these habits on this day"
    // For now, we iterate. This is not optimal for many habits.
    // A better approach: When fetching monthly data for calendars, extract today's status.
    // Or, have a dedicated endpoint for "today's dashboard".
    // For now, let's assume the monthly calendar fetch will populate enough data and we can extract.
    // Let's simplify: the table will use its own state initially, and onCompletionChange will sync.
    // The initial state for `todaysCompletions` for the table will be derived after habits load.

    // For demo purposes, let's fetch today's status for each habit individually.
    // This is NOT performant for many habits.
    for (const habit of currentHabits) {
        try {
            const response = await fetch(`http://localhost:9090/api/users/${SIMULATED_USER_ID}/habits/${habit.id}/completions?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`);
            if (response.ok) {
                const dates: string[] = await response.json();
                if (dates.includes(todayDateKey)) {
                    newTodaysCompletions[habit.id] = true;
                } else {
                    newTodaysCompletions[habit.id] = false;
                }
            } else {
                newTodaysCompletions[habit.id] = false;
            }
        } catch (error) {
            console.error(`Error fetching today's completion for habit ${habit.id}`, error);
            newTodaysCompletions[habit.id] = false;
        }
    }
    setTodaysCompletions(newTodaysCompletions);

  }, [SIMULATED_USER_ID]);


  const fetchUserHabits = useCallback(async () => {
    setIsLoadingHabits(true);
    const todayKey = getTodayKey();
    try {
      const response = await fetch(`http://localhost:9090/api/users/${SIMULATED_USER_ID}/habits`);
      if (response.ok) {
        const userHabits: Habit[] = await response.json();
        setHabits(userHabits);
        const initialCalendarVersions: Record<number, number> = {};
        userHabits.forEach(habit => {
          fetchStreak(habit.id);
          initialCalendarVersions[habit.id] = 0; // Initialize calendar version
        });
        setCalendarVersions(initialCalendarVersions);
        await fetchAllTodaysCompletions(userHabits, todayKey); // Fetch status for today for the table
      } else {
        toast.error("Failed to fetch habits.");
      }
    } catch (error: any) {
      toast.error(`Error fetching habits: ${error.message}`);
    } finally {
      setIsLoadingHabits(false);
    }
  }, [SIMULATED_USER_ID, fetchStreak, fetchAllTodaysCompletions]);

  useEffect(() => {
    fetchUserHabits();
  }, [fetchUserHabits]);


  const handleAddHabit = async () => {
    // ... (same as before)
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
        // setHabits(prevHabits => [...prevHabits, savedHabit]); // fetchUserHabits will refresh
        // fetchStreak(savedHabit.id);
        // setTodaysCompletions(prev => ({...prev, [savedHabit.id]: false})); // New habit is not completed today
        // setCalendarVersions(prev => ({...prev, [savedHabit.id]: 0}));
        await fetchUserHabits(); // Re-fetch all data
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

  // Unified completion change handler
  const handleGenericCompletionChange = (habitId: number, dateKey: string, newStatus: boolean) => {
    fetchStreak(habitId);
    // If the change was for today, update the table's state
    if (dateKey === getTodayKey()) {
      setTodaysCompletions(prev => ({ ...prev, [habitId]: newStatus }));
    }
    // Force calendar to re-fetch by changing its version key
    setCalendarVersions(prev => ({ ...prev, [habitId]: (prev[habitId] || 0) + 1 }));
  };

  const deleteHabit = async (habitId: number) => {
    // ... (same as before)
    if (!confirm("Are you sure you want to delete this habit? This action cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:9090/api/users/${SIMULATED_USER_ID}/habits/${habitId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        // setHabits(prevHabits => prevHabits.filter(h => h.id !== habitId));
        // setStreaks(prev => { /* ... */ });
        // setTodaysCompletions(prev => { /* ... */ });
        // setCalendarVersions(prev => { /* ... */ });
        await fetchUserHabits(); // Re-fetch all data
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
    <div className="p-4 sm:p-6 w-full max-w-6xl mx-auto space-y-8"> {/* Increased max-width */}
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">
          My Habits Dashboard
        </h1>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="default" size="lg" className="flex items-center gap-2">
              <PlusCircle size={20} /> Add New Habit
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96"> {/* Content same as before */}
            <div className="grid gap-4 py-4">
              <h4 className="font-medium leading-none text-center mb-2 text-lg">Create a New Habit</h4>
              <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
                <Label htmlFor="habitName" className="text-right col-span-1">Name</Label>
                <Input id="habitName" value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} className="col-span-3" placeholder="e.g., Read for 30 minutes"/>
                <Label htmlFor="description" className="text-right col-span-1">Details</Label>
                <Input id="description" value={newHabitDescription} onChange={(e) => setNewHabitDescription(e.target.value)} className="col-span-3" placeholder="Optional: e.g., any book"/>
              </div>
              <Button onClick={handleAddHabit} className="mt-4 w-full py-2.5 text-base">Save Habit</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Today's Habit Table */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Today's Progress</h2>
        {habits.length > 0 ? (
          <HabitDailyTable
            habits={habits}
            userId={SIMULATED_USER_ID}
            targetDate={getTodayKey()}
            initialCompletions={todaysCompletions}
            onCompletionChange={(habitId, newStatus) => handleGenericCompletionChange(habitId, getTodayKey(), newStatus)}
          />
        ) : (
           !isLoadingHabits && <p className="text-center text-gray-500 dark:text-gray-400 py-6">Add some habits to see them here!</p>
        )}
      </div>

      {/* Habit Cards with Calendars */}
      <div>
         <h2 className="text-2xl font-semibold mb-6 text-gray-700 dark:text-gray-200">Monthly Overview</h2>
        {habits.length === 0 && !isLoadingHabits && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-10">
            No habits yet. Click "Add New Habit" to get started!
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {habits.map((habit) => (
            <div key={habit.id} className="border dark:border-gray-700 rounded-xl p-5 shadow-lg bg-white dark:bg-gray-800 flex flex-col justify-between transition-all hover:shadow-xl">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-grow mr-2">
                    <h3 className="font-semibold text-xl text-gray-900 dark:text-white">{habit.name}</h3>
                    {habit.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 break-words mt-1">
                        {habit.description}
                      </p>
                    )}
                  </div>
                  {/* Removed the Mark Today button from card as it's now in the table / calendar */}
                </div>
                <HabitCalendar
                  habitId={habit.id}
                  userId={SIMULATED_USER_ID}
                  initialYearMonth={getYearMonth(new Date())}
                  onCompletionChange={handleGenericCompletionChange}
                  calendarVersion={calendarVersions[habit.id] || 0}
                />
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t dark:border-gray-700">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Streak: <span className="font-bold text-lg text-orange-500 dark:text-orange-400">{streaks[habit.id] !== undefined ? streaks[habit.id] : "..."}</span> days
                </div>
                <Button
                  variant="ghost" // Changed to ghost for less emphasis
                  size="sm"
                  onClick={() => deleteHabit(habit.id)}
                  className="text-red-500 hover:bg-red-100 dark:hover:bg-red-700/50 dark:text-red-400 flex items-center gap-1.5"
                  title="Delete habit"
                >
                  <Trash2 size={16} /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
