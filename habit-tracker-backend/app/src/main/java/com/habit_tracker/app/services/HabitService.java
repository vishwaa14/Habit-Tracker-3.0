package com.habit_tracker.app.services;

import com.habit_tracker.app.models.Habit;
import com.habit_tracker.app.repositories.HabitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class HabitService {
    @Autowired
    private HabitRepository habitRepository;

    public List<Habit> getAllHabits() {
        return habitRepository.findAll();
    }

    public Habit addHabit(Habit habit) {
        return habitRepository.save(habit);
    }
}
