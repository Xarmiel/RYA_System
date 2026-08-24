package com.ecommerce.backend.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record DetallePedidoResponseDto(
    Integer id,
    UUID productoId,
    String productoNombre,
    String productoSku,
    Integer cantidad,
    BigDecimal precioUnitario,
    BigDecimal subtotal
) {}