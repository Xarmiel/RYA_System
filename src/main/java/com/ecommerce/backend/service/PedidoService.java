package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.request.PedidoCreateDto;
import com.ecommerce.backend.dto.response.PedidoResponseDto;
import com.ecommerce.backend.model.enums.EstadoPedido;
import java.util.List;
import java.util.UUID;

public interface PedidoService {
    PedidoResponseDto crearPedido(PedidoCreateDto dto);
    PedidoResponseDto obtenerPorId(UUID id);
    List<PedidoResponseDto> listarPorUsuario(UUID usuarioId);
    PedidoResponseDto actualizarEstado(UUID id, EstadoPedido estado);
}