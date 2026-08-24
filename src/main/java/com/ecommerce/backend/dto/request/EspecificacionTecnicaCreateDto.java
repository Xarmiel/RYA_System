package com.ecommerce.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record EspecificacionTecnicaCreateDto(
    @NotBlank String clave,
    @NotBlank String valor
) {}