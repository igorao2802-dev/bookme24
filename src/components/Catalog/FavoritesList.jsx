/**
 * FavoritesList.jsx — список избранных услуг и мастеров
 *
 * ПОЧЕМУ отдельный компонент?
 * - Single Responsibility: отвечает только за отображение избранного
 * - Переиспользование: можно вставить в личный кабинет
 * - Синхронизация через localStorage (работает между вкладками)
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Получает отфильтрованные избранные элементы через props.
 * НЕ владеет состоянием favorites — оно живет в CatalogPage.
 */

import { Heart, Scissors, Users } from 'lucide-react';

import EmptyState from '../UI/EmptyState';
import ServiceCard from './ServiceCard';
import SpecialistCard from './SpecialistCard';

import './FavoritesList.css';

export default function FavoritesList({
  services,
  specialists,
  onToggleFavorite,
  onBookService,
  onBookSpecialist,
}) {
  const isEmpty = services.length === 0 && specialists.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        icon={<Heart size={48} />}
        title="В избранном пока пусто"
        description="Добавляйте услуги и специалистов в избранное, чтобы быстро находить их позже"
        variant="info"
      />
    );
  }

  return (
    <div className="favorites-list">
      {/* === ИЗБРАННЫЕ УСЛУГИ === */}
      {services.length > 0 && (
        <section className="favorites-list__section">
          <h2 className="favorites-list__title">
            <Scissors size={20} />
            Избранные услуги ({services.length})
          </h2>
          <div className="favorites-list__grid">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isFavorite={true}
                onToggleFavorite={() => onToggleFavorite(service.id)}
                onBook={() => onBookService(service.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* === ИЗБРАННЫЕ МАСТЕРА === */}
      {specialists.length > 0 && (
        <section className="favorites-list__section">
          <h2 className="favorites-list__title">
            <Users size={20} />
            Избранные специалисты ({specialists.length})
          </h2>
          <div className="favorites-list__grid favorites-list__grid--specialists">
            {specialists.map((specialist) => (
              <SpecialistCard
                key={specialist.id}
                specialist={specialist}
                services={services}
                isFavorite={true}
                onToggleFavorite={() => onToggleFavorite(specialist.id)}
                onBook={() => onBookSpecialist(specialist.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}