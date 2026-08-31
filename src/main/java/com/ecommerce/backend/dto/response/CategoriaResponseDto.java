package com.ecommerce.backend.dto.response;

import java.util.List;

public record CategoriaResponseDto(
    Integer id,
    Integer parentId,
    String parentNombre,
    String nombre,
    String slug,
    List<CategoriaResponseDto> subcategorias
) {}