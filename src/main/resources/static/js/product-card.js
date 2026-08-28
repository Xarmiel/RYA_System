/**
 * Limpia un valor crudo de "atributos" para que se vea bien como chip corto.
 */
function limpiarValor(valor) {
  if (!valor) return '';
  return valor
    .toString()
    .replace(/\s*\([^)]*\)\s*$/, '') // quita aclaraciones finales entre paréntesis
    .replace(/^Para\s+/i, '')        // "Para AMD AM5" -> "AMD AM5"
    .trim();
}

/**
 * Arma la línea de specs (2-3 atributos) configurada en ATRIBUTOS_TARJETA
 */
function obtenerSpecs(producto) {
  const cardAttrs = (typeof window !== 'undefined' && window.ATRIBUTOS_TARJETA)
    ? window.ATRIBUTOS_TARJETA
    : (typeof ATRIBUTOS_TARJETA !== 'undefined' ? ATRIBUTOS_TARJETA : {});
  const claves = cardAttrs[producto.categoria] || [];
  return claves
    .map(clave => limpiarValor(producto.atributos?.[clave]))
    .filter(Boolean);
}

/**
 * Escapa HTML para prevenir inyecciones
 */
function escapeHtmlProductCard(texto) {
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
 * Crea el elemento DOM de una tarjeta de producto (usada en carruseles y grillas).
 */
function crearTarjetaProducto(producto) {
  const articulo = document.createElement('div');
  articulo.className = 'carousel-item';
  articulo.onclick = () => {
    window.location.href = `producto.html?id=${producto.id}`;
  };

  const specs = obtenerSpecs(producto);
  const precioFormateado = Number(producto.precio || 0).toFixed(2);
  const fab = escapeHtmlProductCard(producto.fabricante);
  const cat = escapeHtmlProductCard(producto.categoria);

  articulo.innerHTML = `
    <div class="img-placeholder">
      <span>[Foto ${fab}]</span>
    </div>
    <div class="product-info">
      <span class="product-brand">${fab}</span>
      <h3 class="product-name">${cat}</h3>
      ${specs.length ? `<p class="product-specs">${specs.map(s => escapeHtmlProductCard(s)).join(' &nbsp;|&nbsp; ')}</p>` : ''}
      <span class="price">S/ ${precioFormateado}</span>
    </div>
    <button class="add-to-cart" type="button" onclick="event.stopPropagation(); if (window.agregarAlCarrito) window.agregarAlCarrito(${producto.id});">
      Añadir al carrito
    </button>
  `;

  return articulo;
}

if (typeof window !== 'undefined') {
  window.crearTarjetaProducto = crearTarjetaProducto;
}