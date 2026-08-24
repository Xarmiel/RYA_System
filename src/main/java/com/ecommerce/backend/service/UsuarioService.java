package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.request.UsuarioCreateDto;
import com.ecommerce.backend.dto.response.UsuarioResponseDto;
import java.util.List;
import java.util.UUID;

public interface UsuarioService {
    UsuarioResponseDto crearUsuario(UsuarioCreateDto dto);
    UsuarioResponseDto obtenerPorId(UUID id);
    UsuarioResponseDto obtenerPorEmail(String email);
    List<UsuarioResponseDto> listarTodos();
}