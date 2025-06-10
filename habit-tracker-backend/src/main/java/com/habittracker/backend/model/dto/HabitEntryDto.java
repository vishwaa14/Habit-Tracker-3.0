package com.habittracker.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HabitEntryDto {
    private Long id;
    private LocalDate entryDate;
    private String status;
    private Integer value;
    private String notes;
}
