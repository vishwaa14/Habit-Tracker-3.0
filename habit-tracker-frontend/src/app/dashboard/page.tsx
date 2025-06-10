"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import HabitList from "@/components/habits/habit-list";
import AddHabitDialog from "@/components/habits/add-habit-dialog";
import { habitService } from "@/services/habitService";
import { Habit, NewHabitData } from "@/services/types"; // Import types

// Define the HabitFormData type for the onHabitAdd callback from AddHabitDialog
// This should align with NewHabitData but might have slight variations from the form itself
interface HabitFormDataForDialog {
  name: string;
  description: string;
  color: string; // from color picker, should be string #RRGGBB
  frequencyType: string;
  frequencyDetails: string; // from text input, needs parsing
}

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user?.userId as string | undefined; // Get backend userId

  // Fetch habits
  const fetchHabits = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedHabits = await habitService.getHabits(userId);
      setHabits(fetchedHabits);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch habits.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session || !userId) {
      router.push("/auth/login");
      return;
    }
    fetchHabits();
  }, [session, sessionStatus, userId, router, fetchHabits]);

  // Add habit
  const handleHabitAdd = async (formData: HabitFormDataForDialog) => {
    if (!userId) {
      setError("User not authenticated.");
      return;
    }

    // Convert/parse formData.frequencyDetails if necessary
    // For now, assuming backend DTO 'frequencyDetails' is Map<String, Object>
    // and frontend sends a string that needs parsing or direct JSON object.
    // The AddHabitForm sends string, HabitDto expects Map.
    // This needs careful handling based on actual backend expectations for frequencyDetails.
    // For simplicity, we'll try to parse it as JSON if it's structured like one, or pass as is if not.
    let parsedFrequencyDetails: Record<string, unknown> | undefined;
    if (formData.frequencyDetails) {
        try {
            // A simple attempt for "key:value,key2:value2" or JSON string
            if (formData.frequencyDetails.startsWith("{")) {
                 parsedFrequencyDetails = JSON.parse(formData.frequencyDetails);
            } else {
                // Example for "Mon,Wed,Fri" -> { days: ["Mon", "Wed", "Fri"] }
                // Example for "3" (times per week) -> { times_per_week: 3 }
                // This logic needs to be robust based on frequencyType
                if (formData.frequencyType === 'specific_days_of_week') {
                    parsedFrequencyDetails = { days_of_week: formData.frequencyDetails.split(',').map(s => s.trim()) };
                } else if (formData.frequencyType === 'weekly_x_times' || formData.frequencyType === 'every_x_days') {
                    const numValue = parseInt(formData.frequencyDetails, 10);
                    if (!isNaN(numValue)) {
                        if (formData.frequencyType === 'weekly_x_times') parsedFrequencyDetails = { times_per_week: numValue };
                        if (formData.frequencyType === 'every_x_days') parsedFrequencyDetails = { interval_days: numValue };
                    }
                }
            }
        } catch (e) {
            console.warn("Could not parse frequencyDetails as JSON, sending as string or default.", e);
            // Fallback or specific handling might be needed
        }
    }


    const newHabitData: NewHabitData = {
      name: formData.name,
      description: formData.description,
      colorHex: formData.color,
      frequencyType: formData.frequencyType,
      frequencyDetails: parsedFrequencyDetails, // Use parsed version
      // sortOrder can be handled by backend or set here
    };

    try {
      await habitService.addHabit(userId, newHabitData);
      fetchHabits(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add habit.");
      console.error(err);
    }
  };

  // Delete habit
  const handleHabitDelete = async (habitId: string) => {
    if (!userId) {
      setError("User not authenticated.");
      return;
    }
    const originalHabits = [...habits];
    setHabits(habits.filter(h => h.id !== habitId)); // Optimistic update
    try {
      await habitService.deleteHabit(userId, habitId);
      // fetchHabits(); // Refresh list from server to confirm, or rely on optimistic update
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete habit.");
      setHabits(originalHabits); // Revert optimistic update
      console.error(err);
    }
  };


  if (sessionStatus === "loading" || (session && !userId && isLoading)) { // Adjusted loading condition
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!session) {
     // This case should be handled by the useEffect redirect, but as a fallback:
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session.user?.name || session.user?.email}!</p>
          {/* <p className="text-xs text-gray-500">User ID (backend): {userId}</p> */}
        </div>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}

      {isLoading && !habits.length && <p>Loading habits...</p>}

      {!isLoading && !habits.length && !error && (
         <div className="text-center py-10">
           <p className="text-xl text-gray-600">No habits yet. Add one to get started!</p>
         </div>
      )}

      {habits.length > 0 && (
        <HabitList habits={habits} onDeleteHabit={handleHabitDelete} />
      )}

      <AddHabitDialog onHabitAdd={handleHabitAdd} />
    </div>
  );
}
