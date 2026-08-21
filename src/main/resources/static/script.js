document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('productCarousel');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');

  if (!track || !btnPrev || !btnNext) return;

  const getScrollAmount = () => {
    const item = track.querySelector('.carousel-item');
    if (!item) return 0;
    // Ancho de la tarjeta + gap (24px)
    const style = window.getComputedStyle(track);
    const gap = parseFloat(style.gap) || 24; 
    return item.offsetWidth + gap; 
  };

  btnNext.addEventListener('click', () => {
    track.scrollBy({ 
      left: getScrollAmount(), 
      behavior: 'smooth' 
    });
  });

  btnPrev.addEventListener('click', () => {
    track.scrollBy({ 
      left: -getScrollAmount(), 
      behavior: 'smooth' 
    });
  });
});