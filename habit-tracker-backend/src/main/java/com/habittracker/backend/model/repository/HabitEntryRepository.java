package com.habittracker.backend.model.repository;

import com.habittracker.backend.model.entity.HabitEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HabitEntryRepository extends JpaRepository<HabitEntry, Long> {

    Optional<HabitEntry> findByHabitIdAndEntryDate(Long habitId, LocalDate entryDate);

    List<HabitEntry> findByHabitIdAndEntryDateBetweenOrderByEntryDateAsc(Long habitId, LocalDate startDate, LocalDate endDate);

    // For streak calculation: get latest entries in descending order
    List<HabitEntry> findByHabitIdAndStatusOrderByEntryDateDesc(Long habitId, String status);

    List<HabitEntry> findByHabitIdOrderByEntryDateDesc(Long habitId);
}
