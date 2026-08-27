import { obtenerProductosPorCategoria } from './api.js';

async function renderizarCarrusel(categoria, contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  // 1. Pedir los datos a nuestra "API"
  const productos = await obtenerProductosPorCategoria(categoria);

  // 2. Limpiar el contenedor (por si acaso)
  contenedor.innerHTML = '';

  // 3. Crear el HTML por cada producto
  productos.forEach(producto => {
    const articulo = document.createElement('div');
    articulo.className = 'carousel-item';
    
    // Al hacer clic, redirigimos a la página de detalle con el ID
    articulo.onclick = () => window.location.href = `producto.html?id=${producto.id}`;

    articulo.innerHTML = `
      <div class="img-placeholder">
        <!-- Reemplazar con img real cuando tengas las URLs -->
        <span>[Foto ${producto.fabricante}]</span> 
      </div>
      <div class="product-info">
        <h4 style="color: var(--muted); font-size: 12px;">${producto.fabricante}</h4>
        <h3>${producto.categoria}</h3>
        <span class="price">S/ ${producto.precio.toFixed(2)}</span>
      </div>
      <button class="add-to-cart" onclick="event.stopPropagation(); agregarAlCarrito(${producto.id})">
        Añadir al carrito
      </button>
    `;

    contenedor.appendChild(articulo);
  });
}

// Ejecutamos la función para llenar las diferentes secciones
document.addEventListener('DOMContentLoaded', () => {
  renderizarCarrusel('Placas Madre', 'track-placas');
  renderizarCarrusel('Procesadores', 'track-procesadores');
  renderizarCarrusel('Tarjetas Gráficas', 'track-gpus');
});