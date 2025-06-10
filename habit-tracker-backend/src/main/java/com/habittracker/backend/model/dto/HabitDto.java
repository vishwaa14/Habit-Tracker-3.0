package com.habittracker.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HabitDto {
    private Long id;
    private String name;
    private String description;
    private String colorHex;
    private String frequencyType;
    private Map<String, Object> frequencyDetails;
    private Integer targetValue;
    private String targetUnit;
    private Integer sortOrder;
    private Boolean archived; // Only for response, not typically for request
}
