/**
 * ServiceModal.jsx — модальное окно для формы услуги
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Управляет состоянием открытия/закрытия модального окна.
 * Предотвращает случайное закрытие при несохранённых изменениях.
 * 
 * 🔥 ИСПРАВЛЕНИЕ 1.4: Заголовок только здесь
 * 🔥 ЭТАП 7.8: Полная локализация
 * 🔥 ИСПРАВЛЕНИЕ 1.6: Корректная обработка результата сохранения
 * 🔥 ЭТАП 9: Передаёт список специалистов в ServiceForm
 */
import { useRef } from 'react';
import Modal from '../UI/Modal';
import ServiceForm from './ServiceForm';
import { useLanguage } from '../../hooks/useLanguage';

export default function ServiceModal({
  isOpen,
  mode = 'add',
  service = null,
  specialists = [], // 🔥 ЭТАП 9: новый prop
  existingServices = [],
  onSave,
  onClose,
}) {
  const { t } = useLanguage();
  const isDirtyRef = useRef(false);

  // === ЗАГОЛОВОК В ЗАВИСИМОСТИ ОТ РЕЖИМА ===
  const modalTitle =
    mode === 'add'
      ? t('admin.services.form.addTitle')
      : t('admin.services.form.editTitle');

  // === ОБРАБОТЧИК ЗАКРЫТИЯ С ПРОВЕРКОЙ СОСТОЯНИЯ ===
  const handleClose = () => {
    if (isDirtyRef.current) {
      const confirmed = window.confirm(t('admin.services.form.unsavedChanges'));
      if (!confirmed) return;
    }
    onClose();
  };

  // === ОБРАБОТЧИК СОХРАНЕНИЯ ===
  const handleSave = (serviceData) => {
    const result = onSave(serviceData);
    if (result?.success) {
      isDirtyRef.current = false;
      onClose();
    }
  };

  // === ОТСЛЕЖИВАНИЕ ИЗМЕНЕНИЙ ===
  const handleFormChange = () => {
    isDirtyRef.current = true;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      size="lg"
    >
      <ServiceForm
        mode={mode}
        service={service}
        specialists={specialists} // 🔥 ЭТАП 9
        existingServices={existingServices}
        onSave={handleSave}
        onCancel={handleClose}
        onChange={handleFormChange}
      />
    </Modal>
  );
}