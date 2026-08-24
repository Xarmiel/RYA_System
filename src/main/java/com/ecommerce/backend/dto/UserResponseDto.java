package com.ecommerce.backend.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UserResponseDto(
    UUID id,
    String nombre,
    String email,
    OffsetDateTime fechaRegistro
) {}