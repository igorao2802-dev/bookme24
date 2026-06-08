/**
 * FavoritesSection.jsx — раздел "Избранное" в Личном кабинете
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Обёртка над FavoritesList из каталога. Добавляет:
 * - Заголовок секции с счётчиком
 * - EmptyState, если избранное пустое
 * - Контекст личного кабинета (отличается от каталога)
 * 
 * ПОЧЕМУ отдельный компонент, а не直接使用 FavoritesList?
 * - В каталоге FavoritesList — это режим отображения (вместе с услугами и мастерами)
 * - В личном кабинете — это отдельная секция среди других (профиль, статистика, записи)
 * - Разный UX: в кабинете нужен заголовок секции и своё EmptyState
 * 
 * 🔥 ЭТАП 5.4: Реализация раздела избранного в личном кабинете
 * 🔥 ЭТАП 7.7: Локализация всех текстов
 */

import { Heart } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage'; // 🔥 ЭТАП 7.7
import FavoritesList from '../Catalog/FavoritesList';
import EmptyState from '../UI/EmptyState';
import './FavoritesSection.css';

export default function FavoritesSection({
  services,
  specialists,
  favorites,
  onToggleFavorite,
  onBookService,
  onBookSpecialist,
}) {
  const { t } = useLanguage(); // 🔥 ЭТАП 7.7

  // === ФИЛЬТРАЦИЯ ИЗБРАННЫХ ЭЛЕМЕНТОВ ===
  const favoriteServices = services.filter((s) => favorites.includes(s.id));
  const favoriteSpecialists = specialists.filter((s) => favorites.includes(s.id));

  const isEmpty = favoriteServices.length === 0 && favoriteSpecialists.length === 0;
  const totalCount = favoriteServices.length + favoriteSpecialists.length;

  // === ПУСТОЕ СОСТОЯНИЕ ===
  if (isEmpty) {
    return (
      <section className="favorites-section">
        <h2 className="favorites-section__title">
          <Heart size={24} />
          {t('profile.sections.favorites')} {/* 🔥 ЭТАП 7.7 */}
        </h2>
        <EmptyState
          icon={<Heart size={48} />}
          title={t('catalog.favorites.empty')} {/* 🔥 ЭТАП 7.7 */}
          description={t('catalog.favorites.emptyDescription')} {/* 🔥 ЭТАП 7.7 */}
          variant="info"
        />
      </section>
    );
  }

  // === ЗАПОЛНЕННОЕ СОСТОЯНИЕ ===
  return (
    <section className="favorites-section">
      <h2 className="favorites-section__title">
        <Heart size={24} />
        {t('profile.sections.favorites')} {/* 🔥 ЭТАП 7.7 */}
        <span className="favorites-section__count">
          ({totalCount})
        </span>
      </h2>
      <FavoritesList
        services={favoriteServices}
        specialists={favoriteSpecialists}
        onToggleFavorite={onToggleFavorite}
        onBookService={onBookService}
        onBookSpecialist={onBookSpecialist}
      />
    </section>
  );
}