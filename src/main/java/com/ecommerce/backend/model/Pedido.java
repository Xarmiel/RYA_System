package com.ecommerce.backend.model;

import com.ecommerce.backend.model.enums.EstadoPedido;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "pedidos", schema = "public")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private EstadoPedido estado = EstadoPedido.PENDIENTE;

    @Column(name = "monto_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoTotal;

    @Column(name = "metodo_pago", length = 50)
    private String metodoPago;

    @Column(name = "fecha_registro", updatable = false)
    private OffsetDateTime fechaRegistro;

    @PrePersist
    protected void onCreate() {
        if (this.fechaRegistro == null) {
            this.fechaRegistro = OffsetDateTime.now();
        }
        if (this.estado == null) {
            this.estado = EstadoPedido.PENDIENTE;
        }
    }

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetallePedido> detalles = new ArrayList<>();
}