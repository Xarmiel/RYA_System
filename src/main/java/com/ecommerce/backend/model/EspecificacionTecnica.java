package com.ecommerce.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "especificaciones_tecnicas", schema = "public",
       uniqueConstraints = @UniqueConstraint(name = "uq_prod_especificacion", columnNames = {"producto_id", "clave"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class EspecificacionTecnica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false, length = 50)
    private String clave;

    @Column(nullable = false, length = 100)
    private String valor;
}