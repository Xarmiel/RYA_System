import { fetchProductos } from './data.js';

export async function obtenerProductosPorCategoria(categoria, limite = 6) {
  const todosLosProductos = await fetchProductos();
  const filtrados = todosLosProductos.filter(p => p.categoria === categoria);
  return filtrados.slice(0, limite);
}