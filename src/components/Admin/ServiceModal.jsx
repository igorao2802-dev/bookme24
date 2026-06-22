/**
 * SpecialistModal.jsx — модальное окно для формы специалиста
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Управляет состоянием открытия/закрытия модального окна.
 * Предотвращает случайное закрытие при несохранённых изменениях.
 * 
 * 🔥 ИСПРАВЛЕНИЕ 1.4: Заголовок только здесь
 * 🔥 ЭТАП 7.8: Полная локализация
 * 🔥 ИСПРАВЛЕНИЕ 1.6: Корректная обработка результата сохранения
 * 🔥 ИСПРАВЛЕНО: Безопасный доступ к specialist?.id
 */
import { useRef } from 'react';
import Modal from '../UI/Modal';
import SpecialistForm from './SpecialistForm';
import { useLanguage } from '../../hooks/useLanguage';

export default function SpecialistModal({
  isOpen,
  mode = 'add',
  specialist = null,
  services = [],
  existingSpecialists = [],
  onSave,
  onClose,
}) {
  const { t } = useLanguage();
  const isDirtyRef = useRef(false);

  // 🔥 ИСПРАВЛЕНИЕ 1.6: обрабатываем результат сохранения
  const handleSave = (specialistData) => {
    const result = onSave(specialistData);
    if (result?.success !== false) {
      isDirtyRef.current = false;
      onClose();
    }
  };

  const handleClose = () => {
    if (isDirtyRef.current) {
      const confirmed = window.confirm(t('admin.specialists.form.unsavedChanges'));
      if (!confirmed) return;
    }
    isDirtyRef.current = false;
    onClose();
  };

  const handleFormChange = () => {
    isDirtyRef.current = true;
  };

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