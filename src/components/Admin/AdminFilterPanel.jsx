/**
 * AdminFilterPanel.jsx — панель фильтров и сортировки для администратора
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Презентационный компонент. НЕ владеет состоянием фильтров.
 * Сообщает об изменениях родителю через onFilterChange и onSortChange.
 * 
 * 🔥 ЭТАП 1.4: Добавлена валидация дат (запрет нелогичных периодов)
 * - Поле "Дата от" не может быть позже "Дата до"
 * - Поле "Дата до" не может быть раньше "Дата от"
 * - Браузер автоматически блокирует недоступные даты (серым цветом)
 * - Добавлены helperText для пояснения ограничений
 */

import { Filter, RotateCcw, Search } from 'lucide-react';

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
  // ПОЧЕМУ отдельная функция?
  // Проверяем логику: если новая дата "от" позже даты "до",
  // автоматически сбрасываем дату "до". Это предотвращает
  // ситуацию, когда пользователь выбирает некорректный период.
  const handleDateFromChange = (e) => {
    const newDateFrom = e.target.value;
    
    // Если дата "до" уже выбрана и новая дата "от" позже неё —
    // сбрасываем дату "до" и показываем уведомление
    if (filters.dateTo && newDateFrom > filters.dateTo) {
      onFilterChange('dateTo', '');
      Toast.info('Дата окончания сброшена, так как она раньше даты начала', {
        duration: 3000,
      });
    }
    
    onFilterChange('dateFrom', newDateFrom);
  };

  // === 🔥 ОБРАБОТЧИК ИЗМЕНЕНИЯ ДАТЫ "ДО" (ЭТАП 1.4) ===
  // Аналогичная логика для поля "Дата до"
  const handleDateToChange = (e) => {
    const newDateTo = e.target.value;
    
    // Если дата "от" уже выбрана и новая дата "до" раньше неё —
    // сбрасываем дату "от" и показываем уведомление
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

        {/* === 🔥 ДАТА ОТ (с валидацией) === */}
        {/* 
          ПОЧЕМУ max={filters.dateTo || undefined}?
          - Если filters.dateTo пустая строка, передаём undefined,
            чтобы браузер НЕ устанавливал ограничение (все даты доступны)
          - Если filters.dateTo заполнена, браузер заблокирует даты ПОЗЖЕ неё
          - Это предотвращает выбор "нелогичного" периода
        */}
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

        {/* === 🔥 ДАТА ДО (с валидацией) === */}
        {/* 
          ПОЧЕМУ min={filters.dateFrom || undefined}?
          Аналогично полю "Дата от":
          - Если filters.dateFrom пустая, ограничений нет
          - Если заполнена, браузер заблокирует даты РАНЬШЕ неё
          - Визуально недоступные даты отображаются серым цветом
        */}
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