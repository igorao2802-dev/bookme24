/**
 * AdminFilterPanel.jsx — панель фильтров и сортировки для администратора
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Презентационный компонент. НЕ владеет состоянием фильтров.
 * Сообщает об изменениях родителю через onFilterChange и onSortChange.
 */

import { Filter, RotateCcw, Search, SortAsc } from 'lucide-react';

import Input from '../UI/Input';
import Select from '../UI/Select';
import Badge from '../UI/Badge';

import { BOOKING_STATUS, BOOKING_STATUS_LABELS } from '../../utils/constants';

import './AdminFilterPanel.css';

export default function AdminFilterPanel({
  filters,
  sortBy,
  specialists,
  onFilterChange,
  onSortChange,
  onReset,
  activeCount = 0,
}) {
  // === ОПЦИИ СТАТУСОВ ===
  const statusOptions = [
    { value: 'all', label: 'Все статусы' },
    ...Object.values(BOOKING_STATUS).map((status) => ({
      value: status,
      label: BOOKING_STATUS_LABELS[status],
    })),
  ];

  // === ОПЦИИ МАСТЕРОВ ===
  const specialistOptions = [
    { value: 'all', label: 'Все мастера' },
    ...specialists.map((spec) => ({
      value: spec.id,
      label: spec.fullName,
    })),
  ];

  // === ОПЦИИ СОРТИРОВКИ ===
  const sortOptions = [
    { value: 'date-desc', label: 'Дата (новые → старые)' },
    { value: 'date-asc', label: 'Дата (старые → новые)' },
    { value: 'service', label: 'По услуге' },
    { value: 'specialist', label: 'По мастеру' },
    { value: 'client', label: 'По клиенту' },
  ];

  return (
    <div className="admin-filter-panel">
      <div className="admin-filter-panel__header">
        <h3 className="admin-filter-panel__title">
          <Filter size={18} />
          Фильтры и поиск
          {activeCount > 0 && (
            <Badge variant="warning" size="sm">{activeCount}</Badge>
          )}
        </h3>

        {activeCount > 0 && (
          <button
            type="button"
            className="admin-filter-panel__reset"
            onClick={onReset}
          >
            <RotateCcw size={14} />
            Сбросить
          </button>
        )}
      </div>

      <div className="admin-filter-panel__grid">
        {/* === ПОИСК === */}
        <div className="admin-filter-panel__field admin-filter-panel__field--search">
          <Input
            placeholder="Поиск по ФИО или телефону клиента..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>

        {/* === СТАТУС === */}
        <Select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          options={statusOptions}
        />

        {/* === МАСТЕР === */}
        <Select
          value={filters.specialistId}
          onChange={(e) => onFilterChange('specialistId', e.target.value)}
          options={specialistOptions}
        />

        {/* === ДАТА ОТ === */}
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onFilterChange('dateFrom', e.target.value)}
          placeholder="Дата от"
        />

        {/* === ДАТА ДО === */}
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => onFilterChange('dateTo', e.target.value)}
          placeholder="Дата до"
        />

        {/* === СОРТИРОВКА === */}
        <Select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          options={sortOptions}
        />
      </div>
    </div>
  );
}