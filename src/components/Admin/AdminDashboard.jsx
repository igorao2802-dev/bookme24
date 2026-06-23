/**
 * AdminDashboard.jsx — главная панель администратора
 *
 * 🔥 ИСПРАВЛЕНО: Корректная передача всех пропсов и имён функций
 */
import { useState, useCallback } from 'react';
import { Calendar, Scissors, Users } from 'lucide-react';
import AdminStats from './AdminStats';
import AdminFilterPanel from './AdminFilterPanel';
import AdminBookingsTable from './AdminBookingsTable';
import AdminServicesList from './AdminServicesList';
import AdminSpecialistsList from './AdminSpecialistsList';
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

  const handleDeleteService = useCallback(
    (serviceId) => {
      onDeleteService(serviceId);
    },
    [onDeleteService],
  );

  const handleDeleteSpecialist = useCallback(
    (specialistId) => {
      onDeleteSpecialist(specialistId);
    },
    [onDeleteSpecialist],
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

        {activeTab === 'services' && (
          <AdminServicesList
            services={services}
            specialists={specialists}
            onAdd={onAddService}
            onUpdate={onUpdateService}
            onDelete={handleDeleteService}
          />
        )}

        {activeTab === 'specialists' && (
          <AdminSpecialistsList
            specialists={specialists}
            services={services}
            onAdd={onAddSpecialist}
            onUpdate={onUpdateSpecialist}
            onDelete={handleDeleteSpecialist}
          />
        )}
      </div>
    </div>
  );
}