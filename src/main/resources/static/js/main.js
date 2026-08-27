import { obtenerProductosPorCategoria } from './api.js';
import { crearTarjetaProducto } from './product-card.js';
import { JERARQUIA_CATEGORIAS } from './config.js';
import { inicializarCarruseles } from './carousel.js';
import { inicializarFiltros } from './filters.js';
import { inicializarSidebar } from './sidebar.js';

const contenedorCatalogo = document.getElementById('carousels-container');

// Genera un id de track a partir del nombre de categoría: "Tarjetas Gráficas" -> "track-tarjetas-graficas"
function slug(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function crearSeccionCarrusel(categoria) {
  const section = document.createElement('section');
  section.className = 'section carousel-section';
  section.innerHTML = `
    <div class="carousel-header">
      <h2 class="section-title">${categoria}</h2>
      <div class="carousel-controls">
        <button class="carousel-btn btn-prev" aria-label="Anterior">&#8592;</button>
        <button class="carousel-btn btn-next" aria-label="Siguiente">&#8594;</button>
      </div>
    </div>
    <div class="carousel-track" id="track-${slug(categoria)}"></div>
  `;
  return section;
}

async function construirCatalogo() {
  if (!contenedorCatalogo) return;

  // Recorremos todas las categorías definidas (Hardware + Periféricos) en orden.
  const categorias = Object.values(JERARQUIA_CATEGORIAS).flat();

  // Pedimos los productos de todas las categorías en paralelo.
  const resultados = await Promise.all(
    categorias.map(categoria =>
      obtenerProductosPorCategoria(categoria).then(productos => ({ categoria, productos }))
    )
  );

  resultados.forEach(({ categoria, productos }) => {
    // Si una categoría todavía no tiene stock cargado en data.js, se omite
    // automáticamente en vez de mostrar un carrusel vacío.
    if (!productos.length) return;

    const seccion = crearSeccionCarrusel(categoria);
    contenedorCatalogo.appendChild(seccion);

    const track = seccion.querySelector('.carousel-track');
    productos.forEach(producto => track.appendChild(crearTarjetaProducto(producto)));
  });

  // Los botones prev/next del carrusel se inicializan una vez que ya existen en el DOM.
  inicializarCarruseles();
}

window.agregarAlCarrito = (id) => {
  // TODO: conectar con el carrito real.
  console.log('Añadido al carrito:', id);
};

document.addEventListener('DOMContentLoaded', () => {
  inicializarSidebar();
  inicializarFiltros();
  construirCatalogo();
});