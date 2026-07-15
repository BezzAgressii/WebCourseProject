export function openModal({
  title,
  message,
  type = 'info',
  onClose,
  onConfirm,
  actionHref,
  actionLabel = 'OK',
  confirmLabel,
  cancelLabel,
  closeLabel = 'OK'
}) {
  const modal = document.createElement('div');
  let settled = false;

  modal.className = 'auth-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'auth-modal-title');

  let actions;

  if (typeof onConfirm === 'function') {
    actions = `
      <div class="auth-modal__actions">
        <button class="auth-modal__button" type="button" data-action="confirm">${confirmLabel || actionLabel}</button>
        <button class="auth-modal__button auth-modal__button--ghost" type="button" data-action="close">${cancelLabel || closeLabel}</button>
      </div>
    `;
  } else if (actionHref) {
    actions = `
      <div class="auth-modal__actions">
        <a class="auth-modal__button" href="${actionHref}">${actionLabel}</a>
        <button class="auth-modal__button auth-modal__button--ghost" type="button" data-action="close">${closeLabel}</button>
      </div>
    `;
  } else {
    actions = `<button class="auth-modal__button" type="button" data-action="close">${closeLabel}</button>`;
  }

  modal.innerHTML = `
    <div class="auth-modal__backdrop" data-action="close"></div>
    <section class="auth-modal__dialog auth-modal__dialog--${type}">
      <button class="auth-modal__close" type="button" data-action="close" aria-label="Закрыть">×</button>
      <h2 class="auth-modal__title" id="auth-modal-title">${title}</h2>
      <p class="auth-modal__message">${message}</p>
      ${actions}
    </section>
  `;

  const finish = (callback) => {
    if (settled) {
      return;
    }

    settled = true;
    document.removeEventListener('keydown', onKeyDown);
    modal.remove();
    callback?.();
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      finish(onClose);
    }
  };

  modal.querySelectorAll('[data-action="close"]').forEach((element) => {
    element.addEventListener('click', () => finish(onClose));
  });

  modal.querySelectorAll('[data-action="confirm"]').forEach((element) => {
    element.addEventListener('click', () => finish(onConfirm));
  });

  document.addEventListener('keydown', onKeyDown);
  document.body.append(modal);
  modal.querySelector('.auth-modal__close').focus();
}
