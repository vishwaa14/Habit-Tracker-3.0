import React from 'react';
import HabitCard from './habit-card';
import { Habit } from '@/services/types'; // Import Habit type

interface HabitListProps {
  habits: Habit[];
  onDeleteHabit: (habitId: string) => void;
  // Add onEditHabit later
  // Add onLogEntry later
}

const HabitList: React.FC<HabitListProps> = ({ habits, onDeleteHabit }) => {
  if (!habits || habits.length === 0) {
    // This message is now handled in DashboardPage when !isLoading && !habits.length
    // However, keeping a fallback or specific styling here might be useful.
    return null;
  }

  return (
    <div className="space-y-6">
      {habits.map(habit => (
        <HabitCard
          key={habit.id}
          habit={habit}
          onDelete={() => onDeleteHabit(habit.id)}
          // Pass other handlers like onEdit, onLogEntry later
        />
      ))}
    </div>
  );
};

export default HabitList;
