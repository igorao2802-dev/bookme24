/**
 * ServiceModal.jsx — модальное окно для формы услуги
 *
 * 🔥 ИСПРАВЛЕНО: Корректная передача specialists в форму
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

  const handleSave = (serviceData) => {
    const result = onSave(serviceData);
    if (result?.success !== false) {
      isDirtyRef.current = false;
      onClose();
    }
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

  const title =
    mode === 'edit'
      ? t('admin.services.form.editTitle')
      : t('admin.services.form.addTitle');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
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