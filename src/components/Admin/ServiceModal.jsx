/**
 * ServiceModal.jsx — модальное окно для формы услуги
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Обёртка над ServiceForm в компонент Modal.
 * - Управляет открытием/закрытием окна
 * - Предупреждает о несохранённых данных при закрытии
 * - Передаёт данные формы родителю через onSave
 * 
 * ПОЧЕМУ отдельный компонент, а не直接使用 Modal + ServiceForm?
 * - Инкапсуляция логики отслеживания изменений (isDirty)
 * - Переиспользование: можно вызвать из любого места
 * - Чёткое разделение ответственности
 * 
 * 🔥 ЭТАП 8.5: Модалка с локализацией и подтверждением закрытия
 */

import { useRef } from 'react';
import Modal from '../UI/Modal';
import ServiceForm from './ServiceForm';
import { useLanguage } from '../../hooks/useLanguage'; // 🔥 ЭТАП 7.5: локализация

export default function ServiceModal({
  isOpen,
  mode = 'add',
  service = null,
  existingServices = [],
  onSave,
  onClose,
}) {
  const { t } = useLanguage(); // 🔥 ЭТАП 7.5

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
        t('admin.services.form.unsavedChanges')
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

  // === ЗАГОЛОВОК МОДАЛКИ ===
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
          existingServices={existingServices}
          onSave={handleSave}
          onCancel={handleClose}
        />
      </div>
    </Modal>
  );
}