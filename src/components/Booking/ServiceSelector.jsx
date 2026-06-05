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
 * - 6 вариантов сортировки: популярность, цена (↑↓), название (А-Я, Я-А), категория
 * - Повторный клик на ту же кнопку меняет направление (↑ → ↓)
 * - Сортировка применяется ПОСЛЕ фильтрации (оптимизация по замечанию В.В.)
 */

import { useState, useMemo } from 'react';
import { Clock, Star, Check, ArrowUp, ArrowDown } from 'lucide-react';
import { SERVICE_CATEGORIES, SERVICE_CATEGORY_LABELS } from '../../utils/constants';
import { formatPrice, formatDuration } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';

// === UI ===
import Input from '../UI/Input';
import EmptyState from '../UI/EmptyState';

import './ServiceSelector.css';

// === КОНФИГУРАЦИЯ СОРТИРОВКИ ===
// ПОЧЕМУ вынесено в константу?
// - Единая точка правды о доступных вариантах сортировки
// - Легко добавлять новые варианты
// - Используется в двух местах: рендер кнопок и логика сортировки
const SORT_OPTIONS = [
  { field: 'popular', label: 'Популярные', defaultDirection: 'desc' },
  { field: 'price', label: 'По цене', defaultDirection: 'asc' },
  { field: 'name', label: 'По названию', defaultDirection: 'asc' },
  { field: 'category', label: 'По категории', defaultDirection: 'asc' },
];

export default function ServiceSelector({
  services,
  selectedServiceId,
  onSelect,
}) {
  // === ЛОКАЛЬНОЕ СОСТОЯНИЕ ФИЛЬТРОВ ===
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  // === 🔥 СОСТОЯНИЕ СОРТИРОВКИ (ЭТАП 2.3) ===
  // ПОЧЕМУ объект { field, direction }, а не просто строка?
  // Нужно хранить два параметра: ЧТО сортировать и КАК (↑ или ↓).
  // Объект позволяет атомарно обновлять оба поля через setSort.
  const [sort, setSort] = useState({
    field: 'popular',
    direction: 'desc', // Популярные — сначала с высоким рейтингом
  });

  // === 🔥 ОБРАБОТЧИК КЛИКА ПО КНОПКЕ СОРТИРОВКИ (ЭТАП 2.3) ===
  // ПОЧЕМУ такая логика toggle?
  // UX-стандарт: первый клик — сортирует по полю в направлении по умолчанию,
  // повторный клик на ту же кнопку — меняет направление.
  // Клик на другую кнопку — сбрасывает направление на default.
  const handleSortClick = (field) => {
    setSort((prev) => {
      // Если кликнули на ту же кнопку — меняем направление
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      // Если кликнули на новую кнопку — берём направление по умолчанию
      const option = SORT_OPTIONS.find((opt) => opt.field === field);
      return {
        field,
        direction: option?.defaultDirection || 'asc',
      };
    });
  };

  // === ФИЛЬТРАЦИЯ УСЛУГ ===
  // ПОЧЕМУ useMemo? Пересчитываем только при изменении зависимостей
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

  // === 🔥 СОРТИРОВКА УСЛУГ (ЭТАП 2.3) ===
  // ПОЧЕМУ отдельный useMemo, а не внутри filteredServices?
  // Принцип "сначала filter, потом sort" (замечание В.В. из ПР-04):
  // - Фильтруем весь массив services → получаем меньший массив
  // - Сортируем уже отфильтрованный массив → быстрее
  // Если бы делали всё в одном useMemo — пришлось бы сортировать ВСЕ услуги,
  // а потом брать отфильтрованные, что неэффективно.
  const sortedServices = useMemo(() => {
    // Создаём копию массива, т.к. sort() мутирует исходный массив
    // ПОЧЕМУ [...filteredServices], а не filteredServices.slice()?
    // Оба варианта работают, но spread-оператор короче и читаемее.
    const result = [...filteredServices];

    result.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'popular':
          // Сортировка по рейтингу (популярности)
          comparison = a.rating - b.rating;
          break;

        case 'price':
          // Сортировка по цене
          comparison = a.price - b.price;
          break;

        case 'name':
          // Сортировка по названию (localeCompare учитывает кириллицу)
          comparison = a.name.localeCompare(b.name, 'ru');
          break;

        case 'category':
          // Сортировка по категории, внутри категории — по названию
          // ПОЧЕМУ составная сортировка?
          // Иначе услуги одной категории шли бы в случайном порядке
          const categoryComparison = a.category.localeCompare(b.category, 'ru');
          if (categoryComparison !== 0) return categoryComparison;
          return a.name.localeCompare(b.name, 'ru');

        default:
          comparison = 0;
      }

      // Применяем направление сортировки
      // ПОЧЕМУ умножаем на -1 для desc?
      // Это стандартный паттерн: меняем знак результата сравнения
      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [filteredServices, sort]);

  // === ОПЦИИ ДЛЯ ФИЛЬТРА КАТЕГОРИЙ ===
  const categoryOptions = [
    { value: 'all', label: 'Все категории' },
    ...Object.values(SERVICE_CATEGORIES).map((cat) => ({
      value: cat,
      label: SERVICE_CATEGORY_LABELS[cat],
    })),
  ];

  // === ПОЛУЧЕНИЕ ИКОНКИ ДЛЯ КНОПКИ СОРТИРОВКИ ===
  // ПОЧЕМУ отдельная функция?
  // Инкапсулирует логику выбора иконки: ↑ для asc, ↓ для desc, ничего для неактивной
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

      {/* === 🔥 ПАНЕЛЬ СОРТИРОВКИ (ЭТАП 2.3) === */}
      {/* 
        ПОЧЕМУ отдельная панель, а не часть фильтров?
        - Фильтры СУЖАЮТ выборку (логическое И)
        - Сортировка УПОРЯДОЧИВАЕТ выборку
        - Это разные по смыслу операции, их нужно визуально разделить
      */}
      <div className="service-selector__sort">
        <span className="service-selector__sort-label">Сортировка:</span>
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
              aria-label={`Сортировать ${option.label.toLowerCase()} ${
                sort.field === option.field
                  ? sort.direction === 'asc'
                    ? 'по возрастанию'
                    : 'по убыванию'
                  : ''
              }`}
            >
              <span>{option.label}</span>
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
          title="Услуги не найдены"
          description="Попробуйте изменить параметры поиска или выбрать другую категорию"
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
                  {SERVICE_CATEGORY_LABELS[service.category]}
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