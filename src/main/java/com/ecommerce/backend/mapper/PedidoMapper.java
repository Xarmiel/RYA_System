package com.ecommerce.backend.mapper;

import com.ecommerce.backend.dto.response.DetallePedidoResponseDto;
import com.ecommerce.backend.dto.response.PedidoResponseDto;
import com.ecommerce.backend.model.Pedido;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Component
public class PedidoMapper {

    public PedidoResponseDto toResponseDto(Pedido pedido) {
        List<DetallePedidoResponseDto> detalles = pedido.getDetalles() == null 
            ? Collections.emptyList()
            : pedido.getDetalles().stream()
                .map(d -> new DetallePedidoResponseDto(
                    d.getId(),
                    d.getProducto().getId(),
                    d.getProducto().getNombre(),
                    d.getProducto().getSku(),
                    d.getCantidad(),
                    d.getPrecioUnitario(),
                    d.getSubtotal() != null 
                        ? d.getSubtotal() 
                        : d.getPrecioUnitario().multiply(BigDecimal.valueOf(d.getCantidad()))
                )).toList();

        return new PedidoResponseDto(
            pedido.getId(),
            pedido.getUsuario().getId(),
            pedido.getUsuario().getNombre(),
            pedido.getEstado(),
            pedido.getMontoTotal(),
            pedido.getMetodoPago(),
            pedido.getFechaRegistro(),
            detalles
        );
    }
}