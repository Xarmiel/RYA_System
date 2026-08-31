package com.ecommerce.backend.dto.response;

import java.time.OffsetDateTime;
import java.util.Map;

public record ErrorResponseDto(
    int status,
    String error,
    String message,
    OffsetDateTime timestamp,
    Map<String, String> validationErrors
) {
    public ErrorResponseDto(int status, String error, String message) {
        this(status, error, message, OffsetDateTime.now(), null);
    }

    public ErrorResponseDto(int status, String error, String message, Map<String, String> validationErrors) {
        this(status, error, message, OffsetDateTime.now(), validationErrors);
    }
}