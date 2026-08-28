async function obtenerProductosPorCategoria(categoria, limite = 6) {
  const fetchFn = (typeof window !== 'undefined' && window.fetchProductos) ? window.fetchProductos : (typeof fetchProductos !== 'undefined' ? fetchProductos : null);
  const todosLosProductos = fetchFn ? await fetchFn() : [];
  const filtrados = todosLosProductos.filter(p => p.categoria === categoria);
  return filtrados.slice(0, limite);
}

if (typeof window !== 'undefined') {
  window.obtenerProductosPorCategoria = obtenerProductosPorCategoria;
}