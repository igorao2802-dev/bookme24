/**
 * SpecialistModal.jsx — модальное окно для формы специалиста
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Полностью аналогична ServiceModal, но для SpecialistForm.
 * - Управляет открытием/закрытием окна
 * - Предупреждает о несохранённых данных при закрытии
 * - Передаёт данные формы родителю через onSave
 * 
 * 🔥 ЭТАП 8.5: Модалка с локализацией и подтверждением закрытия
 */

import { useRef } from 'react';
import Modal from '../UI/Modal';
import SpecialistForm from './SpecialistForm';
import { useLanguage } from '../../hooks/useLanguage'; // 🔥 ЭТАП 7.5: локализация

export default function SpecialistModal({
  isOpen,
  mode = 'add',
  specialist = null,
  services = [],
  existingSpecialists = [],
  onSave,
  onClose,
}) {
  const { t } = useLanguage(); // 🔥 ЭТАП 7.5

  // === REF ДЛЯ ОТСЛЕЖИВАНИЯ ИЗМЕНЕНИЙ ===
  const isDirtyRef = useRef(false);

  // === ОБРАБОТЧИК СОХРАНЕНИЯ ===
  const handleSave = (specialistData) => {
    isDirtyRef.current = false;
    onSave(specialistData);
  };

  // === ОБРАБОТЧИК ЗАКРЫТИЯ С ПОДТВЕРЖДЕНИЕМ ===
  const handleClose = () => {
    if (isDirtyRef.current) {
      const confirmed = window.confirm(
        t('admin.specialists.form.unsavedChanges')
      );
      if (!confirmed) return;
    }

    isDirtyRef.current = false;
    onClose();
  };

  // === ОБРАБОТЧИК ИЗМЕНЕНИЙ ===
  const handleFormChange = () => {
    isDirtyRef.current = true;
  };

  // === ЗАГОЛОВОК МОДАЛКИ ===
  const title = mode === 'edit'
    ? t('admin.specialists.form.editTitle')
    : t('admin.specialists.form.addTitle');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
    >
      <div onChange={handleFormChange}>
        <SpecialistForm
          mode={mode}
          specialist={specialist}
          services={services}
          existingSpecialists={existingSpecialists}
          onSave={handleSave}
          onCancel={handleClose}
        />
      </div>
    </Modal>
  );
}