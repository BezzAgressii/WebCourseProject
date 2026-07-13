(function () {
  var viewport = document.querySelector('.clients__cards-viewport');
  var nav = document.querySelector('.clients__nav');
  var prevBtn = document.querySelector('.clients__nav-btn--prev');
  var nextBtn = document.querySelector('.clients__nav-btn--next');

  if (!viewport || !nav || !prevBtn || !nextBtn) return;

  function getScrollStep() {
    var card = viewport.querySelector('.clients__card');
    if (!card) return 278;
    var gap = parseFloat(getComputedStyle(viewport.querySelector('.clients__cards')).gap) || 20;
    return card.offsetWidth + gap;
  }

  function hasOverflow() {
    return viewport.scrollWidth > viewport.clientWidth + 2;
  }

  function updateButtons() {
    var overflow = hasOverflow();

    nav.classList.toggle('clients__nav--hidden', !overflow);
    viewport.classList.toggle('clients__cards-viewport--static', !overflow);

    if (!overflow) {
      viewport.scrollLeft = 0;
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    var maxScroll = viewport.scrollWidth - viewport.clientWidth - 2;
    prevBtn.disabled = viewport.scrollLeft <= 2;
    nextBtn.disabled = viewport.scrollLeft >= maxScroll;
  }

  prevBtn.addEventListener('click', function () {
    viewport.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', function () {
    viewport.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
  });

  viewport.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  updateButtons();
})();
