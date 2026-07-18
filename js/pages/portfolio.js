(function () {
  var slider = document.querySelector('.portfolio__slider');
  var prevBtn = document.querySelector('.portfolio__nav-btn--prev');
  var nextBtn = document.querySelector('.portfolio__nav-btn--next');

  if (!slider || !prevBtn || !nextBtn) return;

  function getScrollStep() {
    var card = slider.querySelector('.portfolio__card');
    if (!card) return 300;
    var gap = parseFloat(getComputedStyle(slider).gap) || 30;
    return card.offsetWidth + gap;
  }

  function updateButtons() {
    var maxScroll = slider.scrollWidth - slider.clientWidth - 2;
    prevBtn.disabled = slider.scrollLeft <= 2;
    nextBtn.disabled = slider.scrollLeft >= maxScroll;
  }

  prevBtn.addEventListener('click', function () {
    slider.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', function () {
    slider.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
  });

  slider.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  updateButtons();
})();
