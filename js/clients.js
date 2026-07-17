(function () {
  var viewport = document.querySelector('.clients__cards-viewport');
  var track = document.querySelector('.clients__cards');

  if (!viewport || !track) {
    return;
  }

  var cards = Array.from(track.children);
  if (cards.length < 2) {
    return;
  }

  cards.forEach(function (card) {
    var clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });

  var offset = 0;
  var speed = 0.45;
  var paused = false;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function halfWidth() {
    return track.scrollWidth / 2;
  }

  function tick() {
    if (!paused && !reducedMotion) {
      offset += speed;
      var loopWidth = halfWidth();

      if (loopWidth > 0 && offset >= loopWidth) {
        offset -= loopWidth;
      }

      track.style.transform = 'translate3d(' + (-offset) + 'px, 0, 0)';
    }

    window.requestAnimationFrame(tick);
  }

  viewport.addEventListener('mouseenter', function () {
    paused = true;
  });

  viewport.addEventListener('mouseleave', function () {
    paused = false;
  });

  viewport.addEventListener('focusin', function () {
    paused = true;
  });

  viewport.addEventListener('focusout', function () {
    paused = false;
  });

  window.requestAnimationFrame(tick);
})();
