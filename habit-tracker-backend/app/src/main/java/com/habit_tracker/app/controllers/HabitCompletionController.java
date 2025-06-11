package com.habit_tracker.app.controllers;

import com.habit_tracker.app.models.HabitCompletion;
import com.habit_tracker.app.services.HabitCompletionService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

// Assuming CrossOrigin will be handled globally or in a config file later
// For now, can add @CrossOrigin(origins = "http://localhost:3000") if needed and HabitController's one is not enough
@RestController
@RequestMapping("/api/users/{userId}/habits/{habitId}/completions")
public class HabitCompletionController {

    @Autowired
    private HabitCompletionService habitCompletionService;

    // DTO for the request body of marking completion
    public static class CompletionRequest {
        private LocalDate date;
        private boolean completed;

        public LocalDate getDate() {
            return date;
        }
        public void setDate(LocalDate date) {
            this.date = date;
        }
        public boolean isCompleted() {
            return completed;
        }
        public void setCompleted(boolean completed) {
            this.completed = completed;
        }
    }

    @PostMapping
    public ResponseEntity<?> markHabitCompletion(
            @PathVariable String userId,
            @PathVariable Long habitId,
            @RequestBody CompletionRequest request) {
        try {
            HabitCompletion completion = habitCompletionService.markHabitCompletion(habitId, userId, request.getDate(), request.isCompleted());
            if (completion == null && !request.isCompleted()) {
                // Successfully marked as not completed by deleting the record
                return ResponseEntity.ok().build();
            }
            return ResponseEntity.ok(completion);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred.");
        }
    }

    @GetMapping
    public ResponseEntity<?> getHabitCompletionsForMonth(
            @PathVariable String userId,
            @PathVariable Long habitId,
            @RequestParam int year,
            @RequestParam int month) {
        try {
            YearMonth yearMonth = YearMonth.of(year, month);
            // Returning only dates for the calendar view as per plan
            List<LocalDate> completedDates = habitCompletionService.getCompletedDatesForHabit(habitId, userId, yearMonth);
            return ResponseEntity.ok(completedDates);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred.");
        }
    }

    @GetMapping("/streak")
    public ResponseEntity<?> getHabitStreak(
            @PathVariable String userId,
            @PathVariable Long habitId) {
        try {
            int streak = habitCompletionService.calculateCurrentStreak(habitId, userId);
            // Return as a simple JSON object: {"streak": value}
            return ResponseEntity.ok(Map.of("streak", streak));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred.");
        }
    }
}
