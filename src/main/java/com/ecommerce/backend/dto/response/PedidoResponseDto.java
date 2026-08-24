package com.ecommerce.backend.dto.response;

import com.ecommerce.backend.model.enums.EstadoPedido;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record PedidoResponseDto(
    UUID id,
    UUID usuarioId,
    String usuarioNombre,
    EstadoPedido estado,
    BigDecimal montoTotal,
    String metodoPago,
    OffsetDateTime fechaRegistro,
    List<DetallePedidoResponseDto> detalles
) {}