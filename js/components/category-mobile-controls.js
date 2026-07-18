const MOBILE_QUERY = '(max-width: 900px)';

export function initCategoryMobileControls({
  root = document,
  sortSelect,
  onSortChange
} = {}) {
  const bar = root.querySelector('[data-category-mobile-bar]');
  const overlay = root.querySelector('[data-mobile-overlay]');
  const filtersPanel = root.querySelector('[data-mobile-filters-panel]');
  const sortSheet = root.querySelector('[data-mobile-sort-sheet]');
  const sortOptions = root.querySelector('[data-mobile-sort-options]');
  const openFiltersBtn = root.querySelector('[data-mobile-filters-open]');
  const closeFiltersBtn = root.querySelector('[data-mobile-filters-close]');
  const openSortBtn = root.querySelector('[data-mobile-sort-open]');
  const closeSortBtn = root.querySelector('[data-mobile-sort-close]');
  const filtersForm = root.querySelector('#filters-form');

  if (!bar || !overlay || !filtersPanel || !sortSheet || !sortOptions || !sortSelect) {
    return null;
  }

  const media = window.matchMedia(MOBILE_QUERY);
  let activePanel = null;

  const syncSortOptions = () => {
    sortOptions.innerHTML = [...sortSelect.options].map((option) => {
      const isActive = option.value === sortSelect.value;
      return `
        <button
          class="category-mobile-sheet__option${isActive ? ' is-active' : ''}"
          type="button"
          role="option"
          aria-selected="${isActive ? 'true' : 'false'}"
          data-sort-value="${option.value}"
        >${option.textContent}</button>
      `;
    }).join('');
  };

  const setBodyLock = (locked) => {
    document.body.classList.toggle('category-mobile-lock', locked);
  };

  const closeAll = () => {
    filtersPanel.classList.remove('is-open');
    filtersPanel.setAttribute('aria-hidden', 'true');
    sortSheet.classList.remove('is-open');
    sortSheet.hidden = true;
    sortSheet.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
    overlay.classList.remove('is-visible');
    setBodyLock(false);
    activePanel = null;

    openFiltersBtn?.setAttribute('aria-expanded', 'false');
    openSortBtn?.setAttribute('aria-expanded', 'false');
  };

  const openOverlay = () => {
    overlay.hidden = false;
    window.requestAnimationFrame(() => {
      overlay.classList.add('is-visible');
    });
    setBodyLock(true);
  };

  const openFilters = () => {
    if (!media.matches) {
      return;
    }

    closeAll();
    openOverlay();
    filtersPanel.classList.add('is-open');
    filtersPanel.setAttribute('aria-hidden', 'false');
    activePanel = 'filters';
    openFiltersBtn?.setAttribute('aria-expanded', 'true');
  };

  const openSort = () => {
    if (!media.matches) {
      return;
    }

    closeAll();
    syncSortOptions();
    openOverlay();
    sortSheet.hidden = false;
    sortSheet.setAttribute('aria-hidden', 'false');
    window.requestAnimationFrame(() => {
      sortSheet.classList.add('is-open');
    });
    activePanel = 'sort';
    openSortBtn?.setAttribute('aria-expanded', 'true');
  };

  const handleMediaChange = () => {
    if (!media.matches) {
      closeAll();
      filtersPanel.setAttribute('aria-hidden', 'false');
    } else {
      filtersPanel.setAttribute('aria-hidden', 'true');
    }
  };

  openFiltersBtn?.addEventListener('click', openFilters);
  closeFiltersBtn?.addEventListener('click', closeAll);
  openSortBtn?.addEventListener('click', openSort);
  closeSortBtn?.addEventListener('click', closeAll);
  overlay.addEventListener('click', closeAll);

  sortOptions.addEventListener('click', (event) => {
    const option = event.target.closest('[data-sort-value]');

    if (!option) {
      return;
    }

    const value = option.dataset.sortValue;
    sortSelect.value = value;
    syncSortOptions();
    onSortChange?.(value);
    closeAll();
  });

  filtersForm?.addEventListener('submit', () => {
    if (media.matches) {
      window.setTimeout(closeAll, 0);
    }
  });

  root.querySelector('#reset-filters')?.addEventListener('click', () => {
    if (media.matches && activePanel === 'filters') {
      window.setTimeout(closeAll, 0);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activePanel) {
      closeAll();
    }
  });

  document.addEventListener('languageChanged', () => {
    window.setTimeout(syncSortOptions, 0);
  });

  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', handleMediaChange);
  } else {
    media.addListener(handleMediaChange);
  }

  openFiltersBtn?.setAttribute('aria-expanded', 'false');
  openSortBtn?.setAttribute('aria-expanded', 'false');
  filtersPanel.setAttribute('aria-hidden', media.matches ? 'true' : 'false');
  sortSheet.setAttribute('aria-hidden', 'true');
  syncSortOptions();

  return {
    closeAll,
    openFilters,
    openSort,
    syncSortOptions
  };
}
