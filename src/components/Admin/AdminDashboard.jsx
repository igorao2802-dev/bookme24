/**
 * AdminDashboard.jsx — главная панель администратора
 * 
 * 🔥 ЭТАП 6.3: Интеграция CRUD для услуг и специалистов
 * 🔥 ЭТАП 7.6: Локализация табов через t()
 * 🔥 ЭТАП 8.8: Полная интеграция модалок и таблиц
 * 🔥 ИСПРАВЛЕНО: Опечатки (se tSortBy, onCa ncelBooking, onDelete Specialist)
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

import { useLanguage } from '../../hooks/useLanguage'; // 🔥 ЭТАП 7.6

import './AdminDashboard.css';

export default function AdminDashboard({
  // Данные
  bookings,
  services,
  specialists,
  stats,
  // CRUD записей
  onUpdateBooking,
  onCancelBooking,
  // CRUD услуг
  onAddService,
  onUpdateService,
  onDeleteService,
  // CRUD специалистов
  onAddSpecialist,
  onUpdateSpecialist,
  onDeleteSpecialist,
}) {
  const { t } = useLanguage(); // 🔥 ЭТАП 7.6

  // === АКТИВНЫЙ ТАБ ===
  const [activeTab, setActiveTab] = useState('bookings');

  // === СОСТОЯНИЕ ФИЛЬТРОВ ===
  const [filters, setFilters] = useState({
    searchQuery: '',
    status: 'all',
    specialistId: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [sortBy, setSortBy] = useState('date-desc');

  // === СОСТОЯНИЕ МОДАЛОК ===
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

  // === КОНФИГУРАЦИЯ ТАБОВ ===
  // 🔥 ЭТАП 7.6: локализация через t()
  const ADMIN_TABS = [
    { id: 'bookings', label: t('admin.tabs.bookings'), icon: Calendar },
    { id: 'services', label: t('admin.tabs.services'), icon: Scissors },
    { id: 'specialists', label: t('admin.tabs.specialists'), icon: Users },
  ];

  // === ОБРАБОТЧИКИ ФИЛЬТРОВ ===
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

  // === ФИЛЬТРАЦИЯ И СОРТИРОВКА ЗАПИСЕЙ ===
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      !filters.searchQuery ||
      b.clientName?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      b.clientPhone?.includes(filters.searchQuery);

    const matchesStatus =
      filters.status === 'all' || b.status === filters.status;

    const matchesSpecialist =
      filters.specialistId === 'all' ||
      b.specialistId === filters.specialistId;

    const matchesDateFrom = !filters.dateFrom || b.date >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || b.date <= filters.dateTo;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesSpecialist &&
      matchesDateFrom &&
      matchesDateTo
    );
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

  // === ОБРАБОТЧИКИ МОДАЛКИ УСЛУГ ===
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

  // === ОБРАБОТЧИКИ МОДАЛКИ СПЕЦИАЛИСТОВ ===
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

  return (
    <div className="admin-dashboard">
      {/* === СТАТИСТИКА === */}
      <AdminStats stats={stats} bookings={bookings} />

      {/* === СИСТЕМА ТАБОВ === */}
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

      {/* === КОНТЕНТ АКТИВНОГО ТАБА === */}
      <div className="admin-dashboard__content">
        {/* --- ТАБ: ЗАПИСИ --- */}
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

        {/* --- ТАБ: УСЛУГИ --- */}
        {activeTab === 'services' && (
          <AdminServicesList
            services={services}
            onAdd={handleOpenAddService}
            onEdit={handleOpenEditService}
            onDelete={onDeleteService}
          />
        )}

        {/* --- ТАБ: СПЕЦИАЛИСТЫ --- */}
        {activeTab === 'specialists' && (
          <AdminSpecialistsList
            specialists={specialists}
            services={services}
            onAdd={handleOpenAddSpecialist}
            onEdit={handleOpenEditSpecialist}
            onDelete={onDeleteSpecialist}
          />
        )}
      </div>

      {/* === МОДАЛКА УСЛУГ === */}
      <ServiceModal
        isOpen={serviceModal.isOpen}
        mode={serviceModal.mode}
        service={serviceModal.service}
        specialists={specialists} // 🔥 ИСПРАВЛЕНИЕ 1.5: передаём specialists
        existingServices={services}
        onSave={handleSaveService}
        onClose={handleCloseServiceModal}
      />

      {/* === МОДАЛКА СПЕЦИАЛИСТОВ === */}
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