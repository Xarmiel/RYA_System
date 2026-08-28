import { REGLAS_DE_DEPENDENCIA, FILTROS_GLOBALES, NOMBRES_LEGIBLES, JERARQUIA_CATEGORIAS } from './config.js';
import { fetchProductos } from './data.js';

let productosBase = []; 
export let estado = {
  categoriaActual: null,
  filtrosSeleccionados: {}
};

const container = document.getElementById('dynamicFilterContainer');
const filterCountLabel = document.getElementById('filterCount');

export async function inicializarFiltros() {
  try {
    productosBase = await fetchProductos();
    procesarFiltros();
    
    // Listener para limpiar filtros
    document.getElementById('btnClearFilters')?.addEventListener('click', () => {
      estado.filtrosSeleccionados = {};
      procesarFiltros();
    });
  } catch (error) {
    console.error("Error al inicializar los filtros:", error);
  }
}

export function cambiarCategoria(nuevaCategoria) {
  estado.categoriaActual = nuevaCategoria;
  estado.filtrosSeleccionados = {};
  procesarFiltros();
}

function procesarFiltros() {
  if(!container) return;
  if (!estado.categoriaActual) {
    renderizarUI({});
    return;
  }

  let productosCategoria = productosBase.filter(p => p.categoria === estado.categoriaActual);
  const permitidos = [...FILTROS_GLOBALES, ...(REGLAS_DE_DEPENDENCIA[estado.categoriaActual]?.activa || [])];

  let productosFiltradosFinal = productosCategoria.filter(p => {
    let pasaFiltro = true;
    for (const [clave, valores] of Object.entries(estado.filtrosSeleccionados)) {
      if (valores.length === 0) continue;
      const valorProducto = clave === 'fabricante' ? p[clave] : p.atributos[clave];
      if (!valores.includes(valorProducto)) {
        pasaFiltro = false;
        break;
      }
    }
    return pasaFiltro;
  });

  let opcionesDisponibles = {};
  permitidos.forEach(attr => opcionesDisponibles[attr] = {});

  productosFiltradosFinal.forEach(p => {
    permitidos.forEach(attr => {
      const valor = attr === 'fabricante' ? p[attr] : p.atributos[attr];
      if (valor) {
        opcionesDisponibles[attr][valor] = (opcionesDisponibles[attr][valor] || 0) + 1;
      }
    });
  });

  renderizarUI(opcionesDisponibles);
  actualizarContadorGlobal();
}

function renderizarUI(opcionesDisponibles) {
  container.innerHTML = '';

  for (const [macroCategoria, categorias] of Object.entries(JERARQUIA_CATEGORIAS)) {
    const macroDetails = document.createElement('details');
    macroDetails.className = 'macro-category-group';
    macroDetails.style.marginBottom = '12px'; 
    
    if (categorias.includes(estado.categoriaActual)) macroDetails.open = true;

    const macroSummary = document.createElement('summary');
    macroSummary.textContent = macroCategoria;
    macroSummary.style.fontWeight = 'bold';
    macroSummary.style.cursor = 'pointer';
    macroDetails.appendChild(macroSummary);

    const macroContent = document.createElement('div');
    macroContent.style.paddingLeft = '15px'; 

    categorias.forEach(catNombre => {
      const catDetails = document.createElement('details');
      catDetails.className = 'category-group';
      catDetails.style.margin = '2px 0'; 
      
      const catSummary = document.createElement('summary');
      catSummary.textContent = catNombre;
      catSummary.style.cursor = 'pointer';
      catSummary.style.padding = '4px 0'; 

      catSummary.addEventListener('click', (e) => {
        if (estado.categoriaActual !== catNombre) {
          e.preventDefault();
          cambiarCategoria(catNombre);
        }
      });

      catDetails.appendChild(catSummary);

      if (estado.categoriaActual === catNombre) {
        catDetails.open = true; 
        catSummary.style.color = 'var(--color-cyan)';
        catSummary.style.fontWeight = 'bold';

        const filtersContainer = document.createElement('div');
        filtersContainer.style.paddingLeft = '15px'; 
        filtersContainer.style.borderLeft = '2px solid var(--color-cyan)';
        filtersContainer.style.marginTop = '8px';

        Object.keys(opcionesDisponibles).forEach(attrClave => {
          const opcionesMap = opcionesDisponibles[attrClave];
          const opcionesKeys = Object.keys(opcionesMap);

          if (opcionesKeys.length === 0) return;
          opcionesKeys.sort((a, b) => opcionesMap[b] - opcionesMap[a]);

          const titulo = NOMBRES_LEGIBLES[attrClave] || attrClave;

          const filterDetails = document.createElement('details');
          filterDetails.className = 'filter-group';
          filterDetails.open = true;
          filterDetails.style.marginBottom = '8px';

          const filterSummary = document.createElement('summary');
          filterSummary.textContent = titulo;
          filterSummary.style.fontSize = '0.9em';
          filterSummary.style.color = 'var(--color-gray)';
          filterDetails.appendChild(filterSummary);

          const divOptions = document.createElement('div');
          divOptions.className = 'filter-options';
          divOptions.style.paddingLeft = '10px';

          opcionesKeys.forEach(valor => {
            const cantidad = opcionesMap[valor];
            const isChecked = estado.filtrosSeleccionados[attrClave]?.includes(valor) || false;

            const label = document.createElement('label');
            label.style.display = 'block';
            label.style.fontSize = '0.85em';
            label.style.marginTop = '2px'; 
            label.style.marginBottom = '2px';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = valor;
            checkbox.checked = isChecked;

            checkbox.addEventListener('change', (e) => {
              if (!estado.filtrosSeleccionados[attrClave]) {
                estado.filtrosSeleccionados[attrClave] = [];
              }
              if (e.target.checked) {
                estado.filtrosSeleccionados[attrClave].push(valor);
              } else {
                estado.filtrosSeleccionados[attrClave] = estado.filtrosSeleccionados[attrClave].filter(v => v !== valor);
              }
              procesarFiltros();
            });

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${valor} (${cantidad})`));
            divOptions.appendChild(label);
          });

          filterDetails.appendChild(divOptions);
          filtersContainer.appendChild(filterDetails);
        });

        catDetails.appendChild(filtersContainer);
      }
      macroContent.appendChild(catDetails);
    });

    macroDetails.appendChild(macroContent);
    container.appendChild(macroDetails);
  }
}

function actualizarContadorGlobal() {
  let totalSeleccionados = 0;
  Object.values(estado.filtrosSeleccionados).forEach(arr => {
    totalSeleccionados += arr.length;
  });
  if (filterCountLabel) {
    filterCountLabel.textContent = `(${totalSeleccionados})`;
  }
}
