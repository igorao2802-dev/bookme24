/**
 * ServiceModal.jsx — модальное окно для формы услуги
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Обёртка над ServiceForm в компонент Modal.
 * - Управляет открытием/закрытием окна
 * - Предупреждает о несохранённых данных при закрытии
 * - Передаёт данные формы родителю через onSave
 * 
 * 🔥 ЭТАП 6.3: Модалка с подтверждением закрытия
 */

import { useRef } from 'react';
import Modal from '../UI/Modal';
import ServiceForm from './ServiceForm';

export default function ServiceModal({
  isOpen,
  mode = 'add',
  service = null,
  existingServices = [],
  onSave,
  onClose,
}) {
  // === REF ДЛЯ ОТСЛЕЖИВАНИЯ ИЗМЕНЕНИЙ ===
  // ПОЧЕМУ useRef, а не useState?
  // - Нам не нужен ререндер при изменении флага isDirty
  // - Ref сохраняет значение между рендерами без side-effects
  // - Используется только в обработчике закрытия
  const isDirtyRef = useRef(false);

  // === ОБРАБОТЧИК СОХРАНЕНИЯ ===
  // ПОЧЕМУ обёртка? Нужно сбросить флаг isDirty после успешного сохранения
  const handleSave = (serviceData) => {
    isDirtyRef.current = false; // Помечаем, что изменения сохранены
    onSave(serviceData);
  };

  // === ОБРАБОТЧИК ЗАКРЫТИЯ С ПОДТВЕРЖДЕНИЕМ ===
  const handleClose = () => {
    // Если есть несохранённые изменения — предупреждаем
    // ПОЧЕМУ window.confirm?
    // - Простой встроенный диалог, не требует создания модалки внутри модалки
    // - Блокирующий вызов — пользователь должен принять решение
    // - Работает даже при закрытии по Escape или клику на overlay
    if (isDirtyRef.current) {
      const confirmed = window.confirm(
        'У вас есть несохранённые изменения. Вы уверены, что хотите закрыть форму?'
      );
      if (!confirmed) return;
    }

    isDirtyRef.current = false;
    onClose();
  };

  // === ОБРАБОТЧИК ИЗМЕНЕНИЙ (помечаем форму как "грязную") ===
  // ПОЧЕМУ отдельная обёртка для формы?
  // ServiceForm не знает о isDirty, это ответственность модалки
  // Обёртка onChange позволяет отслеживать любые изменения полей
  const handleFormChange = () => {
    isDirtyRef.current = true;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'edit' ? 'Редактировать услугу' : 'Добавить услугу'}
      size="lg"
    >
      <div onChange={handleFormChange}>
        <ServiceForm
          mode={mode}
          service={service}
          existingServices={existingServices}
          onSave={handleSave}
          onCancel={handleClose}
        />
      </div>
    </Modal>
  );
}