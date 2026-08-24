package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.request.ProductoCreateDto;
import com.ecommerce.backend.dto.response.ProductoResponseDto;
import java.util.List;
import java.util.UUID;

public interface ProductoService {
    ProductoResponseDto crearProducto(ProductoCreateDto dto);
    ProductoResponseDto obtenerPorId(UUID id);
    List<ProductoResponseDto> listarActivos();
    List<ProductoResponseDto> listarPorCategoria(Integer categoriaId);
    void desactivarProducto(UUID id);
}