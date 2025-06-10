package com.habittracker.backend.service;

import com.habittracker.backend.model.dto.HabitDto;
import com.habittracker.backend.model.dto.HabitEntryDto;
import com.habittracker.backend.model.entity.Habit;
import com.habittracker.backend.model.entity.HabitEntry;
import com.habittracker.backend.model.entity.User;
import com.habittracker.backend.model.repository.HabitEntryRepository;
import com.habittracker.backend.model.repository.HabitRepository;
import com.habittracker.backend.model.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitEntryRepository habitEntryRepository;
    private final UserRepository userRepository; // To fetch User entity

    @Transactional
    public HabitDto createHabit(Long userId, HabitDto habitDto) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        Habit habit = new Habit();
        habit.setUser(user);
        mapDtoToHabitEntity(habitDto, habit);
        habit.setArchived(false); // Ensure new habits are not archived

        Habit savedHabit = habitRepository.save(habit);
        return mapHabitEntityToDto(savedHabit);
    }

    @Transactional(readOnly = true)
    public List<HabitDto> getHabitsByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            // Or throw EntityNotFoundException, depending on desired behavior for non-existent user
            return Collections.emptyList();
        }
        return habitRepository.findByUserIdAndArchivedFalseOrderBySortOrderAsc(userId)
            .stream()
            .map(this::mapHabitEntityToDto)
            .collect(Collectors.toList());
    }

    @Transactional
    public HabitDto updateHabit(Long habitId, HabitDto habitDto, Long userId) {
        Habit habit = habitRepository.findById(habitId)
            .orElseThrow(() -> new EntityNotFoundException("Habit not found with id: " + habitId));
        if (!habit.getUser().getId().equals(userId)) {
            throw new SecurityException("User does not own this habit");
        }
        mapDtoToHabitEntity(habitDto, habit);
        Habit updatedHabit = habitRepository.save(habit);
        return mapHabitEntityToDto(updatedHabit);
    }

    @Transactional
    public void deleteHabit(Long habitId, Long userId) {
        Habit habit = habitRepository.findById(habitId)
            .orElseThrow(() -> new EntityNotFoundException("Habit not found with id: " + habitId));
        if (!habit.getUser().getId().equals(userId)) {
            throw new SecurityException("User does not own this habit");
        }
        habit.setArchived(true);
        habitRepository.save(habit);
    }

    @Transactional
    public HabitEntryDto logHabitEntry(Long habitId, HabitEntryDto entryDto, Long userId) {
        Habit habit = habitRepository.findById(habitId)
            .orElseThrow(() -> new EntityNotFoundException("Habit not found with id: " + habitId));
        if (!habit.getUser().getId().equals(userId)) {
            throw new SecurityException("User does not own this habit");
        }

        Optional<HabitEntry> existingEntryOpt = habitEntryRepository.findByHabitIdAndEntryDate(habitId, entryDto.getEntryDate());

        HabitEntry habitEntry;
        if (existingEntryOpt.isPresent()) {
            habitEntry = existingEntryOpt.get();
        } else {
            habitEntry = new HabitEntry();
            habitEntry.setHabit(habit);
            habitEntry.setEntryDate(entryDto.getEntryDate());
        }

        habitEntry.setStatus(entryDto.getStatus());
        habitEntry.setValue(entryDto.getValue());
        habitEntry.setNotes(entryDto.getNotes());

        HabitEntry savedEntry = habitEntryRepository.save(habitEntry);
        return mapHabitEntryEntityToDto(savedEntry);
    }

    @Transactional(readOnly = true)
    public List<HabitEntryDto> getHabitEntriesForDateRange(Long habitId, LocalDate startDate, LocalDate endDate, Long userId) {
        Habit habit = habitRepository.findById(habitId)
            .orElseThrow(() -> new EntityNotFoundException("Habit not found with id: " + habitId));
        if (!habit.getUser().getId().equals(userId)) {
            throw new SecurityException("User does not own this habit");
        }
        return habitEntryRepository.findByHabitIdAndEntryDateBetweenOrderByEntryDateAsc(habitId, startDate, endDate)
            .stream()
            .map(this::mapHabitEntryEntityToDto)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getHabitStreak(Long habitId, Long userId) {
        Habit habit = habitRepository.findById(habitId)
            .orElseThrow(() -> new EntityNotFoundException("Habit not found with id: " + habitId));
        if (!habit.getUser().getId().equals(userId)) {
            throw new SecurityException("User does not own this habit");
        }

        List<HabitEntry> entries = habitEntryRepository.findByHabitIdOrderByEntryDateDesc(habitId);
        if (entries.isEmpty()) {
            return 0;
        }

        long currentStreak = 0;
        LocalDate today = LocalDate.now();
        LocalDate expectedDate = today;

        // Check if the latest entry is for today or yesterday
        HabitEntry firstEntry = entries.get(0);
        if ("completed".equalsIgnoreCase(firstEntry.getStatus())) {
            if (firstEntry.getEntryDate().equals(today)) {
                currentStreak++;
                expectedDate = today.minusDays(1);
            } else if (firstEntry.getEntryDate().equals(today.minusDays(1))) {
                currentStreak++;
                expectedDate = today.minusDays(2);
            } else {
                // Latest completed entry is not today or yesterday, streak is 0
                return 0;
            }
        } else {
            // Latest entry is not 'completed', so check if it was today and if so, streak is 0.
            // If latest entry was yesterday and not completed, streak is 0.
            // If latest entry was before yesterday, streak is 0.
             return 0;
        }


        // Iterate through the rest of the entries (skipping the first one if it was used for today)
        int startIndex = (firstEntry.getEntryDate().equals(today) || firstEntry.getEntryDate().equals(today.minusDays(1))) && "completed".equalsIgnoreCase(firstEntry.getStatus()) ? 1 : 0;

        for (int i = startIndex; i < entries.size(); i++) {
            HabitEntry entry = entries.get(i);
            if ("completed".equalsIgnoreCase(entry.getStatus()) && entry.getEntryDate().equals(expectedDate)) {
                currentStreak++;
                expectedDate = expectedDate.minusDays(1);
            } else if (entry.getEntryDate().isBefore(expectedDate) || !"completed".equalsIgnoreCase(entry.getStatus())) {
                // Gap in dates or not completed
                break;
            }
             // If entry.getEntryDate().isAfter(expectedDate), it means there's a duplicate or data issue, ignore and wait for expectedDate.
        }
        return currentStreak;
    }


    // --- Mappers ---
    private HabitDto mapHabitEntityToDto(Habit habit) {
        HabitDto dto = new HabitDto();
        dto.setId(habit.getId());
        dto.setName(habit.getName());
        dto.setDescription(habit.getDescription());
        dto.setColorHex(habit.getColorHex());
        dto.setFrequencyType(habit.getFrequencyType());
        dto.setFrequencyDetails(habit.getFrequencyDetails());
        dto.setTargetValue(habit.getTargetValue());
        dto.setTargetUnit(habit.getTargetUnit());
        dto.setSortOrder(habit.getSortOrder());
        dto.setArchived(habit.getArchived());
        return dto;
    }

    private void mapDtoToHabitEntity(HabitDto dto, Habit habit) {
        habit.setName(dto.getName());
        habit.setDescription(dto.getDescription());
        habit.setColorHex(dto.getColorHex());
        habit.setFrequencyType(dto.getFrequencyType());
        habit.setFrequencyDetails(dto.getFrequencyDetails());
        habit.setTargetValue(dto.getTargetValue());
        habit.setTargetUnit(dto.getTargetUnit());
        if (dto.getSortOrder() != null) { // Sort order might not be present in all DTO uses
            habit.setSortOrder(dto.getSortOrder());
        }
    }

    private HabitEntryDto mapHabitEntryEntityToDto(HabitEntry entry) {
        HabitEntryDto dto = new HabitEntryDto();
        dto.setId(entry.getId());
        dto.setEntryDate(entry.getEntryDate());
        dto.setStatus(entry.getStatus());
        dto.setValue(entry.getValue());
        dto.setNotes(entry.getNotes());
        return dto;
    }
}
