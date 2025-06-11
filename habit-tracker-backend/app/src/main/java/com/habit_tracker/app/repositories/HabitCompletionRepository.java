package com.habit_tracker.app.repositories;

import com.habit_tracker.app.models.Habit;
import com.habit_tracker.app.models.HabitCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HabitCompletionRepository extends JpaRepository<HabitCompletion, Long> {

    Optional<HabitCompletion> findByHabitAndCompletionDate(Habit habit, LocalDate date);

    List<HabitCompletion> findByHabitAndCompletionDateBetweenOrderByCompletionDateAsc(Habit habit, LocalDate startDate, LocalDate endDate);

    // If we want to find only completed ones within a range
    List<HabitCompletion> findByHabitAndIsCompletedAndCompletionDateBetweenOrderByCompletionDateAsc(Habit habit, boolean isCompleted, LocalDate startDate, LocalDate endDate);

    // For streak calculation, getting all completions for a habit sorted
    List<HabitCompletion> findByHabitOrderByCompletionDateAsc(Habit habit);

    void deleteByHabitAndCompletionDate(Habit habit, LocalDate date);
}
