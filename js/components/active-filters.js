import FILTER_CONFIG from '../utils/filter-config.js';
import i18n from '../common/i18n.js';

function createEl(tag, { className, attrs, dataset, text, children } = {}) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text != null) {
    element.textContent = String(text);
  }

  if (attrs) {
    Object.entries(attrs).forEach(([name, value]) => {
      if (value == null || value === false) {
        return;
      }

      element.setAttribute(name, value === true ? '' : String(value));
    });
  }

  if (dataset) {
    Object.entries(dataset).forEach(([name, value]) => {
      if (value != null) {
        element.dataset[name] = String(value);
      }
    });
  }

  if (children) {
    children.forEach((child) => {
      if (child != null && child !== false) {
        element.append(child);
      }
    });
  }

  return element;
}

function toNumber(value) {
  const parsed = Number(value);
  return value !== '' && Number.isFinite(parsed) ? parsed : null;
}

function collectActiveFilters({
  category,
  subcategory,
  categoryKey,
  filtersRoot,
  searchInput
}) {
  const chips = [];
  const query = searchInput?.value.trim() || '';

  if (query) {
    chips.push({
      id: 'search',
      field: 'search',
      value: query,
      label: `${i18n.t('category.searchLabel')}: ${query}`
    });
  }

  if (category === 'ventilation' && subcategory && subcategory !== 'all') {
    chips.push({
      id: `subcategory:${subcategory}`,
      field: 'subcategory',
      value: subcategory,
      label: i18n.t(`category.subcategory.${subcategory}`)
    });
  }

  const filters = FILTER_CONFIG[categoryKey] || [];

  filters.forEach((filter) => {
    if (filter.type === 'range') {
      const minInput = filtersRoot.querySelector(`[data-filter-min="${filter.field}"]`);
      const maxInput = filtersRoot.querySelector(`[data-filter-max="${filter.field}"]`);
      const min = toNumber(minInput?.value);
      const max = toNumber(maxInput?.value);
      const hasMin = min !== null && min > filter.min;
      const hasMax = max !== null && max < filter.max;

      if (!hasMin && !hasMax) {
        return;
      }

      let rangeLabel = i18n.t(filter.labelKey);

      if (hasMin && hasMax) {
        rangeLabel += `: ${min} – ${max}`;
      } else if (hasMin) {
        rangeLabel += `: ${i18n.t('common.from')} ${min}`;
      } else {
        rangeLabel += `: ${i18n.t('common.to')} ${max}`;
      }

      chips.push({
        id: `range:${filter.field}`,
        field: filter.field,
        type: 'range',
        label: rangeLabel
      });
      return;
    }

    if (filter.type === 'boolean') {
      const checkbox = filtersRoot.querySelector(`[data-filter-boolean="${filter.field}"]`);

      if (checkbox?.checked) {
        chips.push({
          id: `boolean:${filter.field}`,
          field: filter.field,
          type: 'boolean',
          label: i18n.t(filter.labelKey)
        });
      }

      return;
    }

    const selected = [...filtersRoot.querySelectorAll(`input[name="${filter.field}"]:checked`)];

    if (!selected.length || selected.length === filter.options.length) {
      return;
    }

    selected.forEach((input) => {
      const option = filter.options.find((item) => String(item.value) === input.value);
      const optionLabel = option?.labelKey ? i18n.t(option.labelKey) : (option?.label || input.value);

      chips.push({
        id: `${filter.field}:${input.value}`,
        field: filter.field,
        value: input.value,
        type: filter.type,
        label: optionLabel
      });
    });
  });

  return chips;
}

function renderActiveFilterChips(root, chips) {
  if (!root) {
    return;
  }

  root.replaceChildren();

  if (!chips.length) {
    root.hidden = true;
    return;
  }

  root.hidden = false;

  chips.forEach((chip) => {
    const removeLabel = `${i18n.t('category.removeFilter')}: ${chip.label}`;
    const removeButton = createEl('button', {
      className: 'category-page__active-filter-remove',
      attrs: {
        type: 'button',
        title: i18n.t('category.removeFilter'),
        'aria-label': removeLabel
      },
      dataset: {
        activeFilterRemove: ''
      },
      text: '×'
    });

    const chipElement = createEl('div', {
      className: 'category-page__active-filter',
      dataset: {
        activeFilter: '',
        field: chip.field,
        value: chip.value ?? '',
        type: chip.type || ''
      },
      children: [
        createEl('span', {
          className: 'category-page__active-filter-label',
          text: chip.label
        }),
        removeButton
      ]
    });

    root.append(chipElement);
  });
}

function clearFilterValue({
  chip,
  categoryKey,
  filtersRoot,
  searchInput,
  onSubcategoryChange,
  onRangeReset
}) {
  const field = chip.dataset.field;
  const value = chip.dataset.value;
  const type = chip.dataset.type;

  if (field === 'search') {
    if (searchInput) {
      searchInput.value = '';
    }
    return true;
  }

  if (field === 'subcategory') {
    onSubcategoryChange?.('all');
    return false;
  }

  if (type === 'range') {
    const filter = (FILTER_CONFIG[categoryKey] || []).find((item) => item.field === field);
    const minNumber = filtersRoot.querySelector(`[data-filter-min="${field}"]`);
    const maxNumber = filtersRoot.querySelector(`[data-filter-max="${field}"]`);
    const minRange = filtersRoot.querySelector(`[data-filter-range-min="${field}"]`);
    const maxRange = filtersRoot.querySelector(`[data-filter-range-max="${field}"]`);

    if (minNumber) {
      minNumber.value = '';
    }

    if (maxNumber) {
      maxNumber.value = '';
    }

    if (minRange) {
      minRange.value = String(filter?.min ?? minRange.min);
    }

    if (maxRange) {
      maxRange.value = String(filter?.max ?? maxRange.max);
    }

    onRangeReset?.(field);
    return true;
  }

  if (type === 'boolean') {
    const checkbox = filtersRoot.querySelector(`[data-filter-boolean="${field}"]`);

    if (checkbox) {
      checkbox.checked = false;
    }

    return true;
  }

  const input = [...filtersRoot.querySelectorAll(`input[name="${field}"]`)]
    .find((item) => item.value === value);

  if (input) {
    input.checked = false;
  }

  return true;
}

/**
 * Selected filter chips above the product catalog.
 * Handles render and removing a filter by clicking the X button.
 */
export function createActiveFiltersController({
  root,
  filtersRoot,
  searchInput,
  getState,
  onApply,
  onSubcategoryChange,
  onRangeReset
} = {}) {
  if (!root || !filtersRoot || typeof getState !== 'function') {
    return {
      render() {},
      destroy() {}
    };
  }

  const handleClick = (event) => {
    const removeButton = event.target.closest('[data-active-filter-remove]');

    if (!removeButton || !root.contains(removeButton)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const chip = removeButton.closest('[data-active-filter]');

    if (!chip) {
      return;
    }

    const state = getState();
    const shouldApply = clearFilterValue({
      chip,
      categoryKey: state.categoryKey,
      filtersRoot,
      searchInput,
      onSubcategoryChange,
      onRangeReset
    });

    if (shouldApply) {
      onApply?.();
    }
  };

  root.addEventListener('click', handleClick);

  return {
    render() {
      const state = getState();
      const chips = collectActiveFilters({
        category: state.category,
        subcategory: state.subcategory,
        categoryKey: state.categoryKey,
        filtersRoot,
        searchInput
      });

      renderActiveFilterChips(root, chips);
    },
    destroy() {
      root.removeEventListener('click', handleClick);
    }
  };
}
