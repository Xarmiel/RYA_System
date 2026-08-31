package com.ecommerce.backend.mapper;

import com.ecommerce.backend.dto.request.ProductoCreateDto;
import com.ecommerce.backend.dto.response.EspecificacionTecnicaResponseDto;
import com.ecommerce.backend.dto.response.ProductoResponseDto;
import com.ecommerce.backend.model.Categoria;
import com.ecommerce.backend.model.EspecificacionTecnica;
import com.ecommerce.backend.model.Producto;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class ProductoMapper {

    public Producto toEntity(ProductoCreateDto dto, Categoria subcategoria) {
        Producto producto = new Producto();
        producto.setCategoria(subcategoria);
        producto.setSku(dto.sku());
        producto.setNombre(dto.nombre());
        producto.setDescripcion(dto.descripcion());
        producto.setPrecioBase(dto.precioBase());
        producto.setTipoProducto(dto.tipoProducto());
        producto.setStock(dto.stock() != null ? dto.stock() : 0);
        producto.setActivo(dto.activo() != null ? dto.activo() : true);

        if (dto.especificaciones() != null) {
            List<EspecificacionTecnica> especificaciones = dto.especificaciones().stream()
                .map(e -> {
                    EspecificacionTecnica esp = new EspecificacionTecnica();
                    esp.setClave(e.clave());
                    esp.setValor(e.valor());
                    esp.setProducto(producto);
                    return esp;
                }).toList();
            producto.setEspecificaciones(especificaciones);
        }
        return producto;
    }

    public ProductoResponseDto toResponseDto(Producto producto) {
        List<EspecificacionTecnicaResponseDto> especificaciones = producto.getEspecificaciones() == null 
            ? Collections.emptyList()
            : producto.getEspecificaciones().stream()
                .map(e -> new EspecificacionTecnicaResponseDto(e.getId(), e.getClave(), e.getValor()))
                .toList();

        return new ProductoResponseDto(
            producto.getId(),
            producto.getCategoria() != null ? producto.getCategoria().getId() : null,
            producto.getCategoria() != null ? producto.getCategoria().getNombre() : null,
            producto.getSku(),
            producto.getNombre(),
            producto.getDescripcion(),
            producto.getPrecioBase(),
            producto.getTipoProducto(),
            producto.getStock(),
            producto.getActivo(),
            producto.getFechaRegistro(),
            especificaciones
        );
    }
}