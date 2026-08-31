package com.ecommerce.backend.mapper;

import com.ecommerce.backend.dto.request.CategoriaCreateDto;
import com.ecommerce.backend.dto.response.CategoriaResponseDto;
import com.ecommerce.backend.model.Categoria;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class CategoriaMapper {

    public Categoria toEntity(CategoriaCreateDto dto, Categoria parent) {
        Categoria categoria = new Categoria();
        categoria.setParent(parent);
        categoria.setNombre(dto.nombre());
        categoria.setSlug(dto.slug());
        return categoria;
    }

    public CategoriaResponseDto toResponseDto(Categoria categoria) {
        List<CategoriaResponseDto> subcategorias = categoria.getSubcategorias() == null
            ? Collections.emptyList()
            : categoria.getSubcategorias().stream()
                .map(this::toResponseDto)
                .toList();

        return new CategoriaResponseDto(
            categoria.getId(),
            categoria.getParent() != null ? categoria.getParent().getId() : null,
            categoria.getParent() != null ? categoria.getParent().getNombre() : null,
            categoria.getNombre(),
            categoria.getSlug(),
            subcategorias
        );
    }
}