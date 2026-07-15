const PASSWORD_TOGGLE_ICON = `
  <svg class="auth-password-toggle__icon auth-password-toggle__icon--show" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.8"/>
  </svg>
  <svg class="auth-password-toggle__icon auth-password-toggle__icon--hide" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 3l18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M10.6 10.6a3.2 3.2 0 0 0 4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M9.9 5.3A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3.1 3.9M6.1 6.1C3.8 7.8 2 12 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.9-.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

export function bindPasswordToggles(root = document) {
  root.querySelectorAll('.auth-password-toggle').forEach((button) => {
    if (!button.querySelector('.auth-password-toggle__icon')) {
      button.innerHTML = PASSWORD_TOGGLE_ICON;
    }

    button.addEventListener('click', () => {
      const control = button.closest('.auth-field__control');
      const input = control?.querySelector('input.auth-field__input, input[type="password"], input[type="text"]');

      if (!input) {
        return;
      }

      const willShow = input.type === 'password';
      input.type = willShow ? 'text' : 'password';
      button.classList.toggle('auth-password-toggle--visible', willShow);
      button.setAttribute('aria-pressed', String(willShow));
      button.setAttribute('aria-label', willShow ? 'Скрыть пароль' : 'Показать пароль');
    });
  });
}
