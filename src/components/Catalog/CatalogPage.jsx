/**
 * CatalogPage.jsx — Вкладка №2: Каталог услуг и специалистов
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Это "дирижёр" всего каталога. Владеет состоянием фильтров, поиска и сортировки.
 * Дочерние компоненты получают данные через props, события отправляют через callbacks.
 *
 * ПОЧЕМУ именно здесь живут фильтры, а не в FilterPanel?
 * Замечание В.В. из лекции React-1-2: "App.js — начальник, хранит State.
 * Компоненты-сотрудники просто рисуют то, что приказали через props."
 * FilterPanel — это "сотрудник", он не принимает решений, он только сообщает о выборе.
 *
 * ПРИНЦИП ОДНОНАПРАВЛЕННОГО ПОТОКА:
 * Данные (services, specialists) → вниз через props
 * События (изменение фильтра, поиска) → вверх через callbacks
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Scissors, Users } from 'lucide-react';

// === UI КОМПОНЕНТЫ ===
import Button from '../UI/Button';
import EmptyState from '../UI/EmptyState';
import Badge from '../UI/Badge';

// === КОМПОНЕНТЫ КАТАЛОГА ===
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';
import SortPanel from './SortPanel';
import ServiceCard from './ServiceCard';
import SpecialistCard from './SpecialistCard';
import FavoritesList from './FavoritesList';

// === ХУКИ ===
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useDebounce } from '../../hooks/useDebounce';

// === КОНСТАНТЫ ===
import { STORAGE_KEYS, SERVICE_CATEGORIES } from '../../utils/constants';

import './CatalogPage.css';

// === НАЧАЛЬНЫЕ ФИЛЬТРЫ ===
// ПОЧЕМУ вынесено в константу? Используется в двух местах: инициализация и сброс
const INITIAL_FILTERS = {
  category: 'all',
  minPrice: 0,
  maxPrice: 500,
  minRating: 0,
};

export default function CatalogPage({ services, specialists }) {
  const navigate = useNavigate();

  // === РЕЖИМ ОТОБРАЖЕНИЯ (услуги / мастера / избранное) ===
  const [viewMode, setViewMode] = useState('services'); // services | specialists | favorites

  // === ПОИСК С DEBOUNCE ===
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  // === ФИЛЬТРЫ ===
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  // === СОРТИРОВКА ===
  const [sortBy, setSortBy] = useState('popular'); // popular | price-asc | price-desc | name | rating

  // === ИЗБРАННОЕ (синхронизация между вкладками через localStorage) ===
  const [favorites, setFavorites] = useLocalStorage(STORAGE_KEYS.FAVORITES, []);

  // === ОБНОВЛЕНИЕ ФИЛЬТРОВ ===
  // ПОЧЕМУ функциональное обновление prev => ({...prev, ...})?
  // Защита от гонок состояния при быстрых изменениях нескольких фильтров
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  // === СБРОС ФИЛЬТРОВ ===
  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchQuery('');
    setSortBy('popular');
  };

  // === ПЕРЕКЛЮЧЕНИЕ ИЗБРАННОГО ===
  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  // === ПЕРЕХОД К ЗАПИСИ ===
  // ПОЧЕМУ navigate с state? Передаём выбранную услугу в BookingWizard через location.state
  const handleBookService = (serviceId) => {
    navigate('/', { state: { preselectedServiceId: serviceId } });
  };

  const handleBookSpecialist = (specialistId) => {
    navigate('/', { state: { preselectedSpecialistId: specialistId } });
  };

  // === 🔥 ФИЛЬТРАЦИЯ И СОРТИРОВКА (useMemo для оптимизации) ===
  // ПОЧЕМУ useMemo?
  // Замечание В.В. из ПР-04: "Сначала filter, потом sort — для оптимизации.
  // Сортируем меньший массив, а не весь каталог."
  // useMemo пересчитывает только при изменении зависимостей.
  const filteredAndSortedServices = useMemo(() => {
    // === ШАГ 1: ФИЛЬТРАЦИЯ (сужаем выборку) ===
    let result = services.filter((service) => {
      // Поиск по названию и описанию (без учёта регистра)
      const matchesSearch =
        !debouncedQuery ||
        service.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(debouncedQuery.toLowerCase());

      // Фильтр по категории
      const matchesCategory =
        filters.category === 'all' || service.category === filters.category;

      // Фильтр по цене
      const matchesPrice =
        service.price >= filters.minPrice && service.price <= filters.maxPrice;

      // Фильтр по рейтингу
      const matchesRating = service.rating >= filters.minRating;

      // ПОЧЕМУ &&? Все условия должны выполняться одновременно (логическое И)
      return matchesSearch && matchesCategory && matchesPrice && matchesRating;
    });

    // === ШАГ 2: СОРТИРОВКА (упорядочиваем отфильтрованное) ===
    // ПОЧЕМУ sort после filter? Меньше элементов = быстрее сортировка
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name, 'ru');
        case 'rating':
          return b.rating - a.rating;
        case 'popular':
        default:
          // По умолчанию — по рейтингу (как показатель популярности)
          return b.rating - a.rating;
      }
    });

    return result;
  }, [services, debouncedQuery, filters, sortBy]);

  // === АНАЛОГИЧНО ДЛЯ МАСТЕРОВ ===
  const filteredAndSortedSpecialists = useMemo(() => {
    let result = specialists.filter((spec) => {
      const matchesSearch =
        !debouncedQuery ||
        spec.fullName.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        spec.position.toLowerCase().includes(debouncedQuery.toLowerCase());

      const matchesRating = spec.rating >= filters.minRating;

      return matchesSearch && matchesRating;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.fullName.localeCompare(b.fullName, 'ru');
        case 'rating':
          return b.rating - a.rating;
        case 'experience':
          return b.experience - a.experience;
        default:
          return b.rating - a.rating;
      }
    });

    return result;
  }, [specialists, debouncedQuery, filters, sortBy]);

  // === ИЗБРАННЫЕ ЭЛЕМЕНТЫ ===
  const favoriteServices = services.filter((s) => favorites.includes(s.id));
  const favoriteSpecialists = specialists.filter((s) => favorites.includes(s.id));

  // === КОЛИЧЕСТВО АКТИВНЫХ ФИЛЬТРОВ (для бейджа) ===
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'category') return value !== 'all';
    if (key === 'minPrice') return value !== INITIAL_FILTERS.minPrice;
    if (key === 'maxPrice') return value !== INITIAL_FILTERS.maxPrice;
    if (key === 'minRating') return value !== INITIAL_FILTERS.minRating;
    return false;
  }).length;

  return (
    <div className="catalog-page">
      {/* === ЗАГОЛОВОК === */}
      <div className="catalog-page__header">
        <h1>📋 Каталог услуг и специалистов</h1>
        <p className="catalog-page__subtitle">
          {services.length} услуг • {specialists.length} мастеров • салон «Здоровье и красота»
        </p>
      </div>

      {/* === ПЕРЕКЛЮЧАТЕЛЬ РЕЖИМОВ === */}
      <div className="catalog-page__modes">
        <button
          type="button"
          className={`catalog-page__mode ${viewMode === 'services' ? 'catalog-page__mode--active' : ''}`}
          onClick={() => setViewMode('services')}
        >
          <Scissors size={18} />
          Услуги
          <Badge variant="default" size="sm">{services.length}</Badge>
        </button>

        <button
          type="button"
          className={`catalog-page__mode ${viewMode === 'specialists' ? 'catalog-page__mode--active' : ''}`}
          onClick={() => setViewMode('specialists')}
        >
          <Users size={18} />
          Специалисты
          <Badge variant="default" size="sm">{specialists.length}</Badge>
        </button>

        <button
          type="button"
          className={`catalog-page__mode ${viewMode === 'favorites' ? 'catalog-page__mode--active' : ''}`}
          onClick={() => setViewMode('favorites')}
        >
          <Heart size={18} />
          Избранное
          <Badge variant="default" size="sm">{favorites.length}</Badge>
        </button>
      </div>

      {/* === ПАНЕЛЬ ПОИСКА И ФИЛЬТРОВ (для услуг и мастеров) === */}
      {viewMode !== 'favorites' && (
        <>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={
              viewMode === 'services'
                ? 'Поиск по названию услуги...'
                : 'Поиск по имени мастера...'
            }
          />

          <div className="catalog-page__controls">
            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              activeCount={activeFiltersCount}
              viewMode={viewMode}
            />
            <SortPanel value={sortBy} onChange={setSortBy} viewMode={viewMode} />
          </div>
        </>
      )}

      {/* === РЕЖИМ: УСЛУГИ === */}
      {viewMode === 'services' && (
        <section className="catalog-page__section">
          <div className="catalog-page__section-header">
            <h2>Услуги ({filteredAndSortedServices.length})</h2>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                Сбросить фильтры
              </Button>
            )}
          </div>

          {filteredAndSortedServices.length === 0 ? (
            <EmptyState
              title="Услуги не найдены"
              description="Попробуйте изменить параметры поиска или выбрать другую категорию"
              actionLabel="Сбросить фильтры"
              onAction={handleResetFilters}
              variant="info"
            />
          ) : (
            <div className="catalog-page__grid">
              {filteredAndSortedServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isFavorite={favorites.includes(service.id)}
                  onToggleFavorite={() => toggleFavorite(service.id)}
                  onBook={() => handleBookService(service.id)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* === РЕЖИМ: МАСТЕРА === */}
      {viewMode === 'specialists' && (
        <section className="catalog-page__section">
          <div className="catalog-page__section-header">
            <h2>Специалисты ({filteredAndSortedSpecialists.length})</h2>
          </div>

          {filteredAndSortedSpecialists.length === 0 ? (
            <EmptyState
              title="Специалисты не найдены"
              description="Попробуйте изменить параметры поиска"
              actionLabel="Сбросить фильтры"
              onAction={handleResetFilters}
              variant="info"
            />
          ) : (
            <div className="catalog-page__grid catalog-page__grid--specialists">
              {filteredAndSortedSpecialists.map((specialist) => (
                <SpecialistCard
                  key={specialist.id}
                  specialist={specialist}
                  services={services}
                  isFavorite={favorites.includes(specialist.id)}
                  onToggleFavorite={() => toggleFavorite(specialist.id)}
                  onBook={() => handleBookSpecialist(specialist.id)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* === РЕЖИМ: ИЗБРАННОЕ === */}
      {viewMode === 'favorites' && (
        <FavoritesList
          services={favoriteServices}
          specialists={favoriteSpecialists}
          onToggleFavorite={toggleFavorite}
          onBookService={handleBookService}
          onBookSpecialist={handleBookSpecialist}
        />
      )}
    </div>
  );
}