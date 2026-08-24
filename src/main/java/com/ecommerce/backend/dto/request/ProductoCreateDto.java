// src/main/java/com/ecommerce/backend/dto/request/ProductoCreateDTO.java
package com.ecommerce.backend.dto.request;

import com.ecommerce.backend.model.enums.TipoProductoEnum;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public record ProductoCreateDto(
    @NotNull(message = "La categoría es obligatoria")
    Integer categoriaId,

    @NotBlank(message = "El SKU es obligatorio")
    @Size(max = 60)
    String sku,

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 200)
    String nombre,

    String descripcion,

    @NotNull(message = "El precio base es obligatorio")
    @DecimalMin(value = "0.01", message = "El precio base debe ser mayor a 0")
    BigDecimal precioBase,

    @NotNull(message = "El tipo de producto es obligatorio")
    TipoProductoEnum tipoProducto,

    @Min(value = 0, message = "El stock no puede ser negativo")
    Integer stock,

    Boolean activo,
    List<EspecificacionTecnicaCreateDto> especificaciones
) {}