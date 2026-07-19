/**
 * Benefits gallery: staggered entrance on scroll.
 */
export function initBenefitsGallery() {
  const gallery = document.querySelector('.benefits__gallery');

  if (!gallery || gallery.dataset.benefitsReady === 'true') {
    return;
  }

  gallery.dataset.benefitsReady = 'true';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    gallery.classList.add('is-visible');
    return;
  }

  const reveal = () => {
    gallery.classList.add('is-visible');
  };

  if (!('IntersectionObserver' in window)) {
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
    { threshold: 0.25, rootMargin: '0px 0px -8% 0px' }
  );

  observer.observe(gallery);
}

initBenefitsGallery();
