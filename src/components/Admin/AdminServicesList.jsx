/**
AdminServicesList.jsx — список услуг с CRUD-операциями
АРХИТЕКТУРНАЯ РОЛЬ:
Отображает все услуги (JSON + кастомные) в виде таблицы.
Управляет открытием/закрытием модалки добавления/редактирования.
🔥 ЭТАП 6.3: Таблица услуг с CRUD
🔥 ЭТАП 7.6: Полная локализация через t()
🔥 ЭТАП 8.1: Удалена колонка "Тип" из таблицы
🔥 ЭТАП 20: Разрешено редактирование стандартных услуг
🔥 ЭТАП 20: Удаление запрещено только для стандартных услуг
🔥 ИСПРАВЛЕНО: Передача specialists в ServiceModal
*/
import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import EmptyState from '../UI/EmptyState';
import ServiceModal from './ServiceModal';
import { SERVICE_CATEGORY_LABELS } from '../../utils/constants';
import { formatPrice, formatDuration } from '../../utils/formatters';
import { useLanguage } from '../../hooks/useLanguage';
import './AdminServicesList.css';

export default function AdminServicesList({
  services,
  specialists = [], // 🔥 ЭТАП 20: список специалистов для назначения
  onAdd,
  onUpdate,
  onDelete,
}) {
  const { t } = useLanguage();

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
    const confirmed = window.confirm(
      t('admin.services.confirmDelete', { name: service.name })
    );
    if (confirmed) {
      onDelete(service.id);
    }
  };

  // 🔥 ЭТАП 20: Разделение прав на редактирование и удаление
  const canEdit = (service) => true; // Всегда можно редактировать
  
  const canDelete = (service) => {
    return service.isCustom || service.id?.startsWith('custom_');
  };

  // === ПУСТОЕ СОСТОЯНИЕ ===
  if (services.length === 0) {
    return (
      <div className="admin-services-list">
        <div className="admin-services-list__header">
          <h2>{t('admin.services.title')}</h2>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={openAddModal}
          >
            {t('admin.services.add')}
          </Button>
        </div>
        <EmptyState
          title={t('admin.services.empty')}
          description={t('admin.services.emptyDescription')}
          variant="info"
        />
        <ServiceModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          service={modalState.service}
          specialists={specialists} // 🔥 ЭТАП 20: передаём специалистов
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
        <h2>
          {t('admin.services.title')} ({services.length})
        </h2>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={openAddModal}
        >
          {t('admin.services.add')}
        </Button>
      </div>

      {/* === ТАБЛИЦА УСЛУГ === */}
      <div className="admin-services-list__table-wrapper">
        <table className="admin-services-list__table">
          <thead>
            <tr>
              <th>{t('admin.services.columns.name')}</th>
              <th>{t('admin.services.columns.category')}</th>
              <th>{t('admin.services.columns.duration')}</th>
              <th>{t('admin.services.columns.price')}</th>
              <th>{t('admin.services.columns.rating')}</th>
              <th>{t('admin.services.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => {
              const isEditable = canEdit(service);
              const isDeletable = canDelete(service);
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
                    <div className="admin-services-list__actions">
                      <button
                        type="button"
                        className="admin-services-list__action-btn"
                        onClick={() => openEditModal(service)}
                        disabled={!isEditable}
                        title={
                          isEditable
                            ? t('common.edit')
                            : t('admin.services.cannotModifyStandard')
                        }
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-services-list__action-btn admin-services-list__action-btn--danger"
                        onClick={() => handleDelete(service)}
                        disabled={!isDeletable}
                        title={
                          isDeletable
                            ? t('common.delete')
                            : t('admin.services.cannotDeleteStandard')
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
        specialists={specialists} //  ЭТАП 20: передаём специалистов
        existingServices={services}
        onSave={handleSave}
        onClose={closeModal}
      />
    </div>
  );
}