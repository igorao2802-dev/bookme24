/**
 * AdminServicesList.jsx — список услуг с CRUD-операциями
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Отображает все услуги (JSON + кастомные) в виде таблицы.
 * Управляет открытием/закрытием модалки добавления/редактирования.
 * 
 * 🔥 ЭТАП 6.3: Таблица услуг с CRUD
 * - JSON-записи помечены как "Стандартные" (нельзя удалить/редактировать)
 * - Кастомные записи можно редактировать и удалять
 * - Удаление требует подтверждения через window.confirm
 */

import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

import Button from '../UI/Button';
import Badge from '../UI/Badge';
import EmptyState from '../UI/EmptyState';
import ServiceModal from './ServiceModal';

import { SERVICE_CATEGORY_LABELS } from '../../utils/constants';
import { formatPrice, formatDuration } from '../../utils/formatters';

import './AdminServicesList.css';

export default function AdminServicesList({
  services,
  onAdd,
  onUpdate,
  onDelete,
}) {
  // === СОСТОЯНИЕ МОДАЛКИ ===
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'add',
    service: null,
  });

  // === ОТКРЫТИЕ МОДАЛКИ ===
  const openAddModal = () => {
    setModalState({ isOpen: true, mode: 'add', service: null });
  };

  const openEditModal = (service) => {
    setModalState({ isOpen: true, mode: 'edit', service });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, mode: 'add', service: null });
  };

  // === ОБРАБОТЧИК СОХРАНЕНИЯ ===
  const handleSave = (serviceData) => {
    if (modalState.mode === 'add') {
      onAdd(serviceData);
    } else {
      onUpdate(modalState.service.id, serviceData);
    }
    closeModal();
  };

  // === ОБРАБОТЧИК УДАЛЕНИЯ ===
  const handleDelete = (service) => {
    // ПОЧЕМУ window.confirm?
    // - Простой встроенный диалог
    // - Блокирующий — защищает от случайного удаления
    const confirmed = window.confirm(
      `Вы уверены, что хотите удалить услугу "${service.name}"?\n\n` +
        `Это действие нельзя отменить.`
    );

    if (confirmed) {
      onDelete(service.id);
    }
  };

  // === ПРОВЕРКА: МОЖНО ЛИ РЕДАКТИРОВАТЬ/УДАЛЯТЬ ===
  // ПОЧЕМУ проверяем isCustom или префикс 'custom_'?
  // - JSON-записи (из services.json) не имеют флага isCustom
  // - Кастомные записи создаются с id 'custom_svc_...' и isCustom: true
  // - Это защита от случайного удаления стандартного каталога
  const canModify = (service) => {
    return service.isCustom || service.id?.startsWith('custom_');
  };

  // === ПУСТОЕ СОСТОЯНИЕ ===
  if (services.length === 0) {
    return (
      <div className="admin-services-list">
        <div className="admin-services-list__header">
          <h2>Каталог услуг</h2>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={openAddModal}
          >
            Добавить услугу
          </Button>
        </div>
        <EmptyState
          title="Услуг пока нет"
          description="Добавьте первую услугу, чтобы клиенты могли записаться"
          variant="info"
        />
        <ServiceModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          service={modalState.service}
          existingServices={services}
          onSave={handleSave}
          onClose={closeModal}
        />
      </div>
    );
  }

  return (
    <div className="admin-services-list">
      {/* === ЗАГОЛОВОК С КНОПКОЙ ДОБАВЛЕНИЯ === */}
      <div className="admin-services-list__header">
        <h2>Каталог услуг ({services.length})</h2>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={openAddModal}
        >
          Добавить услугу
        </Button>
      </div>

      {/* === ТАБЛИЦА УСЛУГ === */}
      <div className="admin-services-list__table-wrapper">
        <table className="admin-services-list__table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Категория</th>
              <th>Длительность</th>
              <th>Цена</th>
              <th>Рейтинг</th>
              <th>Тип</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => {
              const isEditable = canModify(service);
              return (
                <tr key={service.id}>
                  <td className="admin-services-list__name">
                    {service.name}
                  </td>
                  <td>
                    <Badge variant="default" size="sm">
                      {SERVICE_CATEGORY_LABELS[service.category] || service.category}
                    </Badge>
                  </td>
                  <td>{formatDuration(service.duration)}</td>
                  <td className="admin-services-list__price">
                    {formatPrice(service.price)}
                  </td>
                  <td>
                    <span className="admin-services-list__rating">
                      ⭐ {service.rating}
                    </span>
                  </td>
                  <td>
                    {isEditable ? (
                      <Badge variant="success" size="sm">Кастомная</Badge>
                    ) : (
                      <Badge variant="default" size="sm">Стандартная</Badge>
                    )}
                  </td>
                  <td>
                    <div className="admin-services-list__actions">
                      <button
                        type="button"
                        className="admin-services-list__action-btn"
                        onClick={() => openEditModal(service)}
                        disabled={!isEditable}
                        title={
                          isEditable
                            ? 'Редактировать услугу'
                            : 'Нельзя редактировать стандартную услугу'
                        }
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-services-list__action-btn admin-services-list__action-btn--danger"
                        onClick={() => handleDelete(service)}
                        disabled={!isEditable}
                        title={
                          isEditable
                            ? 'Удалить услугу'
                            : 'Нельзя удалить стандартную услугу'
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* === МОДАЛКА ДОБАВЛЕНИЯ/РЕДАКТИРОВАНИЯ === */}
      <ServiceModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        service={modalState.service}
        existingServices={services}
        onSave={handleSave}
        onClose={closeModal}
      />
    </div>
  );
}