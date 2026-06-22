/**
 * ServiceSelector.jsx — Шаг 1 многошаговой формы
 * 
 * НАЗНАЧЕНИЕ:
 * Отображает каталог услуг салона с фильтрацией по категориям и сортировкой.
 * Пользователь выбирает услугу кликом по карточке.
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Это "глупый" презентационный компонент — он НЕ владеет состоянием выбора.
 * Выбор хранится в draft (в BookingWizard), сюда приходит через props.
 * При клике вызывает onSelect(serviceId) — callback родителя.
 * 
 * 🔥 ЭТАП 2.3: Добавлена панель сортировки с toggle направления
 * 🔥 ЭТАП 7.4: Полная локализация всех пользовательских текстов
 * 🔥 ИСПРАВЛЕНИЕ: Сортировка по категории теперь учитывает направление (asc/desc)
 */

import { useState, useMemo } from 'react';
import { Clock, Star, Check, ArrowUp, ArrowDown } from 'lucide-react';
import { SERVICE_CATEGORIES } from '../../utils/constants';
import { formatPrice, formatDuration } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import { useLanguage } from '../../hooks/useLanguage';
import Input from '../UI/Input';
import EmptyState from '../UI/EmptyState';
import './ServiceSelector.css';

// === КОНФИГУРАЦИЯ СОРТИРОВКИ ===
// ПОЧЕМУ вынесено в константу?
// - Единая точка правды о доступных вариантах сортировки
// - Легко добавлять новые варианты
// - Используется в двух местах: рендер кнопок и логика сортировки
const SORT_OPTIONS = [
  { field: 'popular', labelKey: 'catalog.sort.popular', defaultDirection: 'desc' },
  { field: 'price', labelKey: 'catalog.sort.priceAsc', defaultDirection: 'asc' },
  { field: 'name', labelKey: 'catalog.sort.name', defaultDirection: 'asc' },
  { field: 'category', labelKey: 'catalog.sort.category', defaultDirection: 'asc' },
];

export default function ServiceSelector({
  services,
  selectedServiceId,
  onSelect,
}) {
  const { t } = useLanguage();

  // === ЛОКАЛЬНОЕ СОСТОЯНИЕ ФИЛЬТРОВ ===
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  // === СОСТОЯНИЕ СОРТИРОВКИ ===
  const [sort, setSort] = useState({
    field: 'popular',
    direction: 'desc',
  });

  // === ОБРАБОТЧИК КЛИКА ПО КНОПКЕ СОРТИРОВКИ ===
  const handleSortClick = (field) => {
    setSort((prev) => {
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      const option = SORT_OPTIONS.find((opt) => opt.field === field);
      return {
        field,
        direction: option?.defaultDirection || 'asc',
      };
    });
  };

  // === ФИЛЬТРАЦИЯ УСЛУГ ===
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const categoryMatch =
        selectedCategory === 'all' || service.category === selectedCategory;

      const queryMatch =
        !debouncedQuery ||
        service.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(debouncedQuery.toLowerCase());

      return categoryMatch && queryMatch;
    });
  }, [services, selectedCategory, debouncedQuery]);

  // === СОРТИРОВКА УСЛУГ ===
  const sortedServices = useMemo(() => {
    const result = [...filteredServices];
    
    result.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'popular':
          comparison = a.rating - b.rating;
          break;

        case 'price':
          comparison = a.price - b.price;
          break;

        case 'name':
          comparison = a.name.localeCompare(b.name, 'ru');
          break;

        case 'category':
          const categoryComparison = a.category.localeCompare(b.category, 'ru');
          if (categoryComparison !== 0) {
            comparison = categoryComparison;
          } else {
            comparison = a.name.localeCompare(b.name, 'ru');
          }
          break;

        default:
          comparison = 0;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [filteredServices, sort]);

  // === ОПЦИИ ДЛЯ ФИЛЬТРА КАТЕГОРИЙ ===
  // 🔥 Локализованные названия категорий
  const categoryOptions = [
    { value: 'all', label: t('catalog.categories.all') },
    ...Object.values(SERVICE_CATEGORIES).map((cat) => ({
      value: cat,
      label: t(`catalog.categories.${cat}`),
    })),
  ];

  // === ПОЛУЧЕНИЕ ИКОНКИ ДЛЯ КНОПКИ СОРТИРОВКИ ===
  const getSortIcon = (field) => {
    if (sort.field !== field) return null;
    return sort.direction === 'asc' ? (
      <ArrowUp size={14} />
    ) : (
      <ArrowDown size={14} />
    );
  };

  return (
    <div className="service-selector">
      <div className="service-selector__header">
        {/* 🔥 Локализованный заголовок */}
        <h2>{t('booking.steps.service')}</h2>
        <p className="service-selector__description">
          {/* 🔥 Локализованное описание с интерполяцией */}
          {t('booking.serviceCount', {
            services: services.length,
            categories: Object.keys(SERVICE_CATEGORIES).length,
          })}
        </p>
      </div>

      {/* === ПАНЕЛЬ ФИЛЬТРОВ === */}
      <div className="service-selector__filters">
        <Input
          placeholder={t('catalog.search.placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="service-selector__search"
        />

        <div className="service-selector__categories">
          {categoryOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`service-selector__category ${
                selectedCategory === option.value
                  ? 'service-selector__category--active'
                  : ''
              }`}
              onClick={() => setSelectedCategory(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* === ПАНЕЛЬ СОРТИРОВКИ === */}
      <div className="service-selector__sort">
        {/* 🔥 Локализованная метка */}
        <span className="service-selector__sort-label">
          {t('catalog.sort.title')}:
        </span>
        <div className="service-selector__sort-buttons">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.field}
              type="button"
              className={`service-selector__sort-btn ${
                sort.field === option.field
                  ? 'service-selector__sort-btn--active'
                  : ''
              }`}
              onClick={() => handleSortClick(option.field)}
              aria-pressed={sort.field === option.field}
              aria-label={`${t('catalog.sort.title')} ${t(option.labelKey).toLowerCase()}`}
            >
              <span>{t(option.labelKey)}</span>
              <span className="service-selector__sort-icon">
                {getSortIcon(option.field)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* === СПИСОК УСЛУГ === */}
      {sortedServices.length === 0 ? (
        <EmptyState
          title={t('catalog.empty.services')}
          description={t('catalog.empty.servicesDescription')}
          variant="info"
        />
      ) : (
        <div className="service-selector__grid">
          {sortedServices.map((service) => {
            const isSelected = selectedServiceId === service.id;
            return (
              <article
                key={service.id}
                className={`service-card ${
                  isSelected ? 'service-card--selected' : ''
                }`}
                onClick={() => onSelect(service.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(service.id);
                  }
                }}
              >
                {isSelected && (
                  <div className="service-card__check">
                    <Check size={20} />
                  </div>
                )}

                <div className="service-card__category">
                  {/* 🔥 Локализованная категория */}
                  {t(`catalog.categories.${service.category}`)}
                </div>

                <h3 className="service-card__title">{service.name}</h3>

                <p className="service-card__description text-break">
                  {service.description}
                </p>

                <div className="service-card__meta">
                  <span className="service-card__meta-item">
                    <Clock size={14} />
                    {formatDuration(service.duration)}
                  </span>
                  <span className="service-card__meta-item">
                    <Star size={14} />
                    {service.rating}
                  </span>
                </div>

                <div className="service-card__price">
                  {formatPrice(service.price)}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}