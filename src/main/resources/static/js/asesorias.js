/**
 * RYA Tech - Asesorías
 * Muestra los tipos de asesoría y permite enviar la consulta a un asesor por WhatsApp,
 * usando el mismo número y patrón de enlace que cart.js y checkout.js.
 * Nota: aún no existe un endpoint de asesorías en el backend, por eso los tipos
 * están definidos aquí. Cuando exista la API, solo hay que reemplazar TIPOS_ASESORIA.
 */

const WHATSAPP_ASESOR = '51987654321';

const TIPOS_ASESORIA = [
  { id: 'armado', etiqueta: 'ARMADO', titulo: 'Armado de tu equipo', descripcion: 'Te ayudamos a elegir los componentes según tu objetivo y presupuesto.' },
  { id: 'compatibilidad', etiqueta: 'COMPATIBILIDAD', titulo: 'Compatibilidad de piezas', descripcion: 'Revisamos que tu configuración funcione bien antes de comprar.' },
  { id: 'perifericos', etiqueta: 'PERIFÉRICOS', titulo: 'Periféricos y escritorio', descripcion: 'Monitores, teclados, ratones y audio adecuados para tu uso.' },
  { id: 'postventa', etiqueta: 'POSTVENTA', titulo: 'Después de tu compra', descripcion: 'Resolvemos tus dudas sobre tu pedido y el uso de tus productos.' }
];

function renderizarTiposAsesoria() {
  const grid = document.getElementById('asesorias-grid');
  const select = document.getElementById('asesoria-tipo');
  if (!grid || !select) return;

  if (TIPOS_ASESORIA.length === 0) {
    grid.innerHTML = '<div style="padding: 24px; color: var(--muted); font-size: 14px; text-align: center; width: 100%;">No hay asesorías disponibles por el momento.</div>';
    return;
  }

  grid.innerHTML = TIPOS_ASESORIA.map(tipo => `
    <article class="asesoria-card">
      <span class="asesoria-card-tag">${tipo.etiqueta}</span>
      <h3>${tipo.titulo}</h3>
      <p>${tipo.descripcion}</p>
      <button class="asesoria-card-action" type="button" data-tipo="${tipo.id}">Solicitar esta asesoría →</button>
    </article>
  `).join('');

  select.innerHTML = TIPOS_ASESORIA.map(tipo => `<option value="${tipo.id}">${tipo.titulo}</option>`).join('');

  // Al elegir una tarjeta, se preselecciona el tipo y se lleva al formulario
  grid.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-tipo]');
    if (!boton) return;
    select.value = boton.dataset.tipo;
    document.getElementById('solicitar').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('asesoria-nombre').focus({ preventScroll: true });
  });
}

function mostrarMensajeAsesoria(texto, esExito) {
  const feedback = document.getElementById('asesorias-feedback');
  feedback.textContent = texto;
  feedback.classList.toggle('is-ok', Boolean(esExito));
}

function enviarSolicitudAsesoria(e) {
  e.preventDefault();

  const nombre = document.getElementById('asesoria-nombre');
  const tipo = document.getElementById('asesoria-tipo');
  const mensaje = document.getElementById('asesoria-mensaje');

  [nombre, mensaje].forEach(campo => campo.classList.remove('has-error'));

  const nombreVal = nombre.value.trim();
  const mensajeVal = mensaje.value.trim();

  if (!nombreVal || !mensajeVal) {
    if (!nombreVal) nombre.classList.add('has-error');
    if (!mensajeVal) mensaje.classList.add('has-error');
    mostrarMensajeAsesoria('Completa tu nombre y tu consulta para continuar.', false);
    return;
  }

  const tipoSeleccionado = TIPOS_ASESORIA.find(t => t.id === tipo.value);
  const texto = encodeURIComponent(
    `¡Hola RYA Tech! Soy *${nombreVal}* y quiero una asesoría de *${tipoSeleccionado ? tipoSeleccionado.titulo : 'compra'}*. ${mensajeVal}`
  );

  window.open(`https://wa.me/${WHATSAPP_ASESOR}?text=${texto}`, '_blank', 'noopener');
  mostrarMensajeAsesoria('Abrimos WhatsApp para que continúes con un asesor.', true);
  e.target.reset();
}

function inicializarAppAsesorias() {
  if (typeof inicializarMonitorDeRed === 'function') inicializarMonitorDeRed();
  if (window.Cart && window.Cart.init) window.Cart.init();

  renderizarTiposAsesoria();
  document.getElementById('asesorias-form')?.addEventListener('submit', enviarSolicitudAsesoria);

  const searchInput = document.getElementById('headerSearchInput');
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      window.location.href = `index.html?search=${encodeURIComponent(searchInput.value.trim())}`;
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarAppAsesorias);
} else {
  inicializarAppAsesorias();
}
