import { obtenerProductosPorCategoria } from './api.js';
import { Cart } from './cart.js';
import { inicializarMonitorDeRed, crearSkeletonCard, crearTarjetaErrorRed } from './network-ui.js';

async function renderizarCarrusel(categoria, contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  // 1. Mostrar estado de carga (Skeletons)
  contenedor.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    contenedor.appendChild(crearSkeletonCard());
  }

  try {
    // 2. Pedir los datos a nuestra "API"
    const productos = await obtenerProductosPorCategoria(categoria);

    // 3. Limpiar los skeletons
    contenedor.innerHTML = '';

    // 4. Crear el HTML por cada producto
    productos.forEach(producto => {
      const articulo = document.createElement('div');
      articulo.className = 'carousel-item';
      
      // Al hacer clic, redirigimos a la página de detalle con el ID
      articulo.onclick = () => window.location.href = `producto.html?id=${producto.id}`;

      articulo.innerHTML = `
        <div class="img-placeholder">
          <span>[Foto ${producto.fabricante}]</span> 
        </div>
        <div class="product-info">
          <h4 style="color: var(--muted); font-size: 12px;">${producto.fabricante}</h4>
          <h3>${producto.categoria}</h3>
          <span class="price">S/ ${producto.precio.toFixed(2)}</span>
        </div>
        <button class="add-to-cart" onclick="event.stopPropagation(); window.agregarAlCarrito(${producto.id})">
          Añadir al carrito
        </button>
      `;

      contenedor.appendChild(articulo);
    });
  } catch (error) {
    console.error(`Error al cargar la categoría ${categoria}:`, error);
    contenedor.innerHTML = '';
    const errorCard = crearTarjetaErrorRed({
      titulo: `No se pudieron cargar ${categoria}`,
      mensaje: 'Revisa tu conexión a internet para ver los productos recomendados.',
      onRetry: () => {
        renderizarCarrusel(categoria, contenedorId);
      }
    });
    contenedor.appendChild(errorCard);
  }
}

window.agregarAlCarrito = (id) => {
  Cart.addItemById(id);
};

// Ejecutamos la función para llenar las diferentes secciones
document.addEventListener('DOMContentLoaded', () => {
  inicializarMonitorDeRed();
  Cart.init();
  renderizarCarrusel('Placas Madre', 'track-placas');
  renderizarCarrusel('Procesadores', 'track-procesadores');
  renderizarCarrusel('Tarjetas Gráficas', 'track-gpus');

  const searchInput = document.getElementById('headerSearchInput');
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      window.location.href = `index.html?search=${encodeURIComponent(searchInput.value.trim())}`;
    }
  });
});
