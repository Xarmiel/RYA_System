package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Producto;
import com.ecommerce.backend.model.enums.TipoProductoEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, UUID> {
    Optional<Producto> findBySku(String sku);
    List<Producto> findByActivoTrue();
    List<Producto> findByCategoriaId(Integer categoriaId);
    List<Producto> findByTipoProducto(TipoProductoEnum tipoProducto);

    @Query("SELECT p FROM Producto p LEFT JOIN FETCH p.especificaciones WHERE p.id = :id")
    Optional<Producto> findByIdWithEspecificaciones(@Param("id") UUID id);
}