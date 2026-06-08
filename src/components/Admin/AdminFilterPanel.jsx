/**
 * AdminFilterPanel.jsx — панель фильтров и сортировки для администратора
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Презентационный компонент. НЕ владеет состоянием фильтров.
 * Сообщает об изменениях родителю через onFilterChange и onSortChange.
 * 
 * ЭТАП 1.4: Валидация дат (запрет нелогичных периодов)
 * 🔥 ЭТАП 3.2: Разделение на три секции: Поиск, Сортировка, Фильтры
 * 🔥 ЭТАП 3.4: Явный заголовок "Сортировка" над полем
 * 🔥 ЭТАП 3.5: Лейблы для всех полей фильтров (Статус, Специалист, С, По)
 * 🔥 ЭТАП 7.6: Полная локализация всех текстов
 */

import { Filter, RotateCcw, Search, ArrowUpDown } from 'lucide-react';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Badge from '../UI/Badge';
import Toast from '../UI/Toast';
import { BOOKING_STATUS } from '../../utils/constants';
import { useLanguage } from '../../hooks/useLanguage'; // 🔥 ЭТАП 7.6
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
  const { t } = useLanguage(); // 🔥 ЭТАП 7.6

  // === ОПЦИИ СТАТУСОВ ===
  // 🔥 ЭТАП 7.6: label берётся через t('status.' + status) вместо BOOKING_STATUS_LABELS
  // ПОЧЕМУ так? BOOKING_STATUS_LABELS — хардкод в constants.js.
  // Использование t() позволяет переводить статусы без изменения constants.js
  const statusOptions = [
    { value: 'all', label: t('admin.filters.allStatuses') },
    ...Object.values(BOOKING_STATUS).map((status) => ({
      value: status,
      label: t(`status.${status}`),
    })),
  ];

  // === ОПЦИИ МАСТЕРОВ ===
  const specialistOptions = [
    { value: 'all', label: t('admin.filters.allSpecialists') },
    ...specialists.map((spec) => ({
      value: spec.id,
      label: spec.fullName,
    })),
  ];

  // === ОПЦИИ СОРТИРОВКИ ===
  // 🔥 ЭТАП 7.6: все label через t()
  const sortOptions = [
    { value: 'date-desc', label: t('admin.sort.dateDesc') },
    { value: 'date-asc', label: t('admin.sort.dateAsc') },
    { value: 'service', label: t('admin.sort.service') },
    { value: 'specialist', label: t('admin.sort.specialist') },
    { value: 'client', label: t('admin.sort.client') },
  ];

  // === 🔥 ОБРАБОТЧИК ИЗМЕНЕНИЯ ДАТЫ "ОТ" (ЭТАП 1.4) ===
  const handleDateFromChange = (e) => {
    const newDateFrom = e.target.value;
    if (filters.dateTo && newDateFrom > filters.dateTo) {
      onFilterChange('dateTo', '');
      Toast.info(t('admin.filters.dateFromResetWarning'), {
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
      Toast.info(t('admin.filters.dateToResetWarning'), {
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
          {t('admin.filters.title')}
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
            {t('common.reset')}
          </button>
        )}
      </div>

      {/* === 🔥 СЕКЦИЯ 1: ПОИСК (ЭТАП 3.2) === */}
      <div className="admin-filter-panel__section admin-filter-panel__section--search">
        <h4 className="admin-filter-panel__section-title">
          <Search size={16} />
          {t('admin.filters.search')}
        </h4>
        <Input
          placeholder={t('admin.filters.searchPlaceholder')}
          value={filters.searchQuery}
          onChange={(e) => onFilterChange('searchQuery', e.target.value)}
          leftIcon={<Search size={18} />}
        />
      </div>

      {/* === 🔥 СЕКЦИЯ 2: СОРТИРОВКА (ЭТАП 3.2 + 3.4) === */}
      <div className="admin-filter-panel__section admin-filter-panel__section--sort">
        <h4 className="admin-filter-panel__section-title">
          <ArrowUpDown size={16} />
          {t('admin.filters.sort')}
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
          {t('admin.filters.filters')}
        </h4>

        <div className="admin-filter-panel__filters-grid">
          {/* Статус */}
          <Select
            label={t('admin.filters.status')}
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            options={statusOptions}
          />

          {/* Специалист */}
          <Select
            label={t('admin.filters.specialist')}
            value={filters.specialistId}
            onChange={(e) => onFilterChange('specialistId', e.target.value)}
            options={specialistOptions}
          />

          {/* Дата от */}
          <Input
            type="date"
            label={t('admin.filters.dateFrom')}
            value={filters.dateFrom}
            onChange={handleDateFromChange}
            max={filters.dateTo || undefined}
            helperText={
              filters.dateTo
                ? `${t('admin.filters.notLaterThan')} ${new Date(filters.dateTo).toLocaleDateString(
                    t('common.locale') === 'en' ? 'en-US' : 'ru-RU'
                  )}`
                : t('admin.filters.selectStartDate')
            }
            title={t('admin.filters.selectStartDate')}
          />

          {/* Дата до */}
          <Input
            type="date"
            label={t('admin.filters.dateTo')}
            value={filters.dateTo}
            onChange={handleDateToChange}
            min={filters.dateFrom || undefined}
            helperText={
              filters.dateFrom
                ? `${t('admin.filters.notEarlierThan')} ${new Date(filters.dateFrom).toLocaleDateString(
                    t('common.locale') === 'en' ? 'en-US' : 'ru-RU'
                  )}`
                : t('admin.filters.selectEndDate')
            }
            title={t('admin.filters.selectEndDate')}
          />
        </div>
      </div>
    </div>
  );
}