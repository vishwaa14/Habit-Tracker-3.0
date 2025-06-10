// Corresponds to HabitDto on the backend
export interface Habit {
  id: string; // Or number, if backend uses Long/Integer IDs and they are not stringified
  name: string;
  description?: string;
  colorHex?: string;
  frequencyType: string;
  frequencyDetails?: Record<string, unknown>; // JSON object
  targetValue?: number;
  targetUnit?: string;
  sortOrder?: number;
  archived?: boolean;
  // Frontend specific fields can be added here if needed, e.g., for UI state
  // currentStreak?: number; // These might come from a separate endpoint or be calculated client-side
  // longestStreak?: number;
  // trackedDays?: HabitEntry[]; // Might be fetched separately
}

// For creating a new habit, typically won't include id, archived, etc.
export interface NewHabitData {
  name: string;
  description?: string;
  colorHex?: string;
  frequencyType: string;
  frequencyDetails?: Record<string, unknown>;
  targetValue?: number;
  targetUnit?: string;
  sortOrder?: number;
}

// Corresponds to HabitEntryDto on the backend
export interface HabitEntry {
  id: string; // Or number
  entryDate: string; // ISO date string (e.g., "2024-06-08")
  status: 'completed' | 'missed' | 'skipped' | 'partially_completed'; // Match backend statuses
  value?: number;
  notes?: string;
}

// For creating or updating a habit entry
export interface HabitEntryData {
  entryDate: string; // ISO date string
  status: 'completed' | 'missed' | 'skipped' | 'partially_completed';
  value?: number;
  notes?: string;
}

// For streak data
export interface HabitStreak {
  streak: number; // Changed from currentStreak to match backend response { "streak": value }
}
