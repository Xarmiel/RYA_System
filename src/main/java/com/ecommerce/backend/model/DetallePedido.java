package com.ecommerce.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.math.BigDecimal;

@Entity
@Table(name = "detalle_pedido", schema = "public")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class DetallePedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Column(name = "subtotal", precision = 10, scale = 2, insertable = false, updatable = false)
    @Generated
    private BigDecimal subtotal;

    public BigDecimal getSubtotal() {
        if (this.subtotal != null) {
            return this.subtotal;
        }
        if (this.precioUnitario != null && this.cantidad != null) {
            return this.precioUnitario.multiply(BigDecimal.valueOf(this.cantidad));
        }
        return BigDecimal.ZERO;
    }
}