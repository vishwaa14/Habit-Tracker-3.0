"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// New Habit type with history
type Habit = {
  name: string;
  description: string;
  history: Record<string, boolean>; // date string -> done or not
};

// Helper to get ISO date string (YYYY-MM-DD)
const getTodayKey = () => new Date().toISOString().split("T")[0];

// Mini calendar component per habit
function HabitCalendar({ history }: { history: Record<string, boolean> }) {
  const today = new Date();
  const days = Array.from({ length: 28 }).map((_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (27 - i));
    const key = date.toISOString().split("T")[0];
    return { date, key, done: history[key] };
  });

  return (
    <div className="grid grid-cols-7 gap-1 mt-2">
      {days.map(({ date, key, done }) => (
        <div
          key={key}
          title={date.toDateString()}
          className={`w-4 h-4 rounded-full ${done ? "bg-green-500" : "bg-gray-200"}`}
        ></div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const [description, setDescription] = useState("");

  const handleAddHabit = async () => {
    if (newHabit.trim() === "" || description.trim() === "") return;

    const habitData = { name: newHabit, description };

    try {
      const response = await fetch("http://localhost:9090/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(habitData),
      });

      if (response.ok) {
        const savedHabit = await response.json();
        setHabits([...habits, { ...savedHabit, history: {} }]);
        setNewHabit("");
        setDescription("");
      }
    } catch (error) {
      console.error("Error saving habit:", error);
    }
  };

  const markDoneToday = (index: number) => {
    const updated = [...habits];
    const today = getTodayKey();
    updated[index].history[today] = true;
    setHabits(updated);
  };

  return (
    <div className="p-4 w-screen">
      <h2 className="text-xl font-semibold mb-4">Habit Tracker Dashboard</h2>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Add Habit</Button>
        </PopoverTrigger>
        <PopoverContent className="w-100">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="habit">Enter a new habit</Label>
                <Input
                  id="habit"
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  className="col-span-2 h-8"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="col-span-2 h-8"
                />
              </div>
              <Button onClick={handleAddHabit} className="mt-2">
                Save Habit
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {habits.map((habit, index) => (
          <div key={index} className="border rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h4 className="font-semibold text-lg">{habit.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {habit.description}
                </p>
              </div>
              <Button size="sm" onClick={() => markDoneToday(index)}>
                Mark Today ✅
              </Button>
            </div>
            <HabitCalendar history={habit.history} />
          </div>
        ))}
      </div>
    </div>
  );
}
