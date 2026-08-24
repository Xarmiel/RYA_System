package com.ecommerce.backend.dto.response;

import com.ecommerce.backend.model.enums.RolUsuario;
import java.time.OffsetDateTime;
import java.util.UUID;

public record UsuarioResponseDto(
    UUID id,
    String nombre,
    String email,
    String telefono,
    RolUsuario rol,
    OffsetDateTime fechaRegistro
) {}