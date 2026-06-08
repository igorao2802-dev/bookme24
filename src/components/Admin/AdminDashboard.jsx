/**
 * AdminDashboard.jsx — главная панель администратора
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Дирижёр админки. Содержит:
 * - Блок статистики (AdminStats) — всегда виден
 * - Систему табов для переключения между разделами:
 *   * "Записи" — фильтрация и управление записями
 *   * "Услуги" — CRUD каталога услуг
 *   * "Специалисты" — CRUD списка мастеров
 * 
 * 🔥 ЭТАП 6.3: Интеграция CRUD для услуг и специалистов
 * 🔥 ЭТАП 7.6: Локализация табов через t()
 * 
 * ПОЧЕМУ табы, а не отдельные страницы?
 * - Админ должен быстро переключаться между разделами
 * - Нет необходимости в дополнительных роутах
 * - Все данные уже загружены в App.jsx
 */

import { useState } from 'react';
import { Calendar, Scissors, Users } from 'lucide-react';

import AdminStats from './AdminStats';
import AdminFilterPanel from './AdminFilterPanel';
import AdminBookingsTable from './AdminBookingsTable';
import AdminServicesList from './AdminServicesList';
import AdminSpecialistsList from './AdminSpecialistsList';

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
  // 🔥 ЭТАП 6.3: CRUD услуг
  onAddService,
  onUpdateService,
  onDeleteService,
  // 🔥 ЭТАП 6.3: CRUD специалистов
  onAddSpecialist,
  onUpdateSpecialist,
  onDeleteSpecialist,
}) {
  const { t } = useLanguage(); // 🔥 ЭТАП 7.6

  // === АКТИВНЫЙ ТАБ ===
  const [activeTab, setActiveTab] = useState('bookings');

  // === СОСТОЯНИЕ ФИЛЬТРОВ (для раздела "Записи") ===
  const [filters, setFilters] = useState({
    searchQuery: '',
    status: 'all',
    specialistId: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [sortBy, setSortBy] = useState('date-desc');

  // === 🔥 КОНФИГУРАЦИЯ ТАБОВ (ЭТАП 7.6: локализация) ===
  // ПОЧЕМУ вычисляется внутри компонента, а не как константа?
  // - label зависит от t(), которая вызывается через useLanguage()
  // - Константа не может использовать хуки React
  // - Вычисление происходит при каждом рендере, что нормально (быстрая операция)
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
  // ПОЧЕМУ здесь, а не в AdminBookingsTable?
  // - AdminDashboard владеет состоянием фильтров
  // - AdminBookingsTable — презентационный, только отображает данные
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

  return (
    <div className="admin-dashboard">
      {/* === СТАТИСТИКА (ВСЕГДА ВИДНА) === */}
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
            onAdd={onAddService}
            onUpdate={onUpdateService}
            onDelete={onDeleteService}
          />
        )}

        {/* --- ТАБ: СПЕЦИАЛИСТЫ --- */}
        {activeTab === 'specialists' && (
          <AdminSpecialistsList
            specialists={specialists}
            services={services}
            onAdd={onAddSpecialist}
            onUpdate={onUpdateSpecialist}
            onDelete={onDeleteSpecialist}
          />
        )}
      </div>
    </div>
  );
}