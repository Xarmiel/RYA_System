/**
 * Limpia un valor crudo de especificaciones técnicas para que se vea bien como chip corto.
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
 * Obtiene hasta 3 valores de la tabla especificaciones_tecnicas (excluyendo 'fabricante').
 * No muestra las claves, únicamente los valores limpios separados.
 */
function obtenerSpecs(producto) {
  if (!producto) return [];

  const valores = [];

  // 1. Si cuenta con el array directo de especificaciones de la base de datos
  if (Array.isArray(producto.especificaciones) && producto.especificaciones.length > 0) {
    for (const esp of producto.especificaciones) {
      if (!esp) continue;
      const clave = (esp.clave || '').toString().toLowerCase().trim();
      if (clave === 'fabricante') continue;

      const valorLimpio = limpiarValor(esp.valor);
      if (valorLimpio && !valores.includes(valorLimpio)) {
        valores.push(valorLimpio);
        if (valores.length === 3) break;
      }
    }
  }

  // 2. Si no se completaron o viene en formato de mapa de atributos
  if (valores.length < 3 && producto.atributos && typeof producto.atributos === 'object') {
    for (const [clave, val] of Object.entries(producto.atributos)) {
      if (clave.toLowerCase().trim() === 'fabricante') continue;

      const valorLimpio = limpiarValor(val);
      if (valorLimpio && !valores.includes(valorLimpio)) {
        valores.push(valorLimpio);
        if (valores.length === 3) break;
      }
    }
  }

  return valores;
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
  // Mostrar el nombre real del producto en la card (fallback a categoría si estuviera ausente)
  const nombreProducto = escapeHtmlProductCard(producto.nombre || producto.categoria);
  const cat = escapeHtmlProductCard(producto.categoria);

  const imgSrc = producto.imagenUrl ? escapeHtmlProductCard(producto.imagenUrl) : '';
  const imgContent = imgSrc 
    ? `<img src="${imgSrc}" alt="${nombreProducto}" style="width:100%; height:100%; object-fit:contain; border-radius:12px;" onerror="this.parentElement.innerHTML='<span>[Foto ${fab}]</span>'">`
    : `<span>[Foto ${fab}]</span>`;

  articulo.innerHTML = `
    <div class="img-placeholder">
      ${imgContent}
    </div>
    <div class="product-info">
      <span class="product-brand">${fab}</span>
      <h3 class="product-name">${nombreProducto}</h3>
      ${specs.length ? `<p class="product-specs">${specs.map(s => escapeHtmlProductCard(s)).join(' &nbsp;|&nbsp; ')}</p>` : ''}
      <span class="price">S/ ${precioFormateado}</span>
    </div>
    <button class="add-to-cart" type="button" onclick="event.stopPropagation(); if (window.agregarAlCarrito) window.agregarAlCarrito('${escapeHtmlProductCard(producto.id)}');">
      Añadir al carrito
    </button>
  `;

  return articulo;
}

if (typeof window !== 'undefined') {
  window.crearTarjetaProducto = crearTarjetaProducto;
}