import { openModal } from './modal.js';
import i18n from '../i18n.js';

export function showConfirm(message, options = {}) {
  return new Promise((resolve) => {
    let decided = false;

    openModal({
      title: options.title || i18n.t('common.confirmTitle'),
      message,
      type: options.type || 'info',
      confirmLabel: options.confirmLabel || i18n.t('common.confirm'),
      cancelLabel: options.cancelLabel || i18n.t('common.cancel'),
      onConfirm: () => {
        decided = true;
        resolve(true);
      },
      onClose: () => {
        if (!decided) {
          resolve(false);
        }
      }
    });
  });
}
