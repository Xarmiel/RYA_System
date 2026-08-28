const contenedorCatalogo = document.getElementById('carousels-container');
const searchInput = document.getElementById('catalogSearchInput') || document.querySelector('.search-box input');
const sortSelect = document.getElementById('catalogSortSelect') || document.querySelector('.sort-box select');

let todosLosProductos = [];
let busquedaActual = '';
let ordenActual = 'relevance'; // 'relevance' | 'price-asc' | 'price-desc' | 'brand-asc'

/**
 * Normaliza un texto eliminando tildes y pasando a minúsculas para comparaciones flexibles.
 */
function normalizarTexto(texto) {
  if (!texto) return '';
  return texto
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Convierte un nombre de categoría en slug para IDs del DOM: "Placas Madre" -> "placas-madre"
 */
function slug(texto) {
  return normalizarTexto(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Evalúa si un producto cumple con el término de búsqueda en tiempo real:
 * - Coincidencia por Fabricante / Marca (ej. "ASUS", "MSI", "Corsair")
 * - Coincidencia por Categoría (ej. "Placas Madre", "Ratones", "GPU")
 * - Coincidencia por Atributos técnicos (ej. "DDR5", "LGA1700", "PCIe 5.0", "NVMe", "RGB", "4K")
 * - Soporte multi-palabra (ej. "asus ddr5", "logitech inalambrico")
 */
function productoCumpleBusqueda(producto, query) {
  if (!query) return true;
  const qNormalizada = normalizarTexto(query);
  if (!qNormalizada) return true;

  // 1. Coincidencia directa en Fabricante o Categoría
  const fabricanteNorm = normalizarTexto(producto.fabricante);
  const categoriaNorm = normalizarTexto(producto.categoria);

  if (fabricanteNorm.includes(qNormalizada) || categoriaNorm.includes(qNormalizada)) {
    return true;
  }

  // 2. Coincidencia en cualquiera de los atributos técnicos del producto
  const atributosValues = Object.values(producto.atributos || {});
  for (const val of atributosValues) {
    if (typeof val === 'string' && normalizarTexto(val).includes(qNormalizada)) {
      return true;
    }
  }

  // 3. Coincidencia multi-término (todas las palabras deben estar presentes)
  const palabras = qNormalizada.split(/\s+/).filter(Boolean);
  if (palabras.length > 1) {
    const cuerpoTexto = `${fabricanteNorm} ${categoriaNorm} ${atributosValues.map(normalizarTexto).join(' ')}`;
    const coincidenTodas = palabras.every(p => cuerpoTexto.includes(p));
    if (coincidenTodas) return true;
  }

  return false;
}

/**
 * Evalúa si un producto pasa los filtros laterales activos (Categoría seleccionada y Atributos).
 */
function productoCumpleFiltros(producto, estadoFiltros) {
  if (!estadoFiltros) return true;
  const { categoriaActual, filtrosSeleccionados } = estadoFiltros;

  // Si hay una categoría activa en el sidebar
  if (categoriaActual && producto.categoria !== categoriaActual) {
    return false;
  }

  // Si hay filtros específicos de atributos activos
  if (filtrosSeleccionados && typeof filtrosSeleccionados === 'object') {
    for (const [clave, valores] of Object.entries(filtrosSeleccionados)) {
      if (!valores || valores.length === 0) continue;
      const valorProd = clave === 'fabricante' ? producto.fabricante : producto.atributos?.[clave];
      if (!valores.includes(valorProd)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Ordena un arreglo de productos según el criterio seleccionado:
 * - 'price-asc': Menor a Mayor precio
 * - 'price-desc': Mayor a Menor precio
 * - 'brand-asc': Fabricante (A-Z)
 * - 'relevance': Orden por defecto (ID)
 */
function ordenarProductos(lista, criterio) {
  const copia = [...lista];
  switch (criterio) {
    case 'price-asc':
      return copia.sort((a, b) => Number(a.precio) - Number(b.precio));
    case 'price-desc':
      return copia.sort((a, b) => Number(b.precio) - Number(a.precio));
    case 'brand-asc':
      return copia.sort((a, b) => (a.fabricante || '').localeCompare(b.fabricante || '', 'es', { sensitivity: 'base' }));
    case 'relevance':
    default:
      return copia.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  }
}

/**
 * Crea la estructura HTML para una sección de carrusel de una categoría
 */
function crearSeccionCarrusel(categoria, cantidadTotal) {
  const section = document.createElement('section');
  section.className = 'section carousel-section';
  section.innerHTML = `
    <div class="carousel-header">
      <h2 class="section-title">
        ${escapeHtml(categoria)}
        <span class="category-count">(${cantidadTotal})</span>
      </h2>
      <div class="carousel-controls">
        <button class="carousel-btn btn-prev" aria-label="Anterior en ${escapeHtml(categoria)}">&#8592;</button>
        <button class="carousel-btn btn-next" aria-label="Siguiente en ${escapeHtml(categoria)}">&#8594;</button>
      </div>
    </div>
    <div class="carousel-track" id="track-${slug(categoria)}"></div>
  `;
  return section;
}

/**
 * Renderiza el catálogo completo aplicando búsqueda en vivo, filtros laterales y ordenamiento dinámico.
 */
function renderizarCatalogo() {
  const cont = document.getElementById('carousels-container');
  if (!cont) return;

  const fnObtenerFiltros = (typeof window !== 'undefined' && window.obtenerEstadoFiltros) ? window.obtenerEstadoFiltros : (typeof obtenerEstadoFiltros === 'function' ? obtenerEstadoFiltros : () => ({}));
  const estadoFiltros = fnObtenerFiltros();
  
  // 1. Filtrar productos según búsqueda y filtros laterales
  const productosFiltrados = todosLosProductos.filter(p => 
    productoCumpleBusqueda(p, busquedaActual) && productoCumpleFiltros(p, estadoFiltros)
  );

  cont.innerHTML = '';

  // 2. Feedback visual de búsqueda activa o filtros si están aplicados
  const tieneBusqueda = busquedaActual.trim().length > 0;
  const tieneFiltroCat = !!estadoFiltros.categoriaActual;
  const totalFiltrosAttr = Object.values(estadoFiltros.filtrosSeleccionados || {}).reduce((acc, arr) => acc + (arr ? arr.length : 0), 0);

  if (tieneBusqueda || tieneFiltroCat || totalFiltrosAttr > 0) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'search-results-feedback';

    let descText = `Mostrando <strong>${productosFiltrados.length}</strong> producto${productosFiltrados.length === 1 ? '' : 's'}`;
    if (tieneBusqueda) {
      descText += ` para "<strong>${escapeHtml(busquedaActual)}</strong>"`;
    }
    if (tieneFiltroCat) {
      descText += ` en categoría <strong>${escapeHtml(estadoFiltros.categoriaActual)}</strong>`;
    }
    if (totalFiltrosAttr > 0) {
      descText += ` (${totalFiltrosAttr} filtro${totalFiltrosAttr === 1 ? '' : 's'} aplicado${totalFiltrosAttr === 1 ? '' : 's'})`;
    }

    feedbackDiv.innerHTML = `
      <span class="search-results-text">${descText}</span>
      <button type="button" class="btn-reset-search-inline" id="btnResetAllFilters">Limpiar todo</button>
    `;

    feedbackDiv.querySelector('#btnResetAllFilters')?.addEventListener('click', () => {
      limpiarTodo();
    });

    cont.appendChild(feedbackDiv);
  }

  // 3. Caso: Sin resultados
  if (productosFiltrados.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'no-results-box';
    noResults.innerHTML = `
      <div class="no-results-icon">🔍</div>
      <h3>No encontramos resultados ${tieneBusqueda ? `para "<span>${escapeHtml(busquedaActual)}</span>"` : ''}</h3>
      <p>Intenta buscar por marca (ej. <strong>ASUS</strong>, <strong>MSI</strong>, <strong>Corsair</strong>, <strong>Logitech</strong>), categoría (ej. <strong>Procesadores</strong>) o especificaciones (ej. <strong>DDR5</strong>, <strong>LGA1700</strong>, <strong>4K</strong>).</p>
      <button type="button" class="btn-clear-search" id="btnEmptyReset">Limpiar búsqueda y filtros</button>
    `;

    noResults.querySelector('#btnEmptyReset')?.addEventListener('click', () => {
      limpiarTodo();
    });

    cont.appendChild(noResults);
    return;
  }

  // 4. Agrupar productos filtrados por categoría respetando la jerarquía definida
  const jerarquiaCfg = (typeof window !== 'undefined' && window.JERARQUIA_CATEGORIAS) ? window.JERARQUIA_CATEGORIAS : (typeof JERARQUIA_CATEGORIAS !== 'undefined' ? JERARQUIA_CATEGORIAS : {});
  const todasLasCategorias = Object.values(jerarquiaCfg).flat();
  
  const categoriasPresentes = [...new Set(productosFiltrados.map(p => p.categoria))];
  const ordenCategorias = [
    ...todasLasCategorias.filter(c => categoriasPresentes.includes(c)),
    ...categoriasPresentes.filter(c => !todasLasCategorias.includes(c))
  ];

  const fnCrearTarjeta = (typeof window !== 'undefined' && window.crearTarjetaProducto) ? window.crearTarjetaProducto : (typeof crearTarjetaProducto === 'function' ? crearTarjetaProducto : null);

  ordenCategorias.forEach(catNombre => {
    const productosEnCategoria = productosFiltrados.filter(p => p.categoria === catNombre);
    if (!productosEnCategoria.length) return;

    // Aplicar ordenamiento dinámico a los productos dentro de la categoría
    const productosOrdenados = ordenarProductos(productosEnCategoria, ordenActual);

    const seccion = crearSeccionCarrusel(catNombre, productosOrdenados.length);
    cont.appendChild(seccion);

    const track = seccion.querySelector('.carousel-track');
    if (track && fnCrearTarjeta) {
      productosOrdenados.forEach(p => {
        track.appendChild(fnCrearTarjeta(p));
      });
    }
  });

  // 5. Inicializar eventos de navegación de los carruseles creados
  const fnInitCarruseles = (typeof window !== 'undefined' && window.inicializarCarruseles) ? window.inicializarCarruseles : (typeof inicializarCarruseles === 'function' ? inicializarCarruseles : null);
  if (fnInitCarruseles) fnInitCarruseles();
}

/**
 * Limpia el buscador y todos los filtros para volver a la vista completa del catálogo.
 */
function limpiarTodo() {
  busquedaActual = '';
  if (searchInput) searchInput.value = '';
  if (sortSelect) sortSelect.value = 'relevance';
  ordenActual = 'relevance';
  
  const fnResetFiltros = (typeof window !== 'undefined' && window.resetearFiltros) ? window.resetearFiltros : (typeof resetearFiltros === 'function' ? resetearFiltros : null);
  if (fnResetFiltros) fnResetFiltros();
  
  actualizarUrlBusqueda('');
  renderizarCatalogo();
}

/**
 * Actualiza la URL con el parámetro de búsqueda sin recargar la página
 */
function actualizarUrlBusqueda(query) {
  try {
    const url = new URL(window.location);
    if (query && query.trim()) {
      url.searchParams.set('search', query.trim());
    } else {
      url.searchParams.delete('search');
    }
    window.history.replaceState({}, '', url);
  } catch (e) {
    // Ignorar si el navegador restringe replaceState en file://
  }
}

/**
 * Escapa caracteres HTML para prevenir inyecciones al renderizar texto del usuario
 */
function escapeHtml(texto) {
  if (!texto) return '';
  return texto.toString().replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

/**
 * Configura los eventos interactivos de la barra de búsqueda y el selector de orden
 */
function inicializarBuscadorYOrdenamiento() {
  const inputEl = document.getElementById('catalogSearchInput') || document.querySelector('.search-box input');
  const selEl = document.getElementById('catalogSortSelect') || document.querySelector('.sort-box select');

  // 1. Búsqueda en tiempo real (evento input)
  if (inputEl) {
    inputEl.addEventListener('input', (e) => {
      busquedaActual = e.target.value;
      actualizarUrlBusqueda(busquedaActual);
      renderizarCatalogo();
    });

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        inputEl.value = '';
        busquedaActual = '';
        actualizarUrlBusqueda('');
        renderizarCatalogo();
      }
    });
  }

  // 2. Ordenamiento dinámico (evento change)
  if (selEl) {
    selEl.addEventListener('change', (e) => {
      ordenActual = e.target.value;
      renderizarCatalogo();
    });
  }

  // 3. Escuchar cambios provenientes del menú de filtros lateral
  window.addEventListener('filtrosActualizados', () => {
    renderizarCatalogo();
  });
}

/**
 * Expone la función global para agregar productos al carrito
 */
window.agregarAlCarrito = (id) => {
  if (window.Cart && window.Cart.addItemById) {
    window.Cart.addItemById(id);
  }
};

/**
 * Carga los productos desde la fuente de datos mostrando skeletons y renderizando el catálogo.
 */
async function cargarDatosCatalogo() {
  const cont = document.getElementById('carousels-container');
  if (!cont) return;

  // 1. Mostrar estado de carga (Skeletons)
  const fnSkeletons = (typeof window !== 'undefined' && window.renderizarSkeletonsCatalogo) ? window.renderizarSkeletonsCatalogo : (typeof renderizarSkeletonsCatalogo === 'function' ? renderizarSkeletonsCatalogo : null);
  if (fnSkeletons) fnSkeletons(cont, 3, 4);

  try {
    const fetchFn = (typeof window !== 'undefined' && window.fetchProductos) ? window.fetchProductos : (typeof fetchProductos === 'function' ? fetchProductos : null);
    if (fetchFn) {
      todosLosProductos = await fetchFn();
    } else if (typeof PRODUCTOS_DATA !== 'undefined') {
      todosLosProductos = [...PRODUCTOS_DATA];
    } else if (window.PRODUCTOS_DATA) {
      todosLosProductos = [...window.PRODUCTOS_DATA];
    }
    
    // Renderizamos el catálogo completo
    renderizarCatalogo();
  } catch (error) {
    console.error('Error al obtener los productos del catálogo:', error);
    
    // Si ocurre cualquier error, cargamos directamente los datos locales de emergencia
    if (typeof PRODUCTOS_DATA !== 'undefined') {
      todosLosProductos = [...PRODUCTOS_DATA];
      renderizarCatalogo();
    } else if (window.PRODUCTOS_DATA) {
      todosLosProductos = [...window.PRODUCTOS_DATA];
      renderizarCatalogo();
    }
  }
}

// Función principal de inicialización que corre en cualquier navegador
function inicializarAppCatalogo() {
  if (window.__catalogoAppIniciada) return;
  window.__catalogoAppIniciada = true;

  if (typeof inicializarMonitorDeRed === 'function') inicializarMonitorDeRed();
  if (window.Cart && window.Cart.init) window.Cart.init();
  if (typeof inicializarSidebar === 'function') inicializarSidebar();
  if (typeof inicializarFiltros === 'function') inicializarFiltros();

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const paramSearch = urlParams.get('search');
    const inputEl = document.getElementById('catalogSearchInput') || document.querySelector('.search-box input');
    if (paramSearch && inputEl) {
      inputEl.value = paramSearch;
      busquedaActual = paramSearch;
    }
  } catch (e) {}

  inicializarBuscadorYOrdenamiento();
  cargarDatosCatalogo();
}

// Ejecutar cuando el DOM esté listo (compatible con todos los navegadores)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarAppCatalogo);
} else {
  inicializarAppCatalogo();
}

if (typeof window !== 'undefined') {
  window.renderizarCatalogo = renderizarCatalogo;
  window.cargarDatosCatalogo = cargarDatosCatalogo;
}