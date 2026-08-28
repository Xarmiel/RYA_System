import { fetchProductos } from './data.js';
import { NOMBRES_LEGIBLES } from './config.js';
import { Cart } from './cart.js';
import { inicializarMonitorDeRed, renderizarSkeletonDetalle, crearTarjetaErrorRed } from './network-ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  inicializarMonitorDeRed();
  Cart.init();

  const searchInput = document.getElementById('headerSearchInput');
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      window.location.href = `index.html?search=${encodeURIComponent(searchInput.value.trim())}`;
    }
  });

  const productId = Number(new URLSearchParams(window.location.search).get('id'));
  if (!Number.isInteger(productId) || productId < 1) {
    mostrarError('No se especificó ningún identificador de producto.');
    return;
  }

  cargarDetalleProducto(productId);
});

async function cargarDetalleProducto(productId) {
  const heroSection = document.querySelector('.product-hero');
  const detailsSection = document.querySelector('.product-details-section');

  // 1. Mostrar estado Skeleton en el héroe del producto
  if (heroSection) {
    heroSection.style.display = 'none';
  }
  if (detailsSection) {
    detailsSection.style.display = 'none';
  }

  let skeletonContainer = document.getElementById('product-skeleton-container');
  if (!skeletonContainer) {
    skeletonContainer = document.createElement('div');
    skeletonContainer.id = 'product-skeleton-container';
    document.querySelector('.page-content')?.insertBefore(skeletonContainer, heroSection);
  }
  renderizarSkeletonDetalle(skeletonContainer);

  try {
    const productos = await fetchProductos();
    const producto = productos.find(item => item.id === productId);

    if (!producto) {
      skeletonContainer.remove();
      mostrarError('El producto solicitado no existe o ya no está disponible.');
      return;
    }

    // Quitar skeleton y mostrar secciones reales
    skeletonContainer.remove();
    if (heroSection) heroSection.style.display = '';
    if (detailsSection) detailsSection.style.display = '';

    renderizarProducto(producto);
    configurarCantidad();
    configurarCarrito(producto);
  } catch (error) {
    console.error('No se pudo cargar el producto:', error);
    skeletonContainer.remove();

    const esOffline = !navigator.onLine || error.message === 'NETWORK_OFFLINE';
    mostrarErrorDeRed(
      esOffline ? 'Sin Conexión a Internet' : 'Error al Cargar el Producto',
      esOffline
        ? 'Revisa tu conexión a internet para poder ver las especificaciones de este producto.'
        : 'Ocurrió un error al contactar al servidor de RYA Tech.',
      () => cargarDetalleProducto(productId)
    );
  }
}


function renderizarProducto(producto) {
  const atributos = Object.entries(producto.atributos || {});
  const primerAtributo = atributos[0]?.[1] || '';
  const nombre = `${producto.fabricante} ${producto.categoria} ${primerAtributo}`.trim();

  document.title = `${nombre} | RYA`;
  document.getElementById('prod-brand').textContent = producto.fabricante;
  document.getElementById('prod-title').textContent = nombre;
  document.getElementById('prod-category').textContent = producto.categoria;
  document.getElementById('prod-price').textContent = `S/ ${Number(producto.precio).toFixed(2)}`;
  document.getElementById('prod-description').textContent =
    `Equipo ${producto.fabricante} de la categoría ${producto.categoria}, seleccionado por sus prestaciones y compatibilidad.`;

  const breadcrumb = document.getElementById('prod-breadcrumb');
  breadcrumb.replaceChildren();
  const inicio = document.createElement('a');
  inicio.href = 'index.html';
  inicio.textContent = 'Inicio';
  const categoria = document.createElement('span');
  categoria.textContent = producto.categoria;
  const actual = document.createElement('strong');
  actual.textContent = producto.fabricante;
  breadcrumb.append(inicio, document.createTextNode(' / '), categoria, document.createTextNode(' / '), actual);

  const variantes = document.getElementById('prod-variants');
  const specs = document.getElementById('prod-specs-table');
  variantes.replaceChildren();
  specs.replaceChildren();
  const tituloVariantes = document.createElement('h3');
  tituloVariantes.textContent = 'Características clave';
  variantes.appendChild(tituloVariantes);

  atributos.forEach(([clave, valor]) => {
    const etiqueta = document.createElement('span');
    etiqueta.className = 'variant-tag';
    etiqueta.textContent = valor;
    variantes.appendChild(etiqueta);

    const fila = document.createElement('div');
    fila.className = 'spec-row';
    const label = document.createElement('div');
    label.className = 'spec-label';
    label.textContent = NOMBRES_LEGIBLES[clave] || clave;
    const value = document.createElement('div');
    value.className = 'spec-value';
    value.textContent = valor;
    fila.append(label, value);
    specs.appendChild(fila);
  });

  const image = document.getElementById('prod-image');
  image.src = crearImagenProducto(producto);
  image.alt = nombre;
}

function crearImagenProducto(producto) {
  const marca = escapeXml(producto.fabricante);
  const categoria = escapeXml(producto.categoria);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="760" viewBox="0 0 760 760"><rect width="760" height="760" fill="#000000"/><rect x="54" y="54" width="652" height="652" rx="32" fill="#030914" stroke="#00D4FF" stroke-width="3"/><circle cx="380" cy="290" r="108" fill="#00D4FF" opacity=".13"/><path d="M320 290h120M380 230v120" stroke="#00D4FF" stroke-width="12" stroke-linecap="round"/><text x="380" y="480" fill="#F5F7FA" font-family="Arial, sans-serif" font-size="38" font-weight="700" text-anchor="middle">${marca}</text><text x="380" y="530" fill="#C2C5CC" font-family="Arial, sans-serif" font-size="24" text-anchor="middle">${categoria}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]);
}

function configurarCantidad() {
  const input = document.getElementById('prod-quantity');
  document.querySelectorAll('[data-quantity]').forEach(button => {
    button.addEventListener('click', () => {
      const cantidad = Number(input.value) || 1;
      input.value = button.dataset.quantity === 'increase' ? Math.min(cantidad + 1, 99) : Math.max(cantidad - 1, 1);
    });
  });
}

function configurarCarrito(producto) {
  const addBtn = document.getElementById('add-to-cart');
  const feedback = document.getElementById('cart-feedback');
  if (!addBtn) return;

  addBtn.addEventListener('click', () => {
    const cantidad = Math.max(1, Number(document.getElementById('prod-quantity')?.value) || 1);
    Cart.addItem(producto, cantidad, true);
    if (feedback) {
      feedback.textContent = `${cantidad} unidad${cantidad === 1 ? '' : 'es'} de ${producto.fabricante} agregada${cantidad === 1 ? '' : 's'} al carrito.`;
      setTimeout(() => {
        if (feedback) feedback.textContent = '';
      }, 4000);
    }
  });
}

function mostrarError(mensaje) {
  const content = document.querySelector('.page-content');
  content.replaceChildren();
  const box = document.createElement('section');
  box.className = 'product-error';
  box.innerHTML = '<h1>No pudimos mostrar este producto</h1>';
  const detail = document.createElement('p');
  detail.textContent = mensaje;
  const link = document.createElement('a');
  link.href = 'index.html';
  link.textContent = 'Volver al catálogo';
  box.append(detail, link);
  content.appendChild(box);
}

function mostrarErrorDeRed(titulo, mensaje, onRetry) {
  const content = document.querySelector('.page-content');
  content.replaceChildren();
  const cardError = crearTarjetaErrorRed({
    titulo,
    mensaje,
    onRetry,
    linkSecundario: {
      href: 'index.html',
      texto: 'Volver al catálogo'
    }
  });
  content.appendChild(cardError);
}

