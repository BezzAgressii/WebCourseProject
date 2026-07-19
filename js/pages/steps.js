/**
 * Steps track: staggered reveal on scroll.
 */
export function initStepsTrack() {
  const track = document.querySelector('.steps__track');

  if (!track || track.dataset.stepsReady === 'true') {
    return;
  }

  track.dataset.stepsReady = 'true';

  const items = [...track.querySelectorAll('.steps__item')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const reveal = () => {
    track.classList.add('is-inview');
    items.forEach((item) => item.classList.add('is-inview'));
  };

  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveal();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        reveal();
        observer.disconnect();
      });
    },
    { threshold: 0.35, rootMargin: '0px 0px -8% 0px' }
  );

  observer.observe(track);
}

initStepsTrack();
