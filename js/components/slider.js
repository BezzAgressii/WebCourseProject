const MAX_VISIBLE_DOTS = 4;

export function createHoverCarousel(image, images) {
  if (!image || !Array.isArray(images) || images.length < 2) {
    return;
  }

  const wrap = image.closest('.product-card__image-wrap');

  if (!wrap) {
    return;
  }

  let index = 0;
  const originalSource = image.src;
  const total = images.length;

  const dots = document.createElement('div');
  dots.className = 'product-card__gallery-dots';
  dots.setAttribute('role', 'tablist');
  dots.setAttribute('aria-label', 'Галерея изображений');
  wrap.appendChild(dots);

  const goTo = (nextIndex) => {
    index = Math.max(0, Math.min(total - 1, nextIndex));
    image.src = images[index];
    renderDots();
  };

  const getVisibleRange = () => {
    if (total <= MAX_VISIBLE_DOTS) {
      return { start: 0, end: total };
    }

    const start = Math.max(0, Math.min(index - Math.floor((MAX_VISIBLE_DOTS - 1) / 2), total - MAX_VISIBLE_DOTS));

    return { start, end: start + MAX_VISIBLE_DOTS };
  };

  const renderDots = () => {
    const { start, end } = getVisibleRange();
    const hasOverflowStart = start > 0;
    const hasOverflowEnd = end < total;

    dots.innerHTML = '';

    for (let i = start; i < end; i += 1) {
      const isActive = i === index;
      const isEdgeHint = (i === start && hasOverflowStart) || (i === end - 1 && hasOverflowEnd);
      const dot = document.createElement('button');

      dot.type = 'button';
      dot.className = 'product-card__gallery-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      dot.setAttribute('aria-label', `Изображение ${i + 1} из ${total}`);
      dot.dataset.index = String(i);

      if (isActive) {
        dot.classList.add('product-card__gallery-dot--active');
      }

      if (isEdgeHint && !isActive) {
        dot.classList.add('product-card__gallery-dot--faded');
      }

      dots.appendChild(dot);
    }
  };

  dots.addEventListener('click', (event) => {
    const dot = event.target.closest('.product-card__gallery-dot');

    if (!dot) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    goTo(Number(dot.dataset.index));
  });

  wrap.addEventListener('mousemove', (event) => {
    const rect = wrap.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const nextIndex = Math.min(total - 1, Math.max(0, Math.floor(ratio * total)));

    if (nextIndex !== index) {
      goTo(nextIndex);
    }
  });

  wrap.addEventListener('mouseleave', () => {
    index = 0;
    image.src = originalSource;
    renderDots();
  });

  wrap.classList.add('product-card__image-wrap--gallery');
  renderDots();
}

export function createImageSlider(container, images, alt) {
  if (!container || !Array.isArray(images) || !images.length) {
    return;
  }

  let index = 0;
  const hasMultipleImages = images.length > 1;
  const total = images.length;
  const escapedAlt = String(alt || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

  container.innerHTML = `
    <div class="image-slider${hasMultipleImages ? ' image-slider--multiple' : ''}">
      <div class="image-slider__stage">
        <img class="image-slider__image" src="${images[0]}" alt="${escapedAlt}">
        ${hasMultipleImages ? `
          <button class="image-slider__button image-slider__button--prev" type="button" aria-label="Предыдущее изображение">‹</button>
          <button class="image-slider__button image-slider__button--next" type="button" aria-label="Следующее изображение">›</button>
          <p class="image-slider__counter">1 / ${total}</p>
        ` : ''}
      </div>
      ${hasMultipleImages ? `
        <div class="image-slider__thumbs">
          <button class="image-slider__thumbs-nav image-slider__thumbs-nav--prev" type="button" aria-label="Прокрутить миниатюры влево">‹</button>
          <div class="image-slider__thumbs-track" role="tablist" aria-label="Миниатюры изображений">
            ${images.map((src, i) => `
              <button
                class="image-slider__thumb${i === 0 ? ' image-slider__thumb--active' : ''}"
                type="button"
                role="tab"
                aria-selected="${i === 0 ? 'true' : 'false'}"
                aria-label="Изображение ${i + 1} из ${total}"
                data-index="${i}"
              >
                <img src="${src}" alt="" loading="lazy">
              </button>
            `).join('')}
          </div>
          <button class="image-slider__thumbs-nav image-slider__thumbs-nav--next" type="button" aria-label="Прокрутить миниатюры вправо">›</button>
        </div>
      ` : ''}
    </div>
  `;

  const image = container.querySelector('.image-slider__image');
  const counter = container.querySelector('.image-slider__counter');
  const track = container.querySelector('.image-slider__thumbs-track');
  const thumbs = [...container.querySelectorAll('.image-slider__thumb')];
  const prevButton = container.querySelector('.image-slider__button--prev');
  const nextButton = container.querySelector('.image-slider__button--next');
  const thumbsPrev = container.querySelector('.image-slider__thumbs-nav--prev');
  const thumbsNext = container.querySelector('.image-slider__thumbs-nav--next');
  const thumbsWrap = container.querySelector('.image-slider__thumbs');

  if (!hasMultipleImages) {
    return;
  }

  const updateThumbsNav = () => {
    const overflow = track.scrollWidth > track.clientWidth + 2;

    thumbsWrap.classList.toggle('image-slider__thumbs--scrollable', overflow);
    thumbsPrev.disabled = !overflow || track.scrollLeft <= 2;
    thumbsNext.disabled = !overflow || track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  };

  const scrollActiveThumbIntoView = () => {
    const activeThumb = thumbs[index];

    if (!activeThumb) {
      return;
    }

    const thumbLeft = activeThumb.offsetLeft;
    const thumbRight = thumbLeft + activeThumb.offsetWidth;
    const viewLeft = track.scrollLeft;
    const viewRight = viewLeft + track.clientWidth;

    if (thumbLeft < viewLeft) {
      track.scrollTo({ left: thumbLeft - 8, behavior: 'smooth' });
    } else if (thumbRight > viewRight) {
      track.scrollTo({ left: thumbRight - track.clientWidth + 8, behavior: 'smooth' });
    }
  };

  const renderSlide = () => {
    image.src = images[index];
    counter.textContent = `${index + 1} / ${total}`;

    thumbs.forEach((thumb, i) => {
      const isActive = i === index;
      thumb.classList.toggle('image-slider__thumb--active', isActive);
      thumb.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    scrollActiveThumbIntoView();
    window.requestAnimationFrame(updateThumbsNav);
  };

  prevButton.addEventListener('click', () => {
    index = (index - 1 + total) % total;
    renderSlide();
  });

  nextButton.addEventListener('click', () => {
    index = (index + 1) % total;
    renderSlide();
  });

  track.addEventListener('click', (event) => {
    const thumb = event.target.closest('.image-slider__thumb');

    if (!thumb) {
      return;
    }

    index = Number(thumb.dataset.index);
    renderSlide();
  });

  thumbsPrev.addEventListener('click', () => {
    track.scrollBy({ left: -(track.clientWidth * 0.75), behavior: 'smooth' });
  });

  thumbsNext.addEventListener('click', () => {
    track.scrollBy({ left: track.clientWidth * 0.75, behavior: 'smooth' });
  });

  track.addEventListener('scroll', updateThumbsNav, { passive: true });
  window.addEventListener('resize', updateThumbsNav);

  updateThumbsNav();
}
