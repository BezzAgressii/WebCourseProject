const PHONE_MASK = '+375 (__) ___-__-__';

export function formatBelarusPhone(value) {
  let digits = String(value || '').replace(/\D/g, '');

  if (digits.startsWith('375')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('80')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  digits = digits.slice(0, 9);

  let result = '+375';

  if (digits.length === 0) {
    return result;
  }

  result += ` (${digits.slice(0, Math.min(2, digits.length))}`;

  if (digits.length < 2) {
    return result;
  }

  result += ')';

  if (digits.length > 2) {
    result += ` ${digits.slice(2, Math.min(5, digits.length))}`;
  }

  if (digits.length > 5) {
    result += `-${digits.slice(5, Math.min(7, digits.length))}`;
  }

  if (digits.length > 7) {
    result += `-${digits.slice(7, 9)}`;
  }

  return result;
}

export function isValidBelarusPhone(value) {
  return /^\+375 \(\d{2}\) \d{3}-\d{2}-\d{2}$/.test(String(value || '').trim());
}

export function bindPhoneMask(input) {
  if (!input || input.dataset.phoneMaskBound === 'true') {
    return;
  }

  input.dataset.phoneMaskBound = 'true';
  input.setAttribute('inputmode', 'tel');
  input.setAttribute('autocomplete', 'tel');
  input.setAttribute('maxlength', '19');

  if (!input.placeholder || input.placeholder.toLowerCase().includes('телефон') || input.placeholder.toLowerCase().includes('phone')) {
    input.placeholder = '+375 (29) 123-45-67';
  }

  const applyMask = () => {
    const formatted = formatBelarusPhone(input.value);
    input.value = formatted === '+375' ? '' : formatted;
  };

  input.addEventListener('focus', () => {
    if (!input.value.trim()) {
      input.value = '+375 (';
    }
  });

  input.addEventListener('blur', () => {
    if (input.value === '+375' || input.value === '+375 (' || input.value === '+375 ()') {
      input.value = '';
    }
  });

  input.addEventListener('input', applyMask);

  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Backspace') {
      return;
    }

    const value = input.value;
    const cursor = input.selectionStart ?? value.length;

    if (cursor <= 6) {
      event.preventDefault();
      input.value = '';
    }
  });
}

export { PHONE_MASK };
