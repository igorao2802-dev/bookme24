/**
 * AdminDashboard.jsx — главная панель администратора
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Дирижёр админ-панели. Управляет:
 * - Переключением табов (Записи/Услуги/Специалисты)
 * - Состоянием фильтров и сортировки
 * - Открытием/закрытием модалок
 * 
 * 🔥 ИСПРАВЛЕНО: handleAddService → handleOpenAddService
 * 🔥 ИСПРАВЛЕНО: handleUpdateService → handleOpenEditService
 * 🔥 ИСПРАВЛЕНО: Все опечатки (se tSortBy, onCa ncelBooking)
 */
import { useState, useCallback } from 'react';
import { Calendar, Scissors, Users } from 'lucide-react';
import AdminStats from './AdminStats';
import AdminFilterPanel from './AdminFilterPanel';
import AdminBookingsTable from './AdminBookingsTable';
import AdminServicesList from './AdminServicesList';
import AdminSpecialistsList from './AdminSpecialistsList';
import ServiceModal from './ServiceModal';
import SpecialistModal from './SpecialistModal';
import { useLanguage } from '../../hooks/useLanguage';
import './AdminDashboard.css';

export default function AdminDashboard({
  bookings,
  services,
  specialists,
  stats,
  onUpdateBooking,
  onCancelBooking,
  onAddService,
  onUpdateService,
  onDeleteService,
  onAddSpecialist,
  onUpdateSpecialist,
  onDeleteSpecialist,
}) {
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('bookings');
  const [filters, setFilters] = useState({
    searchQuery: '',
    status: 'all',
    specialistId: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [sortBy, setSortBy] = useState('date-desc');

  const [serviceModal, setServiceModal] = useState({
    isOpen: false,
    mode: 'add',
    service: null,
  });
  const [specialistModal, setSpecialistModal] = useState({
    isOpen: false,
    mode: 'add',
    specialist: null,
  });

  const ADMIN_TABS = [
    { id: 'bookings', label: t('admin.tabs.bookings'), icon: Calendar },
    { id: 'services', label: t('admin.tabs.services'), icon: Scissors },
    { id: 'specialists', label: t('admin.tabs.specialists'), icon: Users },
  ];

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      status: 'all',
      specialistId: 'all',
      dateFrom: '',
      dateTo: '',
    });
    setSortBy('date-desc');
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      !filters.searchQuery ||
      b.clientName?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      b.clientPhone?.includes(filters.searchQuery);
    const matchesStatus = filters.status === 'all' || b.status === filters.status;
    const matchesSpecialist =
      filters.specialistId === 'all' || b.specialistId === filters.specialistId;
    const matchesDateFrom = !filters.dateFrom || b.date >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || b.date <= filters.dateTo;
    return matchesSearch && matchesStatus && matchesSpecialist && matchesDateFrom && matchesDateTo;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        return new Date(a.date) - new Date(b.date);
      case 'date-desc':
      default:
        return new Date(b.date) - new Date(a.date);
      case 'service':
        return (a.serviceId || '').localeCompare(b.serviceId || '');
      case 'specialist':
        return (a.specialistId || '').localeCompare(b.specialistId || '');
      case 'client':
        return (a.clientName || '').localeCompare(b.clientName || '');
    }
  });

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'status' || key === 'specialistId') return value !== 'all';
    return value !== '' && value !== null && value !== undefined;
  }).length;

  //  ИСПРАВЛЕНО: Правильные имена функций
  const handleOpenAddService = useCallback(() => {
    setServiceModal({ isOpen: true, mode: 'add', service: null });
  }, []);

  const handleOpenEditService = useCallback((service) => {
    setServiceModal({ isOpen: true, mode: 'edit', service });
  }, []);

  const handleCloseServiceModal = useCallback(() => {
    setServiceModal({ isOpen: false, mode: 'add', service: null });
  }, []);

  const handleSaveService = useCallback(
    (serviceData) => {
      let result;
      if (serviceModal.mode === 'add') {
        result = onAddService(serviceData);
      } else {
        result = onUpdateService(serviceModal.service.id, serviceData);
      }
      if (result?.success) {
        handleCloseServiceModal();
      }
    },
    [serviceModal, onAddService, onUpdateService, handleCloseServiceModal]
  );

  const handleDeleteService = useCallback(
    (serviceId) => {
      onDeleteService(serviceId);
    },
    [onDeleteService]
  );

  const handleOpenAddSpecialist = useCallback(() => {
    setSpecialistModal({ isOpen: true, mode: 'add', specialist: null });
  }, []);

  const handleOpenEditSpecialist = useCallback((specialist) => {
    setSpecialistModal({ isOpen: true, mode: 'edit', specialist });
  }, []);

  const handleCloseSpecialistModal = useCallback(() => {
    setSpecialistModal({ isOpen: false, mode: 'add', specialist: null });
  }, []);

  const handleSaveSpecialist = useCallback(
    (specialistData) => {
      let result;
      if (specialistModal.mode === 'add') {
        result = onAddSpecialist(specialistData);
      } else {
        result = onUpdateSpecialist(specialistModal.specialist.id, specialistData);
      }
      if (result?.success) {
        handleCloseSpecialistModal();
      }
    },
    [specialistModal, onAddSpecialist, onUpdateSpecialist, handleCloseSpecialistModal]
  );

  const handleDeleteSpecialist = useCallback(
    (specialistId) => {
      onDeleteSpecialist(specialistId);
    },
    [onDeleteSpecialist]
  );

  return (
    <div className="admin-dashboard">
      <AdminStats stats={stats} bookings={bookings} />

      <div className="admin-dashboard__tabs">
        {ADMIN_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`admin-dashboard__tab ${
              activeTab === id ? 'admin-dashboard__tab--active' : ''
            }`}
            onClick={() => setActiveTab(id)}
            aria-pressed={activeTab === id}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="admin-dashboard__content">
        {activeTab === 'bookings' && (
          <>
            <AdminFilterPanel
              filters={filters}
              sortBy={sortBy}
              specialists={specialists}
              onFilterChange={handleFilterChange}
              onSortChange={setSortBy}
              onReset={handleResetFilters}
              activeCount={activeFiltersCount}
            />
            <AdminBookingsTable
              bookings={sortedBookings}
              services={services}
              specialists={specialists}
              onUpdateBooking={onUpdateBooking}
              onCancelBooking={onCancelBooking}
            />
          </>
        )}

        {/* 🔥 ИСПРАВЛЕНО: Правильные имена функций */}
        {activeTab === 'services' && (
          <AdminServicesList
            services={services}
            specialists={specialists}
            onAdd={handleOpenAddService}
            onUpdate={handleOpenEditService}
            onDelete={handleDeleteService}
          />
        )}

        {activeTab === 'specialists' && (
          <AdminSpecialistsList
            specialists={specialists}
            services={services}
            onAdd={handleOpenAddSpecialist}
            onUpdate={handleOpenEditSpecialist}
            onDelete={handleDeleteSpecialist}
          />
        )}
      </div>

      {/* 🔥 МОДАЛКА УСЛУГ — использует ServiceModal → ServiceForm */}
      <ServiceModal
        isOpen={serviceModal.isOpen}
        mode={serviceModal.mode}
        service={serviceModal.service}
        specialists={specialists}
        existingServices={services}
        onSave={handleSaveService}
        onClose={handleCloseServiceModal}
      />

      {/* 🔥 МОДАЛКА СПЕЦИАЛИСТОВ — использует SpecialistModal → SpecialistForm */}
      <SpecialistModal
        isOpen={specialistModal.isOpen}
        mode={specialistModal.mode}
        specialist={specialistModal.specialist}
        services={services}
        existingSpecialists={specialists}
        onSave={handleSaveSpecialist}
        onClose={handleCloseSpecialistModal}
      />
    </div>
  );
}