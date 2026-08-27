import { fetchProductos } from './data.js';

export async function obtenerProductosPorCategoria(categoria, limite = 6) {
  const todosLosProductos = await fetchProductos();
  
  // Filtramos los productos que coincidan con la categoría solicitada
  const filtrados = todosLosProductos.filter(p => p.categoria === categoria);
  
  // Simulamos el tiempo de respuesta de un servidor (300 milisegundos)
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(filtrados.slice(0, limite)); 
    }, 300);
  });
}