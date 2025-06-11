package com.habit_tracker.app.services;

import com.habit_tracker.app.models.Habit;
import com.habit_tracker.app.models.HabitCompletion;
import com.habit_tracker.app.repositories.HabitCompletionRepository;
import com.habit_tracker.app.repositories.HabitRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class HabitCompletionService {

    @Autowired
    private HabitRepository habitRepository;

    @Autowired
    private HabitCompletionRepository habitCompletionRepository;

    @Transactional
    public HabitCompletion markHabitCompletion(Long habitId, String userId, LocalDate date, boolean completed) {
        // Ensure the habit exists and belongs to the user
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new EntityNotFoundException("Habit not found with id: " + habitId));

        if (!habit.getUserId().equals(userId)) {
            // Or throw an AccessDeniedException
            throw new SecurityException("User " + userId + " is not authorized to update habit " + habitId);
        }

        Optional<HabitCompletion> existingCompletionOpt = habitCompletionRepository.findByHabitAndCompletionDate(habit, date);

        if (completed) {
            HabitCompletion completion;
            if (existingCompletionOpt.isPresent()) {
                completion = existingCompletionOpt.get();
                if (!completion.isCompleted()) {
                    completion.setCompleted(true);
                }
            } else {
                completion = new HabitCompletion(habit, date, true);
            }
            return habitCompletionRepository.save(completion);
        } else {
            // If marking as not completed, delete the record or set isCompleted to false
            // Current plan suggests deleting, which is simpler for streak calculation if only true entries exist
            if (existingCompletionOpt.isPresent()) {
                // Option 1: Delete the record
                 habitCompletionRepository.delete(existingCompletionOpt.get());
                 return null; // Or return the deleted entity, or a DTO indicating success

                // Option 2: Mark as not completed
                // HabitCompletion completion = existingCompletionOpt.get();
                // completion.setCompleted(false);
                // return habitCompletionRepository.save(completion);
            }
            // If it doesn't exist and we're marking not complete, do nothing or return specific status
            return null;
        }
    }

    public List<HabitCompletion> getHabitCompletionsForHabit(Long habitId, String userId, YearMonth yearMonth) {
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new EntityNotFoundException("Habit not found with id: " + habitId));

        if (!habit.getUserId().equals(userId)) {
            throw new SecurityException("User " + userId + " is not authorized to view completions for habit " + habitId);
        }

        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();
        // We only want to return actual completions, or all attempts?
        // Assuming we return records where isCompleted is true for now.
        return habitCompletionRepository.findByHabitAndIsCompletedAndCompletionDateBetweenOrderByCompletionDateAsc(habit, true, startDate, endDate);
    }

    public List<LocalDate> getCompletedDatesForHabit(Long habitId, String userId, YearMonth yearMonth) {
        List<HabitCompletion> completions = getHabitCompletionsForHabit(habitId, userId, yearMonth);
        return completions.stream().map(HabitCompletion::getCompletionDate).collect(Collectors.toList());
    }


    public int calculateCurrentStreak(Long habitId, String userId) {
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new EntityNotFoundException("Habit not found with id: " + habitId));
        if (!habit.getUserId().equals(userId)) {
            throw new SecurityException("User " + userId + " is not authorized to calculate streak for habit " + habitId);
        }

        // Fetch all completed entries for the habit, sorted by date
        List<HabitCompletion> completions = habitCompletionRepository
                .findByHabitAndIsCompletedAndCompletionDateBetweenOrderByCompletionDateAsc(
                        habit,
                        true,
                        LocalDate.MIN, // Or a more reasonable start date like habit.getCreatedAt().toLocalDate()
                        LocalDate.now()
                );

        if (completions.isEmpty()) {
            return 0;
        }

        int currentStreak = 0;
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        // Check if completed today or yesterday to start the streak count
        boolean foundTodayOrYesterday = false;
        for (int i = completions.size() - 1; i >= 0; i--) {
            if (completions.get(i).getCompletionDate().equals(today) || completions.get(i).getCompletionDate().equals(yesterday)) {
                foundTodayOrYesterday = true;
                break;
            }
        }
        if (!foundTodayOrYesterday && !completions.get(completions.size()-1).getCompletionDate().isBefore(yesterday)) {
             // last completion is neither today nor yesterday, so streak is 0 unless it was long ago
        } else if (!foundTodayOrYesterday) {
            return 0;
        }


        LocalDate expectedDate = today;
        // If not completed today, start checking from yesterday
        if (completions.stream().noneMatch(c -> c.getCompletionDate().equals(today))) {
            expectedDate = yesterday;
        }


        for (int i = completions.size() - 1; i >= 0; i--) {
            HabitCompletion currentCompletion = completions.get(i);
            if (currentCompletion.getCompletionDate().equals(expectedDate)) {
                currentStreak++;
                expectedDate = expectedDate.minusDays(1);
            } else if (currentCompletion.getCompletionDate().isBefore(expectedDate)) {
                // Missed a day
                break;
            }
            // If currentCompletion.getCompletionDate() is after expectedDate, it means there are multiple entries for a day or data issue.
            // Or, if we only look at the last entry for today, this condition might be skipped.
            // For simplicity, this basic streak logic assumes clean, one-entry-per-day data if isCompleted is true.
        }
        return currentStreak;
    }
}
