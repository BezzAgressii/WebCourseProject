export function createHoverCarousel(image, images, interval = 1400) {
  if (!image || !Array.isArray(images) || images.length < 2) {
    return;
  }

  let index = 0;
  let timer = null;
  const originalSource = image.src;

  const showNextImage = () => {
    index = (index + 1) % images.length;
    image.src = images[index];
  };

  image.addEventListener('mouseenter', () => {
    if (timer) {
      return;
    }

    timer = window.setInterval(showNextImage, interval);
  });

  image.addEventListener('mouseleave', () => {
    window.clearInterval(timer);
    timer = null;
    index = 0;
    image.src = originalSource;
  });
}

export function createImageSlider(container, images, alt) {
  if (!container || !Array.isArray(images) || !images.length) {
    return;
  }

  let index = 0;
  const hasMultipleImages = images.length > 1;

  container.innerHTML = `
    <div class="image-slider">
      <img class="image-slider__image" src="${images[0]}" alt="${alt}">
      <button class="image-slider__button image-slider__button--prev" type="button" aria-label="Предыдущее изображение" ${hasMultipleImages ? '' : 'disabled'}>←</button>
      <button class="image-slider__button image-slider__button--next" type="button" aria-label="Следующее изображение" ${hasMultipleImages ? '' : 'disabled'}>→</button>
      <p class="image-slider__counter">${hasMultipleImages ? `1 / ${images.length}` : ''}</p>
    </div>
  `;

  const image = container.querySelector('.image-slider__image');
  const counter = container.querySelector('.image-slider__counter');

  const renderSlide = () => {
    image.src = images[index];
    counter.textContent = `${index + 1} / ${images.length}`;
  };

  container.querySelector('.image-slider__button--prev').addEventListener('click', () => {
    index = (index - 1 + images.length) % images.length;
    renderSlide();
  });

  container.querySelector('.image-slider__button--next').addEventListener('click', () => {
    index = (index + 1) % images.length;
    renderSlide();
  });
}
