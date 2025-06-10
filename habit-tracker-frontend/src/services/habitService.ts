import apiClient from '@/lib/api-client';
import { Habit, NewHabitData, HabitEntry, HabitEntryData, HabitStreak } from './types';

const getHabits = async (userId: string): Promise<Habit[]> => {
  if (!userId) throw new Error("User ID is required to fetch habits.");
  return apiClient<Habit[]>(`/users/${userId}/habits`);
};

const addHabit = async (userId: string, habitData: NewHabitData): Promise<Habit> => {
  if (!userId) throw new Error("User ID is required to add a habit.");
  return apiClient<Habit>(`/users/${userId}/habits`, {
    method: 'POST',
    data: habitData,
  });
};

const updateHabit = async (userId: string, habitId: string, habitData: Partial<NewHabitData>): Promise<Habit> => {
  if (!userId) throw new Error("User ID is required to update a habit.");
  if (!habitId) throw new Error("Habit ID is required to update a habit.");
  return apiClient<Habit>(`/users/${userId}/habits/${habitId}`, {
    method: 'PUT',
    data: habitData,
  });
};

const deleteHabit = async (userId: string, habitId: string): Promise<void> => {
  if (!userId) throw new Error("User ID is required to delete a habit.");
  if (!habitId) throw new Error("Habit ID is required to delete a habit.");
  await apiClient<void>(`/users/${userId}/habits/${habitId}`, {
    method: 'DELETE',
  });
};

const logHabitEntry = async (userId: string, habitId: string, entryData: HabitEntryData): Promise<HabitEntry> => {
  if (!userId) throw new Error("User ID is required to log an entry.");
  if (!habitId) throw new Error("Habit ID is required to log an entry.");
  return apiClient<HabitEntry>(`/users/${userId}/habits/${habitId}/entries`, {
    method: 'POST',
    data: entryData,
  });
};

const getHabitEntries = async (userId: string, habitId: string, startDate: string, endDate: string): Promise<HabitEntry[]> => {
  if (!userId) throw new Error("User ID is required to fetch entries.");
  if (!habitId) throw new Error("Habit ID is required to fetch entries.");
  const params = new URLSearchParams({ startDate, endDate });
  return apiClient<HabitEntry[]>(`/users/${userId}/habits/${habitId}/entries?${params.toString()}`);
};

// Updated to match backend response which is Map.of("streak", streakValue);
const getHabitStreak = async (userId: string, habitId: string): Promise<HabitStreak> => {
  if (!userId) throw new Error("User ID is required to fetch streak.");
  if (!habitId) throw new Error("Habit ID is required to fetch streak.");
  return apiClient<HabitStreak>(`/users/${userId}/habits/${habitId}/streak`);
};

export const habitService = {
  getHabits,
  addHabit,
  updateHabit,
  deleteHabit,
  logHabitEntry,
  getHabitEntries,
  getHabitStreak,
};
