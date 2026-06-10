/**
 * FilterPanel.jsx — панель фильтров каталога
 * 🔥 ЭТАП 5.4: Полная локализация всех лейблов и опций
 */
import { Filter, RotateCcw } from 'lucide-react';
import { SERVICE_CATEGORIES } from '../../utils/constants';
import Badge from '../UI/Badge';
import Input from '../UI/Input';
import { useLanguage } from '../../hooks/useLanguage'; // 🔥 Добавлен хук
import './FilterPanel.css';

export default function FilterPanel({ filters, onFilterChange, onReset, activeCount = 0, viewMode = 'services' }) {
  const { t } = useLanguage(); // 🔥 Инициализация

  // 🔥 ЭТАП 5.4: Генерация опций категорий через t()
  const categoryOptions = [
    { value: 'all', label: t('catalog.categories.all') },
    { value: SERVICE_CATEGORIES.HAIR, label: t('catalog.categories.hair') },
    { value: SERVICE_CATEGORIES.NAILS, label: t('catalog.categories.nails') },
    { value: SERVICE_CATEGORIES.MASSAGE, label: t('catalog.categories.massage') },
    { value: SERVICE_CATEGORIES.COSMETOLOGY, label: t('catalog.categories.cosmetology') },
    { value: SERVICE_CATEGORIES.SPA, label: t('catalog.categories.spa') },
  ];

  const ratingOptions = [
    { value: 0, label: t('catalog.filters.ratingAny') },
    { value: 4, label: '4+' },
    { value: 4.5, label: '4.5+' },
    { value: 4.8, label: '4.8+' },
  ];

  return (
    <div className="filter-panel">
      <div className="filter-panel__header">
        <h3 className="filter-panel__title">
          <Filter size={18} />
          {t('catalog.filters.title')}
          {activeCount > 0 && <Badge variant="warning" size="sm">{activeCount}</Badge>}
        </h3>
        {activeCount > 0 && (
          <button type="button" className="filter-panel__reset" onClick={onReset} aria-label={t('common.resetFilters')}>
            <RotateCcw size={14} />
            {t('common.reset')}
          </button>
        )}
      </div>

      {viewMode === 'services' && (
        <div className="filter-panel__group">
          <label className="filter-panel__label">{t('catalog.filters.category')}</label>
          <div className="filter-panel__chips">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`filter-panel__chip ${filters.category === option.value ? 'filter-panel__chip--active' : ''}`}
                onClick={() => onFilterChange('category', option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'services' && (
        <div className="filter-panel__group">
          <label className="filter-panel__label">{t('catalog.filters.price')}</label>
          <div className="filter-panel__price-inputs">
            <Input
              type="number"
              label={t('catalog.filters.priceFrom')}
              value={filters.minPrice}
              onChange={(e) => onFilterChange('minPrice', Number(e.target.value))}
              min={0}
              max={filters.maxPrice}
              placeholder="0"
            />
            <Input
              type="number"
              label={t('catalog.filters.priceTo')}
              value={filters.maxPrice}
              onChange={(e) => onFilterChange('maxPrice', Number(e.target.value))}
              min={filters.minPrice}
              max={10000}
              placeholder="500"
            />
          </div>
        </div>
      )}

      <div className="filter-panel__group">
        <label className="filter-panel__label">{t('catalog.filters.rating')}</label>
        <div className="filter-panel__chips">
          {ratingOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`filter-panel__chip ${filters.minRating === option.value ? 'filter-panel__chip--active' : ''}`}
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