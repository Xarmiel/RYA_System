package com.ecommerce.backend.mapper;

import com.ecommerce.backend.dto.UserRequestDto;
import com.ecommerce.backend.dto.UserResponseDto;
import com.ecommerce.backend.model.Usuario;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public Usuario toEntity(UserRequestDto dto) {
        return Usuario.builder()
                .nombre(dto.nombre())
                .email(dto.email())
                .passwordHash(dto.password()) // Encriptar antes de persistir
                .build();
    }

    public UserResponseDto toResponseDto(Usuario entity) {
        return new UserResponseDto(
                entity.getId(),
                entity.getNombre(),
                entity.getEmail(),
                entity.getFechaRegistro()
        );
    }
}