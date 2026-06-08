/**
 * AdminSpecialistsList.jsx — список специалистов с CRUD-операциями
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Отображает всех специалистов (JSON + кастомные) в виде таблицы.
 * Управляет открытием/закрытием модалки добавления/редактирования.
 * 
 * 🔥 ЭТАП 6.3: Таблица специалистов с CRUD
 * - Показывает количество услуг, которые оказывает мастер
 * - Защита JSON-записей от удаления
 * - Подтверждение перед удалением
 */

import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

import Button from '../UI/Button';
import Badge from '../UI/Badge';
import EmptyState from '../UI/EmptyState';
import SpecialistModal from './SpecialistModal';

import './AdminSpecialistsList.css';

export default function AdminSpecialistsList({
  specialists,
  services,
  onAdd,
  onUpdate,
  onDelete,
}) {
  // === СОСТОЯНИЕ МОДАЛКИ ===
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'add',
    specialist: null,
  });

  // === ОТКРЫТИЕ/ЗАКРЫТИЕ МОДАЛКИ ===
  const openAddModal = () => {
    setModalState({ isOpen: true, mode: 'add', specialist: null });
  };

  const openEditModal = (specialist) => {
    setModalState({ isOpen: true, mode: 'edit', specialist });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, mode: 'add', specialist: null });
  };

  // === СОХРАНЕНИЕ ===
  const handleSave = (specialistData) => {
    if (modalState.mode === 'add') {
      onAdd(specialistData);
    } else {
      onUpdate(modalState.specialist.id, specialistData);
    }
    closeModal();
  };

  // === УДАЛЕНИЕ С ПОДТВЕРЖДЕНИЕМ ===
  const handleDelete = (specialist) => {
    const confirmed = window.confirm(
      `Вы уверены, что хотите удалить специалиста "${specialist.fullName}"?\n\n` +
        `Это действие нельзя отменить.`
    );

    if (confirmed) {
      onDelete(specialist.id);
    }
  };

  // === ПРОВЕРКА ДОСТУПНОСТИ РЕДАКТИРОВАНИЯ ===
  const canModify = (specialist) => {
    return specialist.isCustom || specialist.id?.startsWith('custom_');
  };

  // === ПОДСЧЁТ УСЛУГ МАСТЕРА ===
  const getServiceCount = (specialist) => {
    if (!specialist.serviceIds || !Array.isArray(specialist.serviceIds)) {
      return 0;
    }
    return specialist.serviceIds.length;
  };

  // === ПУСТОЕ СОСТОЯНИЕ ===
  if (specialists.length === 0) {
    return (
      <div className="admin-specialists-list">
        <div className="admin-specialists-list__header">
          <h2>Специалисты</h2>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={openAddModal}
          >
            Добавить специалиста
          </Button>
        </div>
        <EmptyState
          title="Специалистов пока нет"
          description="Добавьте первого специалиста, чтобы клиенты могли выбрать мастера"
          variant="info"
        />
        <SpecialistModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          specialist={modalState.specialist}
          services={services}
          existingSpecialists={specialists}
          onSave={handleSave}
          onClose={closeModal}
        />
      </div>
    );
  }

  return (
    <div className="admin-specialists-list">
      {/* === ЗАГОЛОВОК === */}
      <div className="admin-specialists-list__header">
        <h2>Специалисты ({specialists.length})</h2>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={openAddModal}
        >
          Добавить специалиста
        </Button>
      </div>

      {/* === ТАБЛИЦА === */}
      <div className="admin-specialists-list__table-wrapper">
        <table className="admin-specialists-list__table">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Должность</th>
              <th>Стаж</th>
              <th>Рейтинг</th>
              <th>Услуг</th>
              <th>Тип</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {specialists.map((specialist) => {
              const isEditable = canModify(specialist);
              const serviceCount = getServiceCount(specialist);
              return (
                <tr key={specialist.id}>
                  <td className="admin-specialists-list__name">
                    {specialist.fullName}
                  </td>
                  <td>{specialist.position}</td>
                  <td>{specialist.experience} лет</td>
                  <td>
                    <span className="admin-specialists-list__rating">
                      ⭐ {specialist.rating}
                    </span>
                  </td>
                  <td>
                    <Badge variant="default" size="sm">
                      {serviceCount}
                    </Badge>
                  </td>
                  <td>
                    {isEditable ? (
                      <Badge variant="success" size="sm">Кастомный</Badge>
                    ) : (
                      <Badge variant="default" size="sm">Стандартный</Badge>
                    )}
                  </td>
                  <td>
                    <div className="admin-specialists-list__actions">
                      <button
                        type="button"
                        className="admin-specialists-list__action-btn"
                        onClick={() => openEditModal(specialist)}
                        disabled={!isEditable}
                        title={
                          isEditable
                            ? 'Редактировать специалиста'
                            : 'Нельзя редактировать стандартного специалиста'
                        }
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-specialists-list__action-btn admin-specialists-list__action-btn--danger"
                        onClick={() => handleDelete(specialist)}
                        disabled={!isEditable}
                        title={
                          isEditable
                            ? 'Удалить специалиста'
                            : 'Нельзя удалить стандартного специалиста'
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

      {/* === МОДАЛКА === */}
      <SpecialistModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        specialist={modalState.specialist}
        services={services}
        existingSpecialists={specialists}
        onSave={handleSave}
        onClose={closeModal}
      />
    </div>
  );
}