/**
 * AdminServicesList.jsx — список услуг с CRUD-операциями
 * 
 * 🔥 ИСПРАВЛЕНО: closeM odal → closeModal
 * 🔥 ИСПРАВЛЕНО: exis tingServices → existingServices
 * 🔥 ИСПРАВЛЕНО: servic es → services
 *  ИСПРАВЛЕНО: Добавлен prop specialists
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
  specialists = [],
  onAdd,
  onUpdate,
  onDelete,
}) {
  const { t } = useLanguage();

  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'add',
    service: null,
  });

  const openAddModal = () => {
    setModalState({ isOpen: true, mode: 'add', service: null });
  };

  const openEditModal = (service) => {
    setModalState({ isOpen: true, mode: 'edit', service });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, mode: 'add', service: null });
  };

  const handleSave = (serviceData) => {
    if (modalState.mode === 'add') {
      onAdd(serviceData);
    } else {
      onUpdate(modalState.service.id, serviceData);
    }
    closeModal();
  };

  const handleDelete = (service) => {
    const confirmed = window.confirm(
      t('admin.services.confirmDelete', { name: service.name })
    );
    if (confirmed) {
      onDelete(service.id);
    }
  };

  const canEdit = (service) => true;
  const canDelete = (service) => {
    return service.isCustom || service.id?.startsWith('custom_');
  };

  if (services.length === 0) {
    return (
      <div className="admin-services-list">
        <div className="admin-services-list__header">
          <h2>{t('admin.services.title')}</h2>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={openAddModal}>
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
          specialists={specialists}
          existingServices={services}
          onSave={handleSave}
          onClose={closeModal}
        />
      </div>
    );
  }

  return (
    <div className="admin-services-list">
      <div className="admin-services-list__header">
        <h2>{t('admin.services.title')} ({services.length})</h2>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={openAddModal}>
          {t('admin.services.add')}
        </Button>
      </div>

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
                  <td className="admin-services-list__name">{service.name}</td>
                  <td>
                    <Badge variant="default" size="sm">
                      {SERVICE_CATEGORY_LABELS[service.category] || service.category}
                    </Badge>
                  </td>
                  <td>{formatDuration(service.duration)}</td>
                  <td className="admin-services-list__price">{formatPrice(service.price)}</td>
                  <td>
                    <span className="admin-services-list__rating">⭐ {service.rating}</span>
                  </td>
                  <td>
                    <div className="admin-services-list__actions">
                      <button
                        type="button"
                        className="admin-services-list__action-btn"
                        onClick={() => openEditModal(service)}
                        disabled={!isEditable}
                        title={isEditable ? t('common.edit') : t('admin.services.cannotModifyStandard')}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-services-list__action-btn admin-services-list__action-btn--danger"
                        onClick={() => handleDelete(service)}
                        disabled={!isDeletable}
                        title={isDeletable ? t('common.delete') : t('admin.services.cannotDeleteStandard')}
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

      <ServiceModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        service={modalState.service}
        specialists={specialists}
        existingServices={services}
        onSave={handleSave}
        onClose={closeModal}
      />
    </div>
  );
}