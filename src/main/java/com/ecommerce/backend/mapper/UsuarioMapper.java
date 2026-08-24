package com.ecommerce.backend.mapper;

import com.ecommerce.backend.dto.request.UsuarioCreateDto;
import com.ecommerce.backend.dto.response.UsuarioResponseDto;
import com.ecommerce.backend.model.Usuario;
import com.ecommerce.backend.model.enums.RolUsuario;
import org.springframework.stereotype.Component;

@Component
public class UsuarioMapper {

    public Usuario toEntity(UsuarioCreateDto dto) {
        Usuario usuario = new Usuario();
        usuario.setNombre(dto.nombre());
        usuario.setEmail(dto.email());
        usuario.setTelefono(dto.telefono());
        usuario.setPasswordHash(dto.password()); 
        usuario.setRol(dto.rol() != null ? dto.rol() : RolUsuario.CLIENTE);
        return usuario;
    }

    public UsuarioResponseDto toResponseDto(Usuario usuario) {
        return new UsuarioResponseDto(
            usuario.getId(),
            usuario.getNombre(),
            usuario.getEmail(),
            usuario.getTelefono(),
            usuario.getRol(),
            usuario.getFechaRegistro()
        );
    }
}