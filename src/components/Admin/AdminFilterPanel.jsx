/**
 * AdminFilterPanel.jsx — панель фильтров и сортировки для администратора
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Презентационный компонент. НЕ владеет состоянием фильтров.
 * Сообщает об изменениях родителю через onFilterChange и onSortChange.
 * 
 *  ЭТАП 1.4: Валидация дат (запрет нелогичных периодов)
 * 🔥 ЭТАП 3.2: Разделение на три секции: Поиск, Сортировка, Фильтры
 * 🔥 ЭТАП 3.4: Явный заголовок "Сортировка" над полем
 * 🔥 ЭТАП 3.5: Лейблы для всех полей фильтров (Статус, Специалист, С, По)
 */

import { Filter, RotateCcw, Search, ArrowUpDown } from 'lucide-react';

import Input from '../UI/Input';
import Select from '../UI/Select';
import Badge from '../UI/Badge';
import Toast from '../UI/Toast';

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

  // === 🔥 ОБРАБОТЧИК ИЗМЕНЕНИЯ ДАТЫ "ОТ" (ЭТАП 1.4) ===
  const handleDateFromChange = (e) => {
    const newDateFrom = e.target.value;
    
    if (filters.dateTo && newDateFrom > filters.dateTo) {
      onFilterChange('dateTo', '');
      Toast.info('Дата окончания сброшена, так как она раньше даты начала', {
        duration: 3000,
      });
    }
    
    onFilterChange('dateFrom', newDateFrom);
  };

  // === 🔥 ОБРАБОТЧИК ИЗМЕНЕНИЯ ДАТЫ "ДО" (ЭТАП 1.4) ===
  const handleDateToChange = (e) => {
    const newDateTo = e.target.value;
    
    if (filters.dateFrom && newDateTo < filters.dateFrom) {
      onFilterChange('dateFrom', '');
      Toast.info('Дата начала сброшена, так как она позже даты окончания', {
        duration: 3000,
      });
    }
    
    onFilterChange('dateTo', newDateTo);
  };

  return (
    <div className="admin-filter-panel">
      {/* === ЗАГОЛОВОК ПАНЕЛИ === */}
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

      {/* === 🔥 СЕКЦИЯ 1: ПОИСК (ЭТАП 3.2) === */}
      <div className="admin-filter-panel__section admin-filter-panel__section--search">
        <h4 className="admin-filter-panel__section-title">
          <Search size={16} />
          Поиск
        </h4>
        <Input
          placeholder="Поиск по ФИО или телефону клиента..."
          value={filters.searchQuery}
          onChange={(e) => onFilterChange('searchQuery', e.target.value)}
          leftIcon={<Search size={18} />}
        />
      </div>

      {/* === 🔥 СЕКЦИЯ 2: СОРТИРОВКА (ЭТАП 3.2 + 3.4) === */}
      {/* 
        ПОЧЕМУ заголовок "Сортировка" здесь, а не внутри Select?
        - Заголовок секции описывает НАЗНАЧЕНИЕ всей секции
        - Лейбл внутри Select описывает КОНКРЕТНОЕ поле
        - Это разные уровни иерархии информации
      */}
      <div className="admin-filter-panel__section admin-filter-panel__section--sort">
        <h4 className="admin-filter-panel__section-title">
          <ArrowUpDown size={16} />
          Сортировка
        </h4>
        <Select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          options={sortOptions}
        />
      </div>

      {/* === 🔥 СЕКЦИЯ 3: ФИЛЬТРЫ (ЭТАП 3.2 + 3.5) === */}
      <div className="admin-filter-panel__section admin-filter-panel__section--filters">
        <h4 className="admin-filter-panel__section-title">
          <Filter size={16} />
          Фильтры
        </h4>
        
        <div className="admin-filter-panel__filters-grid">
          {/* 
            🔥 ЭТАП 3.5: Каждое поле имеет явный label
            ПОЧЕМУ label передаётся через prop, а не пишется вручную?
            - Компоненты Input и Select сами рендерят <label htmlFor="...">
            - Это гарантирует связь label ↔ input через id (A11y)
            - Скринридеры правильно озвучивают назначение поля
          */}
          
          {/* Статус */}
          <Select
            label="Статус"
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            options={statusOptions}
          />

          {/* Специалист */}
          <Select
            label="Специалист"
            value={filters.specialistId}
            onChange={(e) => onFilterChange('specialistId', e.target.value)}
            options={specialistOptions}
          />

          {/* Дата от */}
          <Input
            type="date"
            label="С (дата начала)"
            value={filters.dateFrom}
            onChange={handleDateFromChange}
            max={filters.dateTo || undefined}
            helperText={
              filters.dateTo
                ? `Не позже ${new Date(filters.dateTo).toLocaleDateString('ru-RU')}`
                : 'Выберите начальную дату периода'
            }
            title="Выберите начальную дату периода фильтрации"
          />

          {/* Дата до */}
          <Input
            type="date"
            label="По (дата окончания)"
            value={filters.dateTo}
            onChange={handleDateToChange}
            min={filters.dateFrom || undefined}
            helperText={
              filters.dateFrom
                ? `Не раньше ${new Date(filters.dateFrom).toLocaleDateString('ru-RU')}`
                : 'Выберите конечную дату периода'
            }
            title="Выберите конечную дату периода фильтрации"
          />
        </div>
      </div>
    </div>
  );
}