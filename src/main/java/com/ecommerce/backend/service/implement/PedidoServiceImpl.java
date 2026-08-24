package com.ecommerce.backend.service.implement;

import com.ecommerce.backend.dto.request.DetallePedidoCreateDto;
import com.ecommerce.backend.dto.request.PedidoCreateDto;
import com.ecommerce.backend.dto.response.PedidoResponseDto;
import com.ecommerce.backend.exception.BadRequestException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.mapper.PedidoMapper;
import com.ecommerce.backend.model.DetallePedido;
import com.ecommerce.backend.model.Pedido;
import com.ecommerce.backend.model.Producto;
import com.ecommerce.backend.model.Usuario;
import com.ecommerce.backend.model.enums.EstadoPedido;
import com.ecommerce.backend.repository.PedidoRepository;
import com.ecommerce.backend.repository.ProductoRepository;
import com.ecommerce.backend.repository.UsuarioRepository;
import com.ecommerce.backend.service.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PedidoServiceImpl implements PedidoService {

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;
    private final PedidoMapper pedidoMapper;

    @Override
    @Transactional
    public PedidoResponseDto crearPedido(PedidoCreateDto dto) {
        Usuario usuario = usuarioRepository.findById(dto.usuarioId())
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + dto.usuarioId()));

        Pedido pedido = new Pedido();
        pedido.setUsuario(usuario);
        pedido.setMetodoPago(dto.metodoPago());
        pedido.setEstado(EstadoPedido.PENDIENTE);

        BigDecimal montoTotal = BigDecimal.ZERO;
        List<DetallePedido> detalles = new ArrayList<>();

        for (DetallePedidoCreateDto itemDto : dto.detalles()) {
            Producto producto = productoRepository.findById(itemDto.productoId())
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + itemDto.productoId()));

            if (!producto.getActivo()) {
                throw new BadRequestException("El producto no está disponible para la venta: " + producto.getNombre());
            }

            if (producto.getStock() < itemDto.cantidad()) {
                throw new BadRequestException("Stock insuficiente para el producto: " + producto.getNombre());
            }

            producto.setStock(producto.getStock() - itemDto.cantidad());
            productoRepository.save(producto);

            DetallePedido detalle = new DetallePedido();
            detalle.setPedido(pedido);
            detalle.setProducto(producto);
            detalle.setCantidad(itemDto.cantidad());
            detalle.setPrecioUnitario(producto.getPrecioBase());

            BigDecimal subtotal = producto.getPrecioBase().multiply(BigDecimal.valueOf(itemDto.cantidad()));
            montoTotal = montoTotal.add(subtotal);

            detalles.add(detalle);
        }

        pedido.setMontoTotal(montoTotal);
        pedido.setDetalles(detalles);

        Pedido saved = pedidoRepository.save(pedido);
        return pedidoMapper.toResponseDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PedidoResponseDto obtenerPorId(UUID id) {
        return pedidoRepository.findByIdWithDetalles(id)
            .map(pedidoMapper::toResponseDto)
            .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado con ID: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PedidoResponseDto> listarPorUsuario(UUID usuarioId) {
        return pedidoRepository.findByUsuarioId(usuarioId).stream()
            .map(pedidoMapper::toResponseDto)
            .toList();
    }

    @Override
    @Transactional
    public PedidoResponseDto actualizarEstado(UUID id, EstadoPedido nuevoEstado) {
        Pedido pedido = pedidoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado con ID: " + id));

        pedido.setEstado(nuevoEstado);
        return pedidoMapper.toResponseDto(pedidoRepository.save(pedido));
    }
}