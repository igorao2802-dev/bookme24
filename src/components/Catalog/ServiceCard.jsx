/**
 * ServiceCard.jsx — карточка услуги в каталоге
 * 
 * ПОЧЕМУ презентационный компонент?
 * Замечание В.В. из лекции React-1-1: "Хороший компонент делает одно дело."
 * Этот компонент только отображает услугу и вызывает callbacks при кликах.
 * Он НЕ знает, как работает избранное или запись — это забота родителя.
 * 
 * 🔥 ЭТАП 5.2: Динамический рендеринг названия и описания в зависимости от языка
 * 🔥 ЭТАП 7.4: Полная локализация, включая категории
 */

import { Clock, Star, Heart, Calendar } from 'lucide-react';
import { formatPrice, formatDuration } from '../../utils/formatters';
import { useLanguage } from '../../hooks/useLanguage';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import './ServiceCard.css';

export default function ServiceCard({
  service,
  isFavorite,
  onToggleFavorite,
  onBook,
}) {
  const { t, language } = useLanguage();

  // 🔥 ЭТАП 5.2: Динамический выбор поля в зависимости от языка
  const displayName = language === 'en' && service.nameEn 
    ? service.nameEn 
    : service.name;
  
  const displayDescription = language === 'en' && service.descriptionEn 
    ? service.descriptionEn 
    : service.description;

  return (
    <article className="service-card">
      <button
        type="button"
        className={`service-card__favorite ${
          isFavorite ? 'service-card__favorite--active' : ''
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        aria-label={
          isFavorite
            ? t('catalog.buttons.removeFromFavorites')
            : t('catalog.buttons.addToFavorites')
        }
      >
        <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      <Badge variant="default" size="sm">
        {/* 🔥 ЭТАП 7.4: Локализованная категория */}
        {t(`catalog.categories.${service.category}`)}
      </Badge>

      <h3 className="service-card__title">{displayName}</h3>

      <p className="service-card__description text-break">
        {displayDescription}
      </p>

      <div className="service-card__meta">
        <span className="service-card__meta-item">
          <Clock size={14} />
          {formatDuration(service.duration)}
        </span>
        <span className="service-card__meta-item">
          <Star size={14} className="service-card__star" />
          {service.rating}
        </span>
      </div>

      <div className="service-card__footer">
        <div className="service-card__price">{formatPrice(service.price)}</div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Calendar size={16} />}
          onClick={onBook}
        >
          {t('catalog.buttons.book')}
        </Button>
      </div>
    </article>
  );
}