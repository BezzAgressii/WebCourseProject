import api from '../api.js';
import i18n from '../i18n.js';
import { Modal } from '../components/modal.js';
import { bindPasswordToggles } from './password-toggle.js';

class Login {
  constructor() {
    this.form = document.getElementById('login-form');
    this.identifier = this.form.elements.identifier;
    this.password = this.form.elements.password;
  }

  async init() {
    await i18n.init();
    bindPasswordToggles(this.form);
    this.form.addEventListener('submit', (event) => this.handleSubmit(event));
    [this.identifier, this.password].forEach((input) => {
      input.addEventListener('input', () => this.validateField(input));
    });
  }

  validateField(input) {
    const value = input.value.trim();
    const valid = value.length > 0;
    const error = input.closest('.auth-field').querySelector('.auth-field__error');
    input.closest('.auth-field').classList.toggle('auth-field--invalid', !valid);
    error.textContent = valid ? '' : i18n.t('validation.required');
    return valid;
  }

  showLoginError(message) {
    Modal.showError(message, { title: i18n.t('auth.login.errorTitle') });
  }

  async handleSubmit(event) {
    event.preventDefault();

    if (![this.identifier, this.password].every((input) => this.validateField(input))) {
      return;
    }

    const value = this.identifier.value.trim().toLowerCase();
    const users = await api.getUsers();
    const user = users.find(
      (item) =>
        (item.email.toLowerCase() === value || item.phone === this.identifier.value.trim()) &&
        item.password === this.password.value
    );

    if (!user) {
      this.showLoginError(i18n.t('auth.login.invalidCredentials'));
      return;
    }

    const storage = this.form.elements.remember.checked ? localStorage : sessionStorage;
    storage.setItem('currentUser', JSON.stringify(user));

    if (user.role === 'admin') {
      window.location.href = 'admin.html';
      return;
    }

    if (user.role === 'guest') {
      window.location.href = 'index.html';
      return;
    }

    window.location.href = 'catalog.html';
  }
}

new Login().init();
