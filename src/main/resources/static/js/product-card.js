import { ATRIBUTOS_TARJETA } from './config.js';

/**
 * Limpia un valor crudo de "atributos" para que se vea bien como chip corto.
 * Ej: "Para Intel LGA1700"                -> "Intel LGA1700"
 *     "Gama Alta (Intel Z / AMD X)"       -> "Gama Alta"
 *     "80 Plus Gold"                      -> "80 Plus Gold"
 */
function limpiarValor(valor) {
  if (!valor) return '';
  return valor
    .replace(/\s*\([^)]*\)\s*$/, '') // quita aclaraciones finales entre paréntesis
    .replace(/^Para\s+/i, '')        // "Para AMD AM5" -> "AMD AM5"
    .trim();
}

/**
 * Arma la línea de specs (2-3 atributos) configurada en ATRIBUTOS_TARJETA
 * para la categoría del producto. Si algún atributo no existe en el producto,
 * simplemente se omite (no rompe el layout).
 */
function obtenerSpecs(producto) {
  const claves = ATRIBUTOS_TARJETA[producto.categoria] || [];
  return claves
    .map(clave => limpiarValor(producto.atributos?.[clave]))
    .filter(Boolean);
}

/**
 * Crea el elemento DOM de una tarjeta de producto (usada en carruseles y grillas).
 * Estructura visual:
 *   [Marca]  <- chip pequeño, mayúsculas, gris
 *   Nombre (categoría)
 *   spec | spec | spec   <- chip gris con los atributos clave
 *   Precio
 */
export function crearTarjetaProducto(producto) {
  const articulo = document.createElement('div');
  articulo.className = 'carousel-item';
  articulo.onclick = () => window.location.href = `producto.html?id=${producto.id}`;

  const specs = obtenerSpecs(producto);

  articulo.innerHTML = `
    <div class="img-placeholder">
      <span>[Foto ${producto.fabricante}]</span>
    </div>
    <div class="product-info">
      <span class="product-brand">${producto.fabricante}</span>
      <h3 class="product-name">${producto.categoria}</h3>
      ${specs.length ? `<p class="product-specs">${specs.join(' &nbsp;|&nbsp; ')}</p>` : ''}
      <span class="price">S/ ${producto.precio.toFixed(2)}</span>
    </div>
    <button class="add-to-cart" onclick="event.stopPropagation(); window.agregarAlCarrito(${producto.id})">
      Añadir al carrito
    </button>
  `;

  return articulo;
}