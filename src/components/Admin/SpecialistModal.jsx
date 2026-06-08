/**
 * SpecialistModal.jsx — модальное окно для формы специалиста
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Полностью аналогична ServiceModal, но для SpecialistForm.
 * 
 * 🔥 ЭТАП 6.3: Модалка с подтверждением закрытия
 */

import { useRef } from 'react';
import Modal from '../UI/Modal';
import SpecialistForm from './SpecialistForm';

export default function SpecialistModal({
  isOpen,
  mode = 'add',
  specialist = null,
  services = [],
  existingSpecialists = [],
  onSave,
  onClose,
}) {
  const isDirtyRef = useRef(false);

  const handleSave = (specialistData) => {
    isDirtyRef.current = false;
    onSave(specialistData);
  };

  const handleClose = () => {
    if (isDirtyRef.current) {
      const confirmed = window.confirm(
        'У вас есть несохранённые изменения. Вы уверены, что хотите закрыть форму?'
      );
      if (!confirmed) return;
    }

    isDirtyRef.current = false;
    onClose();
  };

  const handleFormChange = () => {
    isDirtyRef.current = true;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'edit' ? 'Редактировать специалиста' : 'Добавить специалиста'}
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