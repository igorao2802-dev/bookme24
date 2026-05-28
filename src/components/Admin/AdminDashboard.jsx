/**
 * AdminDashboard.jsx — Вкладка №3: Панель менеджера-администратора
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Это "дирижёр" всей админ-панели. Владеет состоянием фильтров, сортировки
 * и поиска. Координирует работу статистики, таблицы и модалки редактирования.
 *
 * ПОЧЕМУ именно здесь живут фильтры?
 * Замечание В.В. из лекции React-1-2: "App.js — начальник, хранит State.
 * Компоненты-сотрудники просто рисуют то, что приказали через props."
 * AdminFilterPanel — это "сотрудник", он не принимает решений,
 * он только сообщает о выборе через callback.
 *
 * ПРИНЦИП ОДНОНАПРАВЛЕННОГО ПОТОКА:
 * Данные (bookings, services, specialists) → вниз через props
 * События (изменение фильтра, редактирование) → вверх через callbacks
 */

import { useState, useMemo } from 'react';

// === КОМПОНЕНТЫ АДМИНКИ ===
import AdminStats from './AdminStats';
import AdminFilterPanel from './AdminFilterPanel';
import AdminBookingsTable from './AdminBookingsTable';
import BookingEditModal from './BookingEditModal';

// === UI ===
import EmptyState from '../UI/EmptyState';
import Toast from '../UI/Toast';

// === КОНСТАНТЫ ===
import { BOOKING_STATUS } from '../../utils/constants';

import './AdminDashboard.css';

// === НАЧАЛЬНЫЕ ФИЛЬТРЫ ===
// ПОЧЕМУ вынесено в константу? Используется в 2 местах: инициализация и сброс
const INITIAL_FILTERS = {
  status: 'all',           // all | pending | confirmed | in-progress | completed | cancelled
  specialistId: 'all',     // 'all' или ID мастера
  dateFrom: '',            // ISO-строка
  dateTo: '',              // ISO-строка
  searchQuery: '',         // поиск по ФИО клиента или телефону
};

export default function AdminDashboard({
  bookings,
  services,
  specialists,
  stats,
  onUpdateBooking,
  onCancelBooking,
}) {
  // === СОСТОЯНИЕ ФИЛЬТРОВ ===
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  // === СОСТОЯНИЕ СОРТИРОВКИ ===
  const [sortBy, setSortBy] = useState('date-desc'); // date-asc | date-desc | service | specialist | client

  // === СОСТОЯНИЕ МОДАЛКИ РЕДАКТИРОВАНИЯ ===
  const [editingBooking, setEditingBooking] = useState(null);

  // === ОБНОВЛЕНИЕ ФИЛЬТРА ===
  // ПОЧЕМУ функциональное обновление prev => ({...prev, ...})?
  // Защита от гонок состояния при быстрых изменениях нескольких фильтров
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  // === СБРОС ФИЛЬТРОВ ===
  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSortBy('date-desc');
  };

  // === 🔥 ФИЛЬТРАЦИЯ И СОРТИРОВКА (useMemo для оптимизации) ===
  // ПОЧЕМУ useMemo?
  // Замечание В.В. из ПР-04: "Сначала filter, потом sort — для оптимизации.
  // Сортируем меньший массив, а не все записи."
  const filteredAndSortedBookings = useMemo(() => {
    // === ШАГ 1: ФИЛЬТРАЦИЯ ===
    let result = bookings.filter((booking) => {
      // Фильтр по статусу
      const matchesStatus =
        filters.status === 'all' || booking.status === filters.status;

      // Фильтр по мастеру
      const matchesSpecialist =
        filters.specialistId === 'all' ||
        booking.specialistId === filters.specialistId;

      // Фильтр по диапазону дат
      const matchesDateFrom =
        !filters.dateFrom || booking.date >= filters.dateFrom;
      const matchesDateTo =
        !filters.dateTo || booking.date <= filters.dateTo;

      // Поиск по ФИО клиента или телефону
      const query = filters.searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        booking.clientName.toLowerCase().includes(query) ||
        booking.clientPhone.replace(/\D/g, '').includes(query.replace(/\D/g, ''));

      return (
        matchesStatus &&
        matchesSpecialist &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesSearch
      );
    });

    // === ШАГ 2: СОРТИРОВКА ===
    // ПОЧЕМУ [...result]? sort() мутирует массив, создаём копию для иммутабельности
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return (
            new Date(`${a.date}T${a.startTime}`) -
            new Date(`${b.date}T${b.startTime}`)
          );
        case 'date-desc':
          return (
            new Date(`${b.date}T${b.startTime}`) -
            new Date(`${a.date}T${a.startTime}`)
          );
        case 'service': {
          const serviceA = services.find((s) => s.id === a.serviceId)?.name || '';
          const serviceB = services.find((s) => s.id === b.serviceId)?.name || '';
          return serviceA.localeCompare(serviceB, 'ru');
        }
        case 'specialist': {
          const specA = specialists.find((s) => s.id === a.specialistId)?.fullName || '';
          const specB = specialists.find((s) => s.id === b.specialistId)?.fullName || '';
          return specA.localeCompare(specB, 'ru');
        }
        case 'client':
          return a.clientName.localeCompare(b.clientName, 'ru');
        default:
          return 0;
      }
    });

    return result;
  }, [bookings, filters, sortBy, services, specialists]);

  // === ОТКРЫТИЕ МОДАЛКИ РЕДАКТИРОВАНИЯ ===
  const handleOpenEdit = (booking) => {
    setEditingBooking(booking);
  };

  // === ЗАКРЫТИЕ МОДАЛКИ ===
  const handleCloseEdit = () => {
    setEditingBooking(null);
  };

  // === СОХРАНЕНИЕ ИЗМЕНЕНИЙ ===
  const handleSaveEdit = (id, updates) => {
    const result = onUpdateBooking(id, updates);

    if (result.success) {
      Toast.success('Запись успешно обновлена');
      handleCloseEdit();
    } else {
      // ПОЧЕМУ именно result.error? useBookings возвращает понятное сообщение
      Toast.error(result.error || 'Не удалось обновить запись');
    }
  };

  // === ОТМЕНА ЗАПИСИ (с подтверждением) ===
  const handleCancel = (id) => {
    // ПОЧЕМУ window.confirm? Простой способ получить подтверждение без модалки
    const confirmed = window.confirm(
      'Вы уверены, что хотите отменить эту запись?\n\n' +
        'Запись будет перемещена в архив со статусом «Отменена».'
    );

    if (!confirmed) return;

    const result = onCancelBooking(id);

    if (result.success) {
      Toast.success('Запись отменена');
    } else {
      Toast.error(result.error || 'Не удалось отменить запись');
    }
  };

  // === ПОДСЧЁТ АКТИВНЫХ ФИЛЬТРОВ ===
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'status' || key === 'specialistId') return value !== 'all';
    if (key === 'searchQuery') return value.trim() !== '';
    return value !== '';
  }).length;

  return (
    <div className="admin-dashboard">
      {/* === ЗАГОЛОВОК === */}
      <div className="admin-dashboard__header">
        <h1>👨‍💼 Панель менеджера</h1>
        <p className="admin-dashboard__subtitle">
          Управление записями, статистика и контроль салона
        </p>
      </div>

      {/* === СТАТИСТИКА === */}
      <AdminStats stats={stats} bookings={bookings} />

      {/* === ФИЛЬТРЫ === */}
      <AdminFilterPanel
        filters={filters}
        sortBy={sortBy}
        specialists={specialists}
        onFilterChange={handleFilterChange}
        onSortChange={setSortBy}
        onReset={handleResetFilters}
        activeCount={activeFiltersCount}
      />

      {/* === ТАБЛИЦА ЗАПИСЕЙ === */}
      <section className="admin-dashboard__section">
        <div className="admin-dashboard__section-header">
          <h2>
            Записи ({filteredAndSortedBookings.length} из {bookings.length})
          </h2>
          {activeFiltersCount > 0 && (
            <span className="admin-dashboard__filter-badge">
              Фильтров: {activeFiltersCount}
            </span>
          )}
        </div>

        {filteredAndSortedBookings.length === 0 ? (
          <EmptyState
            title={
              bookings.length === 0
                ? 'Записей пока нет'
                : 'Записи не найдены'
            }
            description={
              bookings.length === 0
                ? 'Создайте первую запись на вкладке «Запись»'
                : 'Попробуйте изменить параметры фильтрации'
            }
            actionLabel={bookings.length > 0 ? 'Сбросить фильтры' : null}
            onAction={bookings.length > 0 ? handleResetFilters : null}
            variant="info"
          />
        ) : (
          <AdminBookingsTable
            bookings={filteredAndSortedBookings}
            services={services}
            specialists={specialists}
            onEdit={handleOpenEdit}
            onCancel={handleCancel}
          />
        )}
      </section>

      {/* === МОДАЛКА РЕДАКТИРОВАНИЯ === */}
      <BookingEditModal
        booking={editingBooking}
        services={services}
        specialists={specialists}
        bookings={bookings}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
      />
    </div>
  );
}