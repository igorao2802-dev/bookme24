/**
 * FavoritesSection.jsx — раздел "Избранное" в Личном кабинете
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