/**
 * AdminDashboard.jsx — главная панель администратора
 * 
 * 🔥 ИСПРАВЛЕНО:
 * - Устранены все опечатки (onUpdateBooking, onDeleteService, setSortBy и др.)
 * - Добавлены toast-уведомления при сохранении/удалении
 * - Корректная обработка ошибок валидации
 * - Модалка не закрывается при ошибке
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
import BookingEditModal from './BookingEditModal';
import Toast from '../UI/Toast';
import { useLanguage } from '../../hooks/useLanguage';
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
  const { t } = useLanguage();

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

  // === СОСТОЯНИЕ МОДАЛКИ РЕДАКТИРОВАНИЯ ЗАПИСИ ===
  const [editBookingModal, setEditBookingModal] = useState({
    isOpen: false,
    booking: null,
  });

  // === КОНФИГУРАЦИЯ ТАБОВ ===
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

  // === 🔥 ИСПРАВЛЕНО: ОБРАБОТЧИКИ МОДАЛКИ УСЛУГ С TOAST ===
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
        
        if (result?.success) {
          Toast.success(t('admin.services.addSuccess', { name: serviceData.name }), { duration: 3000 });
          handleCloseServiceModal();
        } else {
          // 🔥 Показываем ошибку и НЕ закрываем модалку
          const errorMessage = result?.error ? t(result.error) : t('common.error');
          Toast.error(errorMessage, { duration: 5000 });
        }
      } else {
        result = onUpdateService(serviceModal.service.id, serviceData);
        
        if (result?.success) {
          Toast.success(t('admin.services.updateSuccess', { name: serviceData.name }), { duration: 3000 });
          handleCloseServiceModal();
        } else {
          //  Показываем ошибку и НЕ закрываем модалку
          const errorMessage = result?.error ? t(result.error) : t('common.error');
          Toast.error(errorMessage, { duration: 5000 });
        }
      }
      
      return result;
    },
    [serviceModal, onAddService, onUpdateService, handleCloseServiceModal, t]
  );

  const handleDeleteService = useCallback(
    (serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      const result = onDeleteService(serviceId);
      
      if (result?.success && service) {
        Toast.success(t('admin.services.deleteSuccess', { name: service.name }), { duration: 3000 });
      } else {
        const errorMessage = result?.error ? t(result.error) : t('common.error');
        Toast.error(errorMessage, { duration: 5000 });
      }
    },
    [onDeleteService, services, t]
  );

  // === 🔥 ИСПРАВЛЕНО: ОБРАБОТЧИКИ МОДАЛКИ СПЕЦИАЛИСТОВ С TOAST ===
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
        
        if (result?.success) {
          Toast.success(t('admin.specialists.addSuccess', { name: specialistData.fullName }), { duration: 3000 });
          handleCloseSpecialistModal();
        } else {
          // 🔥 Показываем ошибку и НЕ закрываем модалку
          const errorMessage = result?.error ? t(result.error) : t('common.error');
          Toast.error(errorMessage, { duration: 5000 });
        }
      } else {
        result = onUpdateSpecialist(specialistModal.specialist.id, specialistData);
        
        if (result?.success) {
          Toast.success(t('admin.specialists.updateSuccess', { name: specialistData.fullName }), { duration: 3000 });
          handleCloseSpecialistModal();
        } else {
          //  Показываем ошибку и НЕ закрываем модалку
          const errorMessage = result?.error ? t(result.error) : t('common.error');
          Toast.error(errorMessage, { duration: 5000 });
        }
      }
      
      return result;
    },
    [specialistModal, onAddSpecialist, onUpdateSpecialist, handleCloseSpecialistModal, t]
  );

  const handleDeleteSpecialist = useCallback(
    (specialistId) => {
      const specialist = specialists.find((s) => s.id === specialistId);
      const result = onDeleteSpecialist(specialistId);
      
      if (result?.success && specialist) {
        Toast.success(t('admin.specialists.deleteSuccess', { name: specialist.fullName }), { duration: 3000 });
      } else {
        const errorMessage = result?.error ? t(result.error) : t('common.error');
        Toast.error(errorMessage, { duration: 5000 });
      }
    },
    [onDeleteSpecialist, specialists, t]
  );

  // === ОБРАБОТЧИКИ РЕДАКТИРОВАНИЯ ЗАПИСЕЙ ===
  const handleEditBooking = useCallback((booking) => {
    setEditBookingModal({ isOpen: true, booking });
  }, []);

  const handleCloseEditBookingModal = useCallback(() => {
    setEditBookingModal({ isOpen: false, booking: null });
  }, []);

  const handleSaveBooking = useCallback(
    (bookingId, updates) => {
      const result = onUpdateBooking(bookingId, updates);
      
      if (result?.success) {
        Toast.success(t('admin.bookings.editSuccess') || 'Запись обновлена', { duration: 3000 });
        handleCloseEditBookingModal();
      } else {
        const errorMessage = result?.error ? t(result.error) : t('common.error');
        Toast.error(errorMessage, { duration: 5000 });
      }
      
      return result;
    },
    [onUpdateBooking, handleCloseEditBookingModal, t]
  );

  const handleCancelBooking = useCallback(
    (bookingId) => {
      const confirmed = window.confirm(t('admin.bookings.confirmCancel'));
      if (confirmed) {
        const result = onCancelBooking(bookingId);
        
        if (result?.success) {
          Toast.success(t('admin.bookings.cancelSuccess') || 'Запись отменена', { duration: 3000 });
        } else {
          const errorMessage = result?.error ? t(result.error) : t('common.error');
          Toast.error(errorMessage, { duration: 5000 });
        }
      }
    },
    [onCancelBooking, t]
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
              onEdit={handleEditBooking}
              onCancel={handleCancelBooking}
            />
          </>
        )}

        {/* --- ТАБ: УСЛУГИ --- */}
        {activeTab === 'services' && (
          <AdminServicesList
            services={services}
            specialists={specialists}
            onAdd={handleOpenAddService}
            onUpdate={handleOpenEditService}
            onDelete={handleDeleteService}
          />
        )}

        {/* --- ТАБ: СПЕЦИАЛИСТЫ --- */}
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

      {/* === МОДАЛКА УСЛУГ === */}
      <ServiceModal
        isOpen={serviceModal.isOpen}
        mode={serviceModal.mode}
        service={serviceModal.service}
        specialists={specialists}
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

      {/* === МОДАЛКА РЕДАКТИРОВАНИЯ ЗАПИСИ === */}
      <BookingEditModal
        booking={editBookingModal.booking}
        services={services}
        specialists={specialists}
        bookings={bookings}
        isOpen={editBookingModal.isOpen}
        onClose={handleCloseEditBookingModal}
        onSave={handleSaveBooking}
      />
    </div>
  );
}