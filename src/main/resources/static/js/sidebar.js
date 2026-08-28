function inicializarSidebar() {
  const btnOpenFilters = document.getElementById('btnOpenFilters');
  const btnCloseFilters = document.getElementById('btnCloseFilters');
  const filterSidebar = document.getElementById('filterSidebar');
  const filterOverlay = document.getElementById('filterOverlay');
  const btnApplyFilters = document.getElementById('btnApplyFilters');

  const toggleFilters = (show) => {
    if (filterSidebar && filterOverlay) {
      filterSidebar.classList.toggle('active', show);
      filterOverlay.classList.toggle('active', show);
    }
  };

  btnOpenFilters?.addEventListener('click', () => toggleFilters(true));
  btnCloseFilters?.addEventListener('click', () => toggleFilters(false));
  filterOverlay?.addEventListener('click', () => toggleFilters(false));
  btnApplyFilters?.addEventListener('click', () => toggleFilters(false));
}

if (typeof window !== 'undefined') {
  window.inicializarSidebar = inicializarSidebar;
}