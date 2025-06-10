package com.habit_tracker.app.repositories;

import com.habit_tracker.app.models.Habit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HabitRepository extends JpaRepository<Habit, Long> {
}