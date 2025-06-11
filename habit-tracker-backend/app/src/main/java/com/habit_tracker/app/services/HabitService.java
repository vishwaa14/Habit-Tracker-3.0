package com.habit_tracker.app.services;

import com.habit_tracker.app.models.Habit;
import com.habit_tracker.app.repositories.HabitRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HabitService {

    @Autowired
    private HabitRepository habitRepository;

    @Transactional
    public Habit addHabit(Habit habit, String userId) {
        // The Habit entity now has setUserId, so it should be set before calling this
        // or passed as an argument if the Habit object doesn't have it yet.
        // Assuming habit object passed in already has userId set.
        if (habit.getUserId() == null || !habit.getUserId().equals(userId)) {
             throw new IllegalArgumentException("Habit's userId must be set and match the provided userId.");
        }
        // Forcing it here to ensure consistency if not set by controller
        habit.setUserId(userId);
        return habitRepository.save(habit);
    }

    public List<Habit> getHabitsByUserId(String userId) {
        return habitRepository.findByUserId(userId); // Requires findByUserId in HabitRepository
    }

    public Habit getHabitById(Long habitId, String userId) {
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new EntityNotFoundException("Habit not found with id: " + habitId));
        if (!habit.getUserId().equals(userId)) {
            throw new SecurityException("User " + userId + " is not authorized to access habit " + habitId);
        }
        return habit;
    }

    @Transactional
    public Habit updateHabit(Long habitId, Habit habitDetails, String userId) {
        Habit existingHabit = getHabitById(habitId, userId); // This also performs auth check

        // Update fields from habitDetails
        existingHabit.setName(habitDetails.getName());
        existingHabit.setDescription(habitDetails.getDescription());
        // userId should not change, createdAt is fixed. updatedAt will be handled by @UpdateTimestamp

        return habitRepository.save(existingHabit);
    }

    @Transactional
    public void deleteHabit(Long habitId, String userId) {
        Habit habit = getHabitById(habitId, userId); // This also performs auth check
        // Consider what to do with HabitCompletions - cascade delete or manual?
        // If @OneToMany on Habit has cascade = CascadeType.REMOVE, completions will be deleted.
        // Otherwise, they need to be manually deleted here if desired.
        // For now, assuming they should be deleted if the habit is deleted.
        // The HabitCompletion entity has @ManyToOne to Habit. Default is no cascade for delete.
        // So, if we need to delete completions, we'd inject HabitCompletionRepository and call deleteAllByHabit(habit)
        habitRepository.delete(habit);
    }
}
