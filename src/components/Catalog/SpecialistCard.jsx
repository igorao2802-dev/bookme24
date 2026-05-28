/**
 * SpecialistCard.jsx — карточка специалиста
 *
 * ОСОБЕННОСТЬ:
 * Показывает услуги, которые оказывает мастер (тегами).
 * Это помогает клиенту понять специализацию мастера.
 */

import { Award, Star, Heart, Calendar } from 'lucide-react';

import Button from '../UI/Button';
import Badge from '../UI/Badge';

import './SpecialistCard.css';

export default function SpecialistCard({
  specialist,
  services,
  isFavorite,
  onToggleFavorite,
  onBook,
}) {
  // === ПОЛУЧАЕМ УСЛУГИ МАСТЕРА ===
  const specialistServices = services.filter((s) =>
    specialist.serviceIds.includes(s.id)
  );

  // === ИНИЦИАЛЫ ДЛЯ АВАТАРА ===
  // ПОЧЕМУ генерируем из имени? Фото мастеров могут отсутствовать,
  // инициалы — это graceful fallback
  const initials = specialist.fullName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="specialist-card">
      {/* === КНОПКА ИЗБРАННОГО === */}
      <button
        type="button"
        className={`specialist-card__favorite ${isFavorite ? 'specialist-card__favorite--active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
      >
        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      {/* === АВАТАР === */}
      <div className="specialist-card__avatar">{initials}</div>

      {/* === ИМЯ И ДОЛЖНОСТЬ === */}
      <h3 className="specialist-card__name">{specialist.fullName}</h3>
      <p className="specialist-card__position">{specialist.position}</p>

      {/* === МЕТА-ИНФОРМАЦИЯ === */}
      <div className="specialist-card__meta">
        <span className="specialist-card__meta-item">
          <Award size={14} />
          Стаж {specialist.experience} лет
        </span>
        <span className="specialist-card__meta-item">
          <Star size={14} className="specialist-card__star" />
          {specialist.rating}
        </span>
      </div>

      {/* === УСЛУГИ МАСТЕРА (тегами) === */}
      <div className="specialist-card__services">
        {specialistServices.slice(0, 3).map((service) => (
          <Badge key={service.id} variant="default" size="sm">
            {service.name}
          </Badge>
        ))}
        {specialistServices.length > 3 && (
          <Badge variant="default" size="sm">
            +{specialistServices.length - 3}
          </Badge>
        )}
      </div>

      {/* === КНОПКА ЗАПИСИ === */}
      <Button
        variant="primary"
        fullWidth
        leftIcon={<Calendar size={16} />}
        onClick={onBook}
        className="specialist-card__book-btn"
      >
        Записаться
      </Button>
    </article>
  );
}