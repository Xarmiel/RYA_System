package com.ecommerce.backend.dto.response;

import com.ecommerce.backend.model.enums.TipoProductoEnum;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ProductoResponseDto(
    UUID id,
    Integer subcategoriaId,
    String subcategoriaNombre,
    String sku,
    String nombre,
    String descripcion,
    BigDecimal precioBase,
    TipoProductoEnum tipoProducto,
    Integer stock,
    Boolean activo,
    OffsetDateTime fechaRegistro,
    List<EspecificacionTecnicaResponseDto> especificaciones
) {}