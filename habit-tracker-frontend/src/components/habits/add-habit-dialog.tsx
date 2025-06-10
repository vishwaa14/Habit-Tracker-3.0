"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import AddHabitForm from './add-habit-form'; // Assuming path

// Define a type for the form data to be passed up
interface HabitFormData {
  name: string;
  description: string;
  color: string;
  frequencyType: string;
  frequencyDetails: string;
}

interface AddHabitDialogProps {
  onHabitAdd: (data: HabitFormData) => void; // Callback after successful submission
}

const AddHabitDialog: React.FC<AddHabitDialogProps> = ({ onHabitAdd }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFormSubmit = (data: HabitFormData) => {
    console.log("New Habit Data:", data); // Mock submission
    onHabitAdd(data); // Pass data to parent
    setIsOpen(false); // Close the dialog
  };

  const handleCancel = () => {
    setIsOpen(false); // Close the dialog
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="lg" className="fixed bottom-8 right-8 shadow-lg rounded-full p-6 md:p-4">
          <PlusIcon className="h-6 w-6 mr-0 md:mr-2" />
          <span className="hidden md:inline">Add New Habit</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create a New Habit</DialogTitle>
          <DialogDescription>
            Fill in the details below to start tracking a new habit.
          </DialogDescription>
        </DialogHeader>

        <AddHabitForm onSubmit={handleFormSubmit} onCancel={handleCancel} />

        {/*
          DialogFooter can be used if the form itself doesn't have submit/cancel buttons,
          but AddHabitForm already includes them. So, we might not need a separate DialogFooter here.
          If AddHabitForm's buttons were removed, you could use DialogFooter like this:
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" form="add-habit-form-id">Add Habit</Button> // Assuming AddHabitForm has id="add-habit-form-id"
          </DialogFooter>
        */}
      </DialogContent>
    </Dialog>
  );
};

// Simple PlusIcon component
const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

export default AddHabitDialog;
