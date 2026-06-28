/**
 * AdminFilterPanel.jsx — панель фильтров и сортировки для администратора
 * 
 * 🔥 ИСПРАВЛЕНО:
 * - Используется кастомный календарь react-datepicker для полной локализации
 * - Устранены все опечатки (& &, = >)
 * - Добавлена поддержка тёмной темы для DatePicker
 * - Локализованный формат даты (дд.мм.гггг / mm/dd/yyyy)
 */
import { useState } from 'react';
import { Filter, RotateCcw, Search, ArrowUpDown } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
import en from 'date-fns/locale/en-US';
import 'react-datepicker/dist/react-datepicker.css';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Badge from '../UI/Badge';
import Toast from '../UI/Toast';
import { BOOKING_STATUS } from '../../utils/constants';
import { useLanguage } from '../../hooks/useLanguage';
import './AdminFilterPanel.css';

// Регистрация локалей для DatePicker
registerLocale('ru', ru);
registerLocale('en', en);

export default function AdminFilterPanel({
  filters,
  sortBy,
  specialists,
  onFilterChange,
  onSortChange,
  onReset,
  activeCount = 0,
}) {
  const { t, language } = useLanguage();
  const currentLocale = language === 'en' ? 'en' : 'ru';

  // === ОПЦИИ СТАТУСОВ ===
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
  const sortOptions = [
    { value: 'date-desc', label: t('admin.sort.dateDesc') },
    { value: 'date-asc', label: t('admin.sort.dateAsc') },
    { value: 'service', label: t('admin.sort.service') },
    { value: 'specialist', label: t('admin.sort.specialist') },
    { value: 'client', label: t('admin.sort.client') },
  ];

  // === ОБРАБОТЧИК ИЗМЕНЕНИЯ ДАТЫ "ОТ" ===
  const handleDateFromChange = (date) => {
    const newDateFrom = date ? date.toISOString().split('T')[0] : '';
    if (filters.dateTo && newDateFrom > filters.dateTo) {
      onFilterChange('dateTo', '');
      Toast.info(t('admin.filters.dateFromResetWarning'), {
        duration: 3000,
      });
    }
    onFilterChange('dateFrom', newDateFrom);
  };

  // === ОБРАБОТЧИК ИЗМЕНЕНИЯ ДАТЫ "ДО" ===
  const handleDateToChange = (date) => {
    const newDateTo = date ? date.toISOString().split('T')[0] : '';
    if (filters.dateFrom && newDateTo < filters.dateFrom) {
      onFilterChange('dateFrom', '');
      Toast.info(t('admin.filters.dateToResetWarning'), {
        duration: 3000,
      });
    }
    onFilterChange('dateTo', newDateTo);
  };

  // Преобразование строки даты в объект Date для DatePicker
  const dateFromString = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-');
    return new Date(year, month - 1, day);
  };

  return (
    <div className="admin-filter-panel">
      {/* === ЗАГОЛОВОК ПАНЕЛИ === */}
      <div className="admin-filter-panel__header">
        <h3 className="admin-filter-panel__title">
          <Filter size={18} />
          {t('admin.filters.title')}
          {activeCount > 0 && (
            <Badge variant="warning" size="sm">
              {activeCount}
            </Badge>
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

      {/* === СЕКЦИЯ 1: ПОИСК === */}
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

      {/* === СЕКЦИЯ 2: СОРТИРОВКА === */}
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

      {/* === СЕКЦИЯ 3: ФИЛЬТРЫ === */}
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

          {/* 🔥 Дата от — кастомный календарь с локализацией */}
          <div className="admin-filter-panel__date-field">
            <label className="input__label">
              {t('admin.filters.dateFrom')}
            </label>
            <DatePicker
              selected={dateFromString(filters.dateFrom)}
              onChange={handleDateFromChange}
              locale={currentLocale}
              dateFormat={language === 'en' ? 'MM/dd/yyyy' : 'dd.MM.yyyy'}
              placeholderText={t('admin.filters.datePlaceholder')}
              maxDate={filters.dateTo ? dateFromString(filters.dateTo) : undefined}
              isClearable
              className="input__field"
            />
          </div>

          {/* 🔥 Дата до — кастомный календарь с локализацией */}
          <div className="admin-filter-panel__date-field">
            <label className="input__label">
              {t('admin.filters.dateTo')}
            </label>
            <DatePicker
              selected={dateFromString(filters.dateTo)}
              onChange={handleDateToChange}
              locale={currentLocale}
              dateFormat={language === 'en' ? 'MM/dd/yyyy' : 'dd.MM.yyyy'}
              placeholderText={t('admin.filters.datePlaceholder')}
              minDate={filters.dateFrom ? dateFromString(filters.dateFrom) : undefined}
              isClearable
              className="input__field"
            />
          </div>
        </div>
      </div>
    </div>
  );
}