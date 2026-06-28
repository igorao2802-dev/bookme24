/**
 * FilterPanel.jsx — панель фильтров каталога
 * 
 * 🔥 ИСПРАВЛЕНО:
 * - Добавлен prop `services` для вычисления maxPrice
 * - step={1} — только целые числа
 * - Запрет ввода дробных и ведущих нулей
 * - maxPrice ограничен максимальной ценой услуги в каталоге
 */
import { useMemo } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { SERVICE_CATEGORIES, PRICE_LIMITS } from '../../utils/constants';
import Badge from '../UI/Badge';
import Input from '../UI/Input';
import { useLanguage } from '../../hooks/useLanguage';
import './FilterPanel.css';

// 🔥 НОВОЕ: Обработчик для числовых полей — запрет дробных
const handleNumericInput = (e) => {
  if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
    e.preventDefault();
  }
};

// 🔥 НОВОЕ: Обработчик изменения — удаление ведущих нулей
const handlePriceFilterChange = (setValue, maxLimit) => (e) => {
  let value = e.target.value;
  
  // Убираем всё, кроме цифр
  value = value.replace(/\D/g, '');
  
  // Удаляем ведущие нули
  if (value.length > 1 && value.startsWith('0')) {
    value = value.replace(/^0+/, '') || '0';
  }
  
  // Ограничиваем максимум
  if (Number(value) > maxLimit) {
    value = String(maxLimit);
  }
  
  setValue(value);
};

export default function FilterPanel({ 
  filters, 
  onFilterChange, 
  onReset, 
  activeCount = 0, 
  viewMode = 'services',
  services = [], // 🔥 НОВОЕ: для вычисления maxPrice
}) {
  const { t } = useLanguage();

  // 🔥 НОВОЕ: Вычисляем максимальную цену в каталоге
  const maxPriceInCatalog = useMemo(() => {
    if (!services.length) return PRICE_LIMITS.MAX;
    const maxPrice = Math.max(...services.map((s) => s.price || 0));
    return Math.min(maxPrice, PRICE_LIMITS.MAX);
  }, [services]);

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

      {/* 🔥 ИСПРАВЛЕНО: Фильтры по цене с валидацией */}
      {viewMode === 'services' && (
        <div className="filter-panel__group">
          <label className="filter-panel__label">{t('catalog.filters.price')}</label>
          <div className="filter-panel__price-inputs">
            <Input
              type="number"
              label={t('catalog.filters.priceFrom')}
              value={filters.minPrice}
              onChange={handlePriceFilterChange(
                (value) => onFilterChange('minPrice', Number(value)),
                filters.maxPrice || maxPriceInCatalog
              )}
              onKeyPress={handleNumericInput}
              min={PRICE_LIMITS.MIN}
              max={filters.maxPrice || maxPriceInCatalog}
              step={PRICE_LIMITS.STEP}
              placeholder="0"
            />
            <Input
              type="number"
              label={t('catalog.filters.priceTo')}
              value={filters.maxPrice}
              onChange={handlePriceFilterChange(
                (value) => onFilterChange('maxPrice', Number(value)),
                maxPriceInCatalog
              )}
              onKeyPress={handleNumericInput}
              min={filters.minPrice || PRICE_LIMITS.MIN}
              max={maxPriceInCatalog}
              step={PRICE_LIMITS.STEP}
              placeholder={String(maxPriceInCatalog)}
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