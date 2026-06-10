/**
 * ServiceModal.jsx — модальное окно для формы услуги
 * 
 * 🔥 ИСПРАВЛЕНИЕ 1.4: Заголовок только здесь
 * 🔥 ЭТАП 7.8: Полная локализация
 * 🔥 ИСПРАВЛЕНИЕ 1.6: Корректная обработка результата сохранения
 */

import { useRef } from 'react';
import Modal from '../UI/Modal';
import ServiceForm from './ServiceForm';
import { useLanguage } from '../../hooks/useLanguage';

export default function ServiceModal({
  isOpen,
  mode = 'add',
  service = null,
  specialists = [],
  existingServices = [],
  onSave,
  onClose,
}) {
  const { t } = useLanguage();
  const isDirtyRef = useRef(false);

  // 🔥 ИСПРАВЛЕНИЕ 1.6: обрабатываем результат сохранения
  const handleSave = (serviceData) => {
    const result = onSave(serviceData);
    
    // Закрываем модалку и сбрасываем флаг только при успехе
    if (result?.success !== false) {
      isDirtyRef.current = false;
      onClose();
    }
    // При ошибке модалка остаётся открытой — пользователь видит ошибки валидации
  };

  const handleClose = () => {
    if (isDirtyRef.current) {
      const confirmed = window.confirm(t('admin.services.form.unsavedChanges'));
      if (!confirmed) return;
    }
    isDirtyRef.current = false;
    onClose();
  };

  const handleFormChange = () => {
    isDirtyRef.current = true;
  };

  const title = mode === 'edit'
    ? t('admin.services.form.editTitle')
    : t('admin.services.form.addTitle');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
    >
      <div onChange={handleFormChange}>
        <ServiceForm
          mode={mode}
          service={service}
          specialists={specialists}
          existingServices={existingServices}
          onSave={handleSave}
          onCancel={handleClose}
        />
      </div>
    </Modal>
  );
}