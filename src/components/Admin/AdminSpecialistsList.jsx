/**
 * AdminSpecialistsList.jsx — список специалистов с CRUD-операциями
 *
 * 🔥 ИСПРАВЛЕНО:
 * - Редактирование разрешено для всех специалистов
 * - Удаление только для кастомных
 * - Строковое сравнение ID
 * - Tooltip с услугами при наведении
 */
import { useState } from 'react';
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

  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'add',
    specialist: null,
  });

  const openAddModal = () => {
    setModalState({ isOpen: true, mode: 'add', specialist: null });
  };

  const openEditModal = (specialist) => {
    setModalState({ isOpen: true, mode: 'edit', specialist });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, mode: 'add', specialist: null });
  };

  const handleSave = (specialistData) => {
    if (modalState.mode === 'add') {
      onAdd(specialistData);
    } else {
      onUpdate(modalState.specialist.id, specialistData);
    }
    closeModal();
  };

  const handleDelete = (specialist) => {
    const confirmed = window.confirm(
      t('admin.specialists.confirmDelete', { name: specialist.fullName }),
    );
    if (confirmed) {
      onDelete(specialist.id);
    }
  };

  const canEdit = () => true;

  const canDelete = (specialist) => {
    return specialist.isCustom || String(specialist.id).startsWith('custom_');
  };

  const getServiceCount = (specialist) => {
    if (!specialist.serviceIds || !Array.isArray(specialist.serviceIds)) {
      return 0;
    }
    return specialist.serviceIds.length;
  };

  // 🔥 Tooltip с перечнем услуг
  const getServiceNamesString = (specialist) => {
    if (!specialist.serviceIds || !Array.isArray(specialist.serviceIds)) {
      return t('admin.specialists.noServicesAssigned') || 'Нет назначенных услуг';
    }
    const names = specialist.serviceIds
      .map((id) => services.find((s) => String(s.id) === String(id))?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : t('admin.specialists.noServicesAssigned') || 'Нет назначенных услуг';
  };

  if (specialists.length === 0) {
    return (
      <div className="admin-specialists-list">
        <div className="admin-specialists-list__header">
          <h2>{t('admin.specialists.title')}</h2>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={openAddModal}>
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
      <div className="admin-specialists-list__header">
        <h2>
          {t('admin.specialists.title')} ({specialists.length})
        </h2>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={openAddModal}>
          {t('admin.specialists.add')}
        </Button>
      </div>

      <div className="admin-specialists-list__table-wrapper">
        <table className="admin-specialists-list__table">
          <thead>
            <tr>
              <th>{t('admin.specialists.columns.fullName')}</th>
              <th>{t('admin.specialists.columns.position')}</th>
              <th>{t('admin.specialists.columns.experience')}</th>
              <th>{t('admin.specialists.columns.rating')}</th>
              <th>{t('admin.specialists.columns.servicesCount')}</th>
              <th>{t('admin.specialists.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {specialists.map((specialist) => {
              const isEditable = canEdit(specialist);
              const isDeletable = canDelete(specialist);
              const serviceCount = getServiceCount(specialist);
              const serviceNamesTooltip = getServiceNamesString(specialist);

              return (
                <tr key={specialist.id}>
                  <td className="admin-specialists-list__name">
                    {specialist.fullName}
                  </td>
                  <td>{specialist.position}</td>
                  <td>
                    {t('catalog.specialist.experience', {
                      years: specialist.experience,
                    })}
                  </td>
                  <td>
                    <span className="admin-specialists-list__rating">
                      ⭐ {specialist.rating}
                    </span>
                  </td>
                  <td>
                    <div
                      className="admin-specialists-list__services-cell"
                      title={serviceNamesTooltip}
                    >
                      <Badge variant="default" size="sm">
                        {serviceCount}
                      </Badge>
                    </div>
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
                        disabled={!isDeletable}
                        title={
                          isDeletable
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