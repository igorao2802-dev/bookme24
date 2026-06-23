/**
 * FavoritesSection.jsx — раздел "Избранное" в Личном кабинете
 *
 * 🔥 ИСПРАВЛЕНО: Убран дублирующий заголовок "❤️ Избранное (0)"
 * Оставлен только один заголовок с счётчиком.
 */
import { Heart } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
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
  const { t } = useLanguage();

  const favoriteServices = services.filter((s) => favorites.includes(s.id));
  const favoriteSpecialists = specialists.filter((s) =>
    favorites.includes(s.id),
  );

  const isEmpty =
    favoriteServices.length === 0 && favoriteSpecialists.length === 0;
  const totalCount = favoriteServices.length + favoriteSpecialists.length;

  if (isEmpty) {
    return (
      <section className="favorites-section">
        {/* 🔥 Единый заголовок без дублирования */}
        <h2 className="favorites-section__title">
          <Heart size={24} />
          {t('profile.sections.favorites')}
        </h2>
        <EmptyState
          icon={<Heart size={48} />}
          title={t('catalog.favorites.empty')}
          description={t('catalog.favorites.emptyDescription')}
          variant="info"
        />
      </section>
    );
  }

  return (
    <section className="favorites-section">
      {/* 🔥 Единый заголовок с счётчиком — без дублирования */}
      <h2 className="favorites-section__title">
        <Heart size={24} />
        {t('profile.sections.favorites')}
        <span className="favorites-section__count">({totalCount})</span>
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