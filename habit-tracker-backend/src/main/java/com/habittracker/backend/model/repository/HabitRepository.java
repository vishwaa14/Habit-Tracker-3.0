package com.habittracker.backend.model.repository;

import com.habittracker.backend.model.entity.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HabitRepository extends JpaRepository<Habit, Long> {

    List<Habit> findByUserIdAndArchivedFalseOrderBySortOrderAsc(Long userId);

    // Optional: if you need to check ownership before an operation and also fetch the user
    @Query("SELECT h FROM Habit h JOIN FETCH h.user WHERE h.id = :habitId")
    Optional<Habit> findByIdAndFetchUser(Long habitId);
}
