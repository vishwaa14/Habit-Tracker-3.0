"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define a type for the form data
interface HabitFormData {
  name: string;
  description: string;
  color: string;
  frequencyType: string;
  frequencyDetails: string; // Simplified for now, could be more complex object
}

interface AddHabitFormProps {
  onSubmit: (data: HabitFormData) => void;
  onCancel: () => void;
}

const AddHabitForm: React.FC<AddHabitFormProps> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#FF5733'); // Default color
  const [frequencyType, setFrequencyType] = useState('daily');
  const [frequencyDetails, setFrequencyDetails] = useState(''); // E.g., for specific_days: "Mon,Wed,Fri"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation (can be expanded)
    if (!name) {
      alert("Habit name is required.");
      return;
    }
    onSubmit({ name, description, color, frequencyType, frequencyDetails });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="habit-name">Habit Name</Label>
        <Input
          id="habit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Morning Exercise"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="habit-description">Description (Optional)</Label>
        <Textarea
          id="habit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., 30 minutes of cardio"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="habit-color">Color Theme</Label>
          <Input
            id="habit-color"
            type="color" // Simple color picker
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10" // Ensure color input is reasonably sized
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="habit-frequency-type">Frequency</Label>
          <Select value={frequencyType} onValueChange={setFrequencyType}>
            <SelectTrigger id="habit-frequency-type">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly_x_times">Times per week</SelectItem>
              <SelectItem value="specific_days_of_week">Specific days of week</SelectItem>
              <SelectItem value="every_x_days">Every X days</SelectItem>
              {/* <SelectItem value="monthly_x_times">Times per month</SelectItem> */}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conditional Inputs for Frequency Details - Simplified for now */}
      {(frequencyType === 'weekly_x_times' || frequencyType === 'every_x_days' || frequencyType === 'specific_days_of_week') && (
        <div className="space-y-2">
          <Label htmlFor="habit-frequency-details">
            {frequencyType === 'weekly_x_times' && "Times per week (e.g., 3)"}
            {frequencyType === 'every_x_days' && "Interval in days (e.g., 3)"}
            {frequencyType === 'specific_days_of_week' && "Days (e.g., Mon,Wed,Fri)"}
          </Label>
          <Input
            id="habit-frequency-details"
            value={frequencyDetails}
            onChange={(e) => setFrequencyDetails(e.target.value)}
            placeholder={
              frequencyType === 'weekly_x_times' ? "e.g., 3" :
              frequencyType === 'every_x_days' ? "e.g., 2 (for every other day)" :
              "e.g., Mon,Wed,Fri or 1,3,5"
            }
          />
           <p className="text-xs text-gray-500">
            Note: For 'Specific days', use comma-separated days like Mon,Tue,Wed.
            For 'Times per week' or 'Every X days', enter a number.
          </p>
        </div>
      )}


      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add Habit</Button>
      </div>
    </form>
  );
};

export default AddHabitForm;
