"use client"; // Mark as client component

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StreakDisplay from './streak-display';
import HabitCalendar from './habit-calendar';
import { Habit as HabitType, HabitStreak } from '@/services/types'; // Use global type
import { habitService } from '@/services/habitService';
import { useSession } from 'next-auth/react'; // To get userId

interface HabitCardProps {
  habit: HabitType;
  onDelete: () => void; // onDelete will be called by HabitList, which gets habitId
  // onEdit: (habit: HabitType) => void; // Future use
  // onEntryLogged: () => void; // To refresh data after logging an entry
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onDelete /*, onEdit, onEntryLogged */ }) => {
  const cardStyle = habit.colorHex ? { borderTop: `5px solid ${habit.colorHex}` } : {};
  const { data: session } = useSession();
  const userId = session?.user?.userId as string | undefined;

  const [streakData, setStreakData] = useState<HabitStreak | null>(null);
  const [isLoadingStreak, setIsLoadingStreak] = useState(false);
  // Error state for streak can be added if needed

  const fetchStreak = async () => {
    if (!userId || !habit.id) return;
    setIsLoadingStreak(true);
    try {
      const fetchedStreak = await habitService.getHabitStreak(userId, habit.id);
      setStreakData(fetchedStreak);
    } catch (error) {
      console.error("Failed to fetch streak:", error);
      // Set error state for streak
    } finally {
      setIsLoadingStreak(false);
    }
  };

  useEffect(() => {
    fetchStreak();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habit.id, userId]); // Fetch streak when component mounts or habit/user changes


  // Callback for HabitCalendar to refresh streak when an entry is logged
  const handleEntryLogged = () => {
    fetchStreak(); // Refresh streak data
    // Potentially call onEntryLogged from props to refresh parent data if needed
  };


  return (
    <Card className="w-full shadow-lg" style={cardStyle}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold">{habit.name}</CardTitle>
            {habit.description && (
              <CardDescription className="text-sm text-gray-600 mt-1">{habit.description}</CardDescription>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => alert(`Editing ${habit.name} (not implemented yet)`)}>
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {userId && ( // Ensure userId is available before rendering calendar
          <HabitCalendar
            habitId={habit.id}
            userId={userId}
            onEntryLogged={handleEntryLogged} // Pass callback
          />
        )}

        {isLoadingStreak && <p className="text-sm text-gray-500">Loading streak...</p>}
        {streakData && (
          <StreakDisplay currentStreak={streakData.streak} longestStreak={0} /> // Backend only returns current streak for now
        )}
        {!isLoadingStreak && !streakData && <p className="text-sm text-gray-500">Streak data unavailable.</p>}

      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        <p>Frequency: {habit.frequencyType}
           {habit.frequencyDetails && ` (${JSON.stringify(habit.frequencyDetails)})`}
        </p>
      </CardFooter>
    </Card>
  );
};

export default HabitCard;
