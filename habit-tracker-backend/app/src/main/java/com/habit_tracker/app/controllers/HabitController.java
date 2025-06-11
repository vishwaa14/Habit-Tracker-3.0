package com.habit_tracker.app.controllers;

import com.habit_tracker.app.models.Habit;
import com.habit_tracker.app.services.HabitService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
// import org.springframework.web.server.ResponseStatusException; // Alternative for exceptions

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users/{userId}/habits") // Changed base path
@CrossOrigin(origins = "http://localhost:3000") // Keep for development, consider global config later
public class HabitController {

    @Autowired
    private HabitService habitService;

    // POST: Create a new habit for a user
    @PostMapping
    public ResponseEntity<?> addHabit(@PathVariable String userId, @RequestBody Habit habit) {
        try {
            // Ensure the habit's userId is consistent with the path variable
            // Or, rely on the service to set/validate it.
            // Forcing it here from path variable for clarity and security.
            habit.setUserId(userId);
            Habit newHabit = habitService.addHabit(habit, userId); // Service now takes userId
            return ResponseEntity.status(HttpStatus.CREATED).body(newHabit);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred: " + e.getMessage());
        }
    }

    // GET: Get all habits for a user
    @GetMapping
    public ResponseEntity<?> getHabitsByUserId(@PathVariable String userId) {
        try {
            List<Habit> habits = habitService.getHabitsByUserId(userId);
            return ResponseEntity.ok(habits);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred: " + e.getMessage());
        }
    }

    // GET: Get a specific habit by ID
    @GetMapping("/{habitId}")
    public ResponseEntity<?> getHabitById(@PathVariable String userId, @PathVariable Long habitId) {
        try {
            Habit habit = habitService.getHabitById(habitId, userId);
            return ResponseEntity.ok(habit);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred: " + e.getMessage());
        }
    }

    // PUT: Update an existing habit
    @PutMapping("/{habitId}")
    public ResponseEntity<?> updateHabit(@PathVariable String userId, @PathVariable Long habitId, @RequestBody Habit habitDetails) {
        try {
            // Ensure habitDetails' userId is not attempting to change ownership,
            // or clear it if it's part of the request body but shouldn't be updated.
            // The service layer's getHabitById will ensure current user owns the habit.
            habitDetails.setUserId(userId); // Reinforce ownership if userId is in habitDetails
            Habit updatedHabit = habitService.updateHabit(habitId, habitDetails, userId);
            return ResponseEntity.ok(updatedHabit);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred: " + e.getMessage());
        }
    }

    // DELETE: Delete a habit
    @DeleteMapping("/{habitId}")
    public ResponseEntity<?> deleteHabit(@PathVariable String userId, @PathVariable Long habitId) {
        try {
            habitService.deleteHabit(habitId, userId);
            return ResponseEntity.ok().body(Map.of("message", "Habit deleted successfully")); // Or ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred: " + e.getMessage());
        }
    }
}
