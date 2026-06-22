/**
 * AdminSpecialistsList.jsx — список специалистов с CRUD-операциями
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Отображает всех специалистов (JSON + кастомные) в виде таблицы.
 * Управляет открытием/закрытием модалки добавления/редактирования.
 * 
 * 🔥 ЭТАП 6.3: Таблица специалистов с CRUD
 * 🔥 ЭТАП 7.6: Полная локализация через t()
 * 🔥 ЭТАП 8.1: Удалена колонка "Тип" из таблицы
 * 🔥 ЭТАП 11: Tooltip с перечнем услуг при наведении на количество
 * 🔥 ИСПРАВЛЕНО: Опечатка onCl ose → onClose
 * 🔥 ИСПРАВЛЕНО: Стаж теперь отображается корректно (в годах, не в минутах)
 */
import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import EmptyState from '../UI/EmptyState';
import SpecialistModal from './SpecialistModal';
import { useLanguage } from '../../hooks/useLanguage';
import './AdminSpecialistsList.css';

export default function AdminSpecialistsList({
  specialists,
  services,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const { t } = useLanguage();

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
      t('admin.specialists.confirmDelete', { name: specialist.fullName })
    );
    if (confirmed) {
      onDelete(specialist.id);
    }
  };

  // === ПРОВЕРКА ДОСТУПНОСТИ РЕДАКТИРОВАНИЯ ===
  const canModify = (specialist) => {
    return specialist.isCustom || specialist.id?.startsWith('custom_');
  };

  // 🔥 ЭТАП 11: ПОЛУЧЕНИЕ УСЛУГ СПЕЦИАЛИСТА
  // ПОЧЕМУ useMemo с зависимостью от services?
  // - Услуги могут обновляться (добавление/удаление)
  // - При изменении services нужно пересчитать список для каждого специалиста
  const getSpecialistServices = (specialist) => {
    if (!specialist.serviceIds || !Array.isArray(specialist.serviceIds)) {
      return [];
    }
    return services.filter((s) => specialist.serviceIds.includes(s.id));
  };

  // 🔥 ЭТАП 11: ФОРМИРОВАНИЕ СТРОКИ С НАЗВАНИЯМИ УСЛУГ ДЛЯ TOOLTIP
  // ПОЧЕМУ отдельная функция?
  // - Инкапсулирует логику формирования строки
  // - Легко переиспользовать в рендере
  // - Возвращает fallback, если услуг нет
  const getServiceNamesString = (specialist) => {
    const specialistServices = getSpecialistServices(specialist);
    if (specialistServices.length === 0) {
      return t('admin.specialists.noServicesAssigned') || 'Нет назначенных услуг';
    }
    return specialistServices.map((s) => s.name).join(', ');
  };

  // === ПУСТОЕ СОСТОЯНИЕ ===
  if (specialists.length === 0) {
    return (
      <div className="admin-specialists-list">
        <div className="admin-specialists-list__header">
          <h2>{t('admin.specialists.title')}</h2>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={openAddModal}
          >
            {t('admin.specialists.add')}
          </Button>
        </div>
        <EmptyState
          title={t('admin.specialists.empty')}
          description={t('admin.specialists.emptyDescription')}
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
        <h2>
          {t('admin.specialists.title')} ({specialists.length})
        </h2>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={openAddModal}
        >
          {t('admin.specialists.add')}
        </Button>
      </div>

      {/* === ТАБЛИЦА === */}
      <div className="admin-specialists-list__table-wrapper">
        <table className="admin-specialists-list__table">
          <thead>
            <tr>
              <th>{t('admin.specialists.columns.fullName')}</th>
              <th>{t('admin.specialists.columns.position')}</th>
              <th>{t('admin.specialists.columns.experience')}</th>
              <th>{t('admin.specialists.columns.rating')}</th>
              <th>{t('admin.specialists.columns.servicesCount')}</th>
              {/* 🔥 ЭТАП 8.1: Колонка "Тип" удалена */}
              <th>{t('admin.specialists.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {specialists.map((specialist) => {
              const isEditable = canModify(specialist);
              const specialistServices = getSpecialistServices(specialist);
              const serviceCount = specialistServices.length;
              // 🔥 ЭТАП 11: Строка с названиями услуг для tooltip
              const serviceNamesTooltip = getServiceNamesString(specialist);

              return (
                <tr key={specialist.id}>
                  <td className="admin-specialists-list__name">
                    {specialist.fullName}
                  </td>
                  <td>{specialist.position}</td>
                  {/* 🔥 ИСПРАВЛЕНО: Стаж теперь отображается корректно (в годах) */}
                  <td>
                    {t('catalog.specialist.experience', { 
                      years: specialist.experience 
                    })}
                  </td>
                  <td>
                    <span className="admin-specialists-list__rating">
                      ⭐ {specialist.rating}
                    </span>
                  </td>
                  {/* 🔥 ЭТАП 11: Ячейка с tooltip, показывающим перечень услуг */}
                  <td>
                    <div 
                      className="admin-specialists-list__services-cell"
                      title={serviceNamesTooltip}
                    >
                      <Badge 
                        variant={serviceCount > 0 ? 'default' : 'warning'} 
                        size="sm"
                      >
                        {serviceCount}
                      </Badge>
                    </div>
                  </td>
                  {/* 🔥 ЭТАП 8.1: Ячейка "Тип" удалена */}
                  <td>
                    <div className="admin-specialists-list__actions">
                      <button
                        type="button"
                        className="admin-specialists-list__action-btn"
                        onClick={() => openEditModal(specialist)}
                        disabled={!isEditable}
                        title={
                          isEditable
                            ? t('common.edit')
                            : t('admin.specialists.cannotModifyStandard')
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
                            ? t('common.delete')
                            : t('admin.specialists.cannotDeleteStandard')
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