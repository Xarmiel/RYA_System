/**
 * RYA Tech - Gestión de Datos del Catálogo
 * Obtiene los productos dinámicamente desde el backend y la base de datos Supabase.
 */

// Catálogo local limpio (sin productos simulados)
const PRODUCTOS_DATA = [];

/**
 * Obtiene la lista completa de productos del catálogo de RYA Tech directamente desde la base de datos.
 * @param {boolean} simularLatencia - Parámetro opcional para simular latencia de red.
 * @returns {Promise<Array>} Lista de productos devueltos por el backend / Supabase.
 */
async function fetchProductos(simularLatencia = false) {
  if (typeof window !== 'undefined' && window.api && typeof window.api.obtenerProductos === 'function') {
    return await window.api.obtenerProductos();
  }
  if (typeof window !== 'undefined' && typeof window.obtenerProductos === 'function') {
    return await window.obtenerProductos();
  }
  if (simularLatencia) {
    await new Promise(resolve => setTimeout(resolve, 60));
  }
  return [...PRODUCTOS_DATA];
}

// Exportación global universal
if (typeof window !== 'undefined') {
  window.PRODUCTOS_DATA = PRODUCTOS_DATA;
  window.fetchProductos = fetchProductos;
}

