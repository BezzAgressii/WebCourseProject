import { Modal } from './modal.js';
import i18n from '../common/i18n.js';

export function showConfirm(message, options = {}) {
  return Modal.confirm(message, {
    title: options.title || i18n.t('common.confirmTitle'),
    type: options.type || 'info',
    confirmLabel: options.confirmLabel || i18n.t('common.confirm'),
    cancelLabel: options.cancelLabel || i18n.t('common.cancel')
  });
}
