import api from '../api.js';
import i18n from '../i18n.js';
import { openModal } from '../components/modal.js';
import { bindPasswordToggles } from './password-toggle.js';

class Register {
  constructor() {
    this.form = document.getElementById('register-form');
    this.nicknameAttempts = 0;
    this.fields = Object.fromEntries([...this.form.elements].filter((item) => item.name).map((item) => [item.name, item]));
  }

  async init() {
    await i18n.init();
    const date = new Date();
    date.setFullYear(date.getFullYear() - 16);
    this.fields.birthDate.max = date.toISOString().slice(0, 10);
    this.bindEvents();
    bindPasswordToggles(this.form);
    this.generateAutoPassword();
  }

  bindEvents() {
    this.form.addEventListener('submit', (event) => this.handleSubmit(event));
    this.fields.phone.addEventListener('input', () => this.formatPhone(this.fields.phone));
    ['firstName', 'lastName', 'birthDate', 'phone', 'email', 'nickname', 'password', 'confirmPassword'].forEach((name) => this.fields[name].addEventListener('input', () => this.validateField(this.fields[name])));
    this.fields.password.addEventListener('input', () => this.updatePasswordRequirements());
    this.fields.confirmPassword.addEventListener('input', () => this.validatePasswordMatch());
    this.form.querySelectorAll('[name="passwordMethod"]').forEach((input) => input.addEventListener('change', () => this.togglePasswordMethod(input.value)));
    document.getElementById('generate-password').addEventListener('click', () => this.generateAutoPassword());
    document.getElementById('copy-password').addEventListener('click', () => navigator.clipboard.writeText(this.fields.generatedPassword.value));
    document.getElementById('generate-nickname').addEventListener('click', () => this.generateNickname());
  }

  togglePasswordMethod(method) {
    document.getElementById('manual-password-box').hidden = method !== 'manual';
    document.getElementById('auto-password-box').hidden = method !== 'auto';
  }

  formatPhone(input) {
    const digits = input.value.replace(/\D/g, '').replace(/^375/, '').slice(0, 9);
    const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)];
    input.value = `+375${parts[0] ? ` (${parts[0]}` : ''}${parts[0].length === 2 ? ')' : ''}${parts[1] ? ` ${parts[1]}` : ''}${parts[2] ? `-${parts[2]}` : ''}${parts[3] ? `-${parts[3]}` : ''}`;
  }

  updatePasswordRequirements() {
    const password = this.fields.password.value;
    const requirements = { length: /^.{8,20}$/, upper: /[A-ZА-Я]/, lower: /[a-zа-я]/, digit: /\d/, special: /[^A-Za-zА-Яа-я0-9]/ };
    Object.entries(requirements).forEach(([name, pattern]) => this.form.querySelector(`[data-requirement="${name}"]`).classList.toggle('auth-requirements__item--valid', pattern.test(password)));
  }

  validatePasswordMatch() {
    const valid = this.fields.password.value === this.fields.confirmPassword.value;
    valid ? this.clearError(this.fields.confirmPassword) : this.showError(this.fields.confirmPassword, i18n.t('validation.passwordMatch'));
    return valid;
  }

  generateAutoPassword() {
    const pools = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789', '!@#$%^&*'];
    const chars = pools.map((pool) => pool[Math.floor(Math.random() * pool.length)]);
    const all = pools.join('');
    while (chars.length < 12) chars.push(all[Math.floor(Math.random() * all.length)]);
    this.fields.generatedPassword.value = chars.sort(() => Math.random() - 0.5).join('');
  }

  generateNickname() {
    if (this.nicknameAttempts >= 5) return;
    const adjectives = ['Fresh', 'Clean', 'Smart', 'Green', 'Cool'];
    const nouns = ['Air', 'Vent', 'Flow', 'Breeze', 'Cloud'];
    this.fields.nickname.value = `${adjectives[Math.floor(Math.random() * adjectives.length)]}_${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(10 + Math.random() * 90)}`;
    this.nicknameAttempts += 1;
    this.validateField(this.fields.nickname);
  }

  validateField(input) {
    const value = input.value.trim();
    const namePattern = /^[A-Za-zА-Яа-яЁё]{2,}$/;
    const checks = {
      firstName: () => namePattern.test(value) || 'validation.name',
      lastName: () => namePattern.test(value) || 'validation.name',
      phone: () => /^\+375 \((29|33|25|44)\) \d{3}-\d{2}-\d{2}$/.test(value) || 'validation.phone',
      email: () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'validation.email',
      birthDate: () => {
        const birthDate = new Date(`${value}T00:00:00`);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();

        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
          age -= 1;
        }

        return age >= 16 || 'validation.birthDate';
      },
      nickname: () => /^[a-zA-Z0-9_]{3,20}$/.test(value) || 'validation.nickname',
      password: () => /^(?=.{8,20}$)(?=.*[A-ZА-Я])(?=.*[a-zа-я])(?=.*\d)(?=.*[^A-Za-zА-Яа-я0-9]).*$/.test(value) || 'validation.password',
      confirmPassword: () => this.validatePasswordMatch()
    };
    if (!checks[input.name]) return true;
    const result = checks[input.name]();
    if (result === true) { this.clearError(input); return true; }
    this.showError(input, i18n.t(result)); return false;
  }

  showError(field, message) { field.closest('.auth-field')?.classList.add('auth-field--invalid'); const error = field.closest('.auth-field')?.querySelector('.auth-field__error'); if (error) error.textContent = message; }
  clearError(field) { field.closest('.auth-field')?.classList.remove('auth-field--invalid'); const error = field.closest('.auth-field')?.querySelector('.auth-field__error'); if (error) error.textContent = ''; }

  async handleSubmit(event) {
    event.preventDefault();
    const method = this.form.querySelector('[name="passwordMethod"]:checked').value;
    const required = ['firstName', 'lastName', 'birthDate', 'phone', 'email', 'nickname'];
    const valid = required.every((name) => this.validateField(this.fields[name])) && (method === 'auto' || (this.validateField(this.fields.password) && this.validatePasswordMatch()));
    if (!this.fields.agreement.checked) { document.getElementById('agreement-error').textContent = i18n.t('validation.agreement'); return; }
    if (!valid) return;
    const userData = { firstName:this.fields.firstName.value.trim(), lastName:this.fields.lastName.value.trim(), middleName:this.fields.middleName.value.trim(), birthDate:this.fields.birthDate.value, phone:this.fields.phone.value, email:this.fields.email.value.trim(), nickname:this.fields.nickname.value.trim(), password:method === 'auto' ? this.fields.generatedPassword.value : this.fields.password.value, role:'user', createdAt:new Date().toISOString() };
    const user = await api.createUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(user));
    openModal({ title:i18n.t('auth.register.successTitle'), message:i18n.t('auth.register.successMessage'), type:'success', onClose:() => { window.location.href='catalog.html'; } });
  }
}
new Register().init();
