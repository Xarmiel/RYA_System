package com.ecommerce.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record PedidoCreateDto(
    @NotNull(message = "El ID de usuario es obligatorio")
    UUID usuarioId,

    @Size(max = 50)
    String metodoPago,

    @NotEmpty(message = "El pedido debe contener al menos un producto")
    @Valid
    List<DetallePedidoCreateDto> detalles
) {}