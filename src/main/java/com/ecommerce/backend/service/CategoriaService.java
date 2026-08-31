package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.request.CategoriaCreateDto;
import com.ecommerce.backend.dto.response.CategoriaResponseDto;
import java.util.List;

public interface CategoriaService {
    CategoriaResponseDto crearCategoria(CategoriaCreateDto dto);
    CategoriaResponseDto obtenerPorId(Integer id);
    CategoriaResponseDto obtenerPorSlug(String slug);
    List<CategoriaResponseDto> listarRaices();
    List<CategoriaResponseDto> listarTodas();
}