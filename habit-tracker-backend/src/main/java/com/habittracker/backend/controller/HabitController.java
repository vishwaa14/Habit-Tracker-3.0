package com.habittracker.backend.controller;

import com.habittracker.backend.model.dto.HabitDto;
import com.habittracker.backend.model.dto.HabitEntryDto;
import com.habittracker.backend.service.HabitService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users/{userId}/habits")
@RequiredArgsConstructor
public class HabitController {

    private final HabitService habitService;

    @PostMapping
    public ResponseEntity<?> createHabit(@PathVariable Long userId, @RequestBody HabitDto habitDto) {
        try {
            HabitDto createdHabit = habitService.createHabit(userId, habitDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdHabit);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating habit: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getHabitsByUserId(@PathVariable Long userId) {
        try {
            List<HabitDto> habits = habitService.getHabitsByUserId(userId);
            return ResponseEntity.ok(habits);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching habits: " + e.getMessage());
        }
    }

    @PutMapping("/{habitId}")
    public ResponseEntity<?> updateHabit(@PathVariable Long userId, @PathVariable Long habitId, @RequestBody HabitDto habitDto) {
        try {
            HabitDto updatedHabit = habitService.updateHabit(habitId, habitDto, userId);
            return ResponseEntity.ok(updatedHabit);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating habit: " + e.getMessage());
        }
    }

    @DeleteMapping("/{habitId}")
    public ResponseEntity<?> deleteHabit(@PathVariable Long userId, @PathVariable Long habitId) {
        try {
            habitService.deleteHabit(habitId, userId);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting habit: " + e.getMessage());
        }
    }

    @PostMapping("/{habitId}/entries")
    public ResponseEntity<?> logHabitEntry(@PathVariable Long userId, @PathVariable Long habitId, @RequestBody HabitEntryDto entryDto) {
        try {
            HabitEntryDto loggedEntry = habitService.logHabitEntry(habitId, entryDto, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(loggedEntry);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error logging habit entry: " + e.getMessage());
        }
    }

    @GetMapping("/{habitId}/entries")
    public ResponseEntity<?> getHabitEntriesForDateRange(
            @PathVariable Long userId,
            @PathVariable Long habitId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            List<HabitEntryDto> entries = habitService.getHabitEntriesForDateRange(habitId, startDate, endDate, userId);
            return ResponseEntity.ok(entries);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching habit entries: " + e.getMessage());
        }
    }

    @GetMapping("/{habitId}/streak")
    public ResponseEntity<?> getHabitStreak(@PathVariable Long userId, @PathVariable Long habitId) {
        try {
            long streak = habitService.getHabitStreak(habitId, userId);
            return ResponseEntity.ok(Map.of("streak", streak));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching habit streak: " + e.getMessage());
        }
    }
}
