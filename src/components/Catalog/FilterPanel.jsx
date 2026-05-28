/**
 * FilterPanel.jsx — панель фильтров каталога
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Презентационный компонент. Получает filters и callbacks через props.
 * НЕ владеет состоянием — сообщает о изменениях родителю через onFilterChange.
 *
 * ПОЧЕМУ отдельные кнопки категорий, а не select?
 * UX-решение: пользователь видит все варианты сразу, не нужно кликать для выбора.
 * Это увеличивает конверсию в выбор категории.
 */

import { Filter, RotateCcw } from 'lucide-react';

import { SERVICE_CATEGORIES, SERVICE_CATEGORY_LABELS } from '../../utils/constants';
import Badge from '../UI/Badge';

import './FilterPanel.css';

export default function FilterPanel({
  filters,
  onFilterChange,
  onReset,
  activeCount = 0,
  viewMode = 'services',
}) {
  // === ОПЦИИ КАТЕГОРИЙ ===
  const categoryOptions = [
    { value: 'all', label: 'Все' },
    ...Object.values(SERVICE_CATEGORIES).map((cat) => ({
      value: cat,
      label: SERVICE_CATEGORY_LABELS[cat],
    })),
  ];

  // === ОПЦИИ РЕЙТИНГА ===
  const ratingOptions = [
    { value: 0, label: 'Любой' },
    { value: 4, label: '4+' },
    { value: 4.5, label: '4.5+' },
    { value: 4.8, label: '4.8+' },
  ];

  return (
    <div className="filter-panel">
      <div className="filter-panel__header">
        <h3 className="filter-panel__title">
          <Filter size={18} />
          Фильтры
          {activeCount > 0 && (
            <Badge variant="warning" size="sm">{activeCount}</Badge>
          )}
        </h3>

        {activeCount > 0 && (
          <button
            type="button"
            className="filter-panel__reset"
            onClick={onReset}
            aria-label="Сбросить фильтры"
          >
            <RotateCcw size={14} />
            Сбросить
          </button>
        )}
      </div>

      {/* === КАТЕГОРИИ (только для услуг) === */}
      {viewMode === 'services' && (
        <div className="filter-panel__group">
          <label className="filter-panel__label">Категория</label>
          <div className="filter-panel__chips">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`filter-panel__chip ${
                  filters.category === option.value ? 'filter-panel__chip--active' : ''
                }`}
                onClick={() => onFilterChange('category', option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* === ЦЕНА (только для услуг) === */}
      {viewMode === 'services' && (
        <div className="filter-panel__group">
          <label className="filter-panel__label">
            Цена: {filters.minPrice} — {filters.maxPrice} BYN
          </label>
          <div className="filter-panel__range">
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={filters.maxPrice}
              onChange={(e) => onFilterChange('maxPrice', Number(e.target.value))}
              className="filter-panel__slider"
              aria-label="Максимальная цена"
            />
          </div>
        </div>
      )}

      {/* === РЕЙТИНГ === */}
      <div className="filter-panel__group">
        <label className="filter-panel__label">Рейтинг</label>
        <div className="filter-panel__chips">
          {ratingOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`filter-panel__chip ${
                filters.minRating === option.value ? 'filter-panel__chip--active' : ''
              }`}
              onClick={() => onFilterChange('minRating', option.value)}
            >
              ⭐ {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}