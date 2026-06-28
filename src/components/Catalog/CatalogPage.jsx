/**
 * CatalogPage.jsx — Вкладка №2: Каталог услуг и специалистов
 * 
 * 🔥 ЭТАП 3.1: Добавлена фильтрация по цене "от" и "до"
 * 🔥 ЭТАП 7.5: Полная локализация всех пользовательских текстов
 * 🔥 ИСПРАВЛЕНО: Опечатки (service.price, localeCompare, viewMode, onBookSpecialist, resetFilters)
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
import { useLanguage } from '../../hooks/useLanguage'; // 🔥 ЭТАП 7.5

// === КОНСТАНТЫ ===
import { STORAGE_KEYS, BOOKING_STEPS } from '../../utils/constants';
import './CatalogPage.css';

// === НАЧАЛЬНЫЕ ФИЛЬТРЫ ===
// 🔥 ЭТАП 3.1: minPrice явно установлен в 0
const INITIAL_FILTERS = {
  category: 'all',
  minPrice: 0,
  maxPrice: 500,
  minRating: 0,
};

export default function CatalogPage({ services, specialists }) {
  const navigate = useNavigate();
  const { t } = useLanguage(); // 🔥 ЭТАП 7.5

  // === РЕЖИМ ОТОБРАЖЕНИЯ ===
  const [viewMode, setViewMode] = useState('services');

  // === ПОИСК С DEBOUNCE ===
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  // === ФИЛЬТРЫ ===
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  // === СОРТИРОВКА ===
  const [sortBy, setSortBy] = useState('popular');

  // === ИЗБРАННОЕ ===
  const [favorites, setFavorites] = useLocalStorage(STORAGE_KEYS.FAVORITES, []);

  // === ОБНОВЛЕНИЕ ФИЛЬТРОВ ===
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  // === СБРОС ФИЛЬТРОВ ===
  // 🔥 ЭТАП 3.1: Сброс возвращает minPrice к 0, так как используется INITIAL_FILTERS
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
  const handleBookService = (serviceId) => {
    navigate('/', {
      state: {
        preselectedServiceId: serviceId,
        startStep: BOOKING_STEPS.SPECIALIST,
      },
    });
  };

  const handleBookSpecialist = (specialistId) => {
    navigate('/', {
      state: {
        preselectedSpecialistId: specialistId,
        startStep: BOOKING_STEPS.SERVICE, // Начинаем с выбора услуги этого мастера
      },
    });
  };

 // === 🔥 ФИЛЬТРАЦИЯ И СОРТИРОВКА УСЛУГ ===
const filteredAndSortedServices = useMemo(() => {
  let result = services.filter((service) => {
    const matchesSearch =
      !debouncedQuery ||
      service.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(debouncedQuery.toLowerCase());

    const matchesCategory =
      filters.category === 'all' || service.category === filters.category;

    // 🔥 ИСПРАВЛЕНО: Проверка на undefined перед сравнением цены
    const matchesPrice =
      service.price !== undefined &&
      service.price !== null &&
      service.price >= filters.minPrice &&
      service.price <= filters.maxPrice;

    // 🔥 ИСПРАВЛЕНО: Если rating отсутствует — считаем как 0 (показывается всегда)
    const serviceRating = service.rating ?? 0;
    const matchesRating = serviceRating >= filters.minRating;

    return matchesSearch && matchesCategory && matchesPrice && matchesRating;
  });

  result = [...result].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name, 'ru');
      case 'rating':
        return (b.rating ?? 0) - (a.rating ?? 0);
      case 'popular':
      default:
        return (b.rating ?? 0) - (a.rating ?? 0);
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

  // === КОЛИЧЕСТВО АКТИВНЫХ ФИЛЬТРОВ ===
  // 🔥 ЭТАП 3.1: minPrice считается активным, если он не равен 0
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
        <h1>{t('catalog.title')}</h1>
        <p className="catalog-page__subtitle">
          {t('catalog.subtitle', {
            services: services.length,
            specialists: specialists.length,
          })}
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
          {t('catalog.tabs.services')}
          <Badge variant="default" size="sm">{services.length}</Badge>
        </button>

        <button
          type="button"
          className={`catalog-page__mode ${viewMode === 'specialists' ? 'catalog-page__mode--active' : ''}`}
          onClick={() => setViewMode('specialists')}
        >
          <Users size={18} />
          {t('catalog.tabs.specialists')}
          <Badge variant="default" size="sm">{specialists.length}</Badge>
        </button>

        <button
          type="button"
          className={`catalog-page__mode ${viewMode === 'favorites' ? 'catalog-page__mode--active' : ''}`}
          onClick={() => setViewMode('favorites')}
        >
          <Heart size={18} />
          {t('catalog.tabs.favorites')}
          <Badge variant="default" size="sm">{favorites.length}</Badge>
        </button>
      </div>

      {/* === ПАНЕЛЬ ПОИСКА И ФИЛЬТРОВ === */}
      {viewMode !== 'favorites' && (
        <>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={
              viewMode === 'services'
                ? t('catalog.search.service')
                : t('catalog.search.specialist')
            }
          />

          <div className="catalog-page__controls">
           <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              activeCount={activeFiltersCount}
              viewMode={viewMode}
              services={services}  
            />
            <SortPanel value={sortBy} onChange={setSortBy} viewMode={viewMode} />
          </div>
        </>
      )}

      {/* === РЕЖИМ: УСЛУГИ === */}
      {viewMode === 'services' && (
        <section className="catalog-page__section">
          <div className="catalog-page__section-header">
            <h2>
              {t('catalog.tabs.services')} ({filteredAndSortedServices.length})
            </h2>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                {t('catalog.buttons.resetFilters')}
              </Button>
            )}
          </div>

          {filteredAndSortedServices.length === 0 ? (
            <EmptyState
              title={t('catalog.empty.services')}
              description={t('catalog.empty.servicesDescription')}
              actionLabel={t('catalog.buttons.resetFilters')}
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
            <h2>
              {t('catalog.tabs.specialists')} ({filteredAndSortedSpecialists.length})
            </h2>
          </div>

          {filteredAndSortedSpecialists.length === 0 ? (
            <EmptyState
              title={t('catalog.empty.specialists')}
              description={t('catalog.empty.specialistsDescription')}
              actionLabel={t('catalog.buttons.resetFilters')}
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