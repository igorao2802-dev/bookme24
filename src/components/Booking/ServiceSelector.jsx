/**
 * ServiceSelector.jsx — Шаг 1 многошаговой формы
 *
 * НАЗНАЧЕНИЕ:
 * Отображает каталог услуг салона с фильтрацией по категориям.
 * Пользователь выбирает услугу кликом по карточке.
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Это "глупый" презентационный компонент — он НЕ владеет состоянием выбора.
 * Выбор хранится в draft (в BookingWizard), сюда приходит через props.
 * При клике вызывает onSelect(serviceId) — callback родителя.
 */

import { useState, useMemo } from 'react';
import { Clock, Star, Check } from 'lucide-react';

import { SERVICE_CATEGORIES, SERVICE_CATEGORY_LABELS } from '../../utils/constants';
import { formatPrice, formatDuration } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';

// === UI ===
import Input from '../UI/Input';
import EmptyState from '../UI/EmptyState';

import './ServiceSelector.css';

export default function ServiceSelector({
  services,
  selectedServiceId,
  onSelect,
}) {
  // === ЛОКАЛЬНОЕ СОСТОЯНИЕ ФИЛЬТРОВ ===
  // ПОЧЕМУ локально, а не в draft?
  // Фильтры — это временные настройки UI, их не нужно сохранять между перезагрузками
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  // === ФИЛЬТРАЦИЯ УСЛУГ ===
  // ПОЧЕМУ useMemo? Пересчитываем только при изменении зависимостей
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      // Фильтр по категории
      const categoryMatch =
        selectedCategory === 'all' || service.category === selectedCategory;

      // Фильтр по поисковому запросу (без учёта регистра)
      const queryMatch =
        !debouncedQuery ||
        service.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(debouncedQuery.toLowerCase());

      return categoryMatch && queryMatch;
    });
  }, [services, selectedCategory, debouncedQuery]);

  // === ОПЦИИ ДЛЯ ФИЛЬТРА ===
  const categoryOptions = [
    { value: 'all', label: 'Все категории' },
    ...Object.values(SERVICE_CATEGORIES).map((cat) => ({
      value: cat,
      label: SERVICE_CATEGORY_LABELS[cat],
    })),
  ];

  return (
    <div className="service-selector">
      <div className="service-selector__header">
        <h2>Выберите услугу</h2>
        <p className="service-selector__description">
          У нас {services.length} услуг в {Object.keys(SERVICE_CATEGORIES).length} категориях
        </p>
      </div>

      {/* === ПАНЕЛЬ ФИЛЬТРОВ === */}
      <div className="service-selector__filters">
        <Input
          placeholder="Поиск по названию..."
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

      {/* === СПИСОК УСЛУГ === */}
      {filteredServices.length === 0 ? (
        <EmptyState
          title="Услуги не найдены"
          description="Попробуйте изменить параметры поиска или выбрать другую категорию"
          variant="info"
        />
      ) : (
        <div className="service-selector__grid">
          {filteredServices.map((service) => {
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
                {/* Индикатор выбора */}
                {isSelected && (
                  <div className="service-card__check">
                    <Check size={20} />
                  </div>
                )}

                <div className="service-card__category">
                  {SERVICE_CATEGORY_LABELS[service.category]}
                </div>

                <h3 className="service-card__title">{service.name}</h3>

                {/* ПОЧЕМУ text-break? Замечание В.В. из ПР-07 про длинные тексты */}
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