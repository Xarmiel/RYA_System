// Parallax sutil del producto respecto al mouse
const heroVisual = document.getElementById('heroVisual');
const glow = document.getElementById('glow');
const productSlot = document.getElementById('productSlot');

heroVisual.addEventListener('mousemove', (e) => {
  const rect = heroVisual.getBoundingClientRect();
  const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
  const y = (e.clientY - rect.top - rect.height / 2) / rect.height;

  glow.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
  productSlot.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
});

heroVisual.addEventListener('mouseleave', () => {
  glow.style.transform = 'translate(0, 0)';
  productSlot.style.transform = 'translate(0, 0)';
});