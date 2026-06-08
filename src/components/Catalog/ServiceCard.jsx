/**
 * ServiceCard.jsx — карточка услуги в каталоге
 * 
 * ПОЧЕМУ презентационный компонент?
 * Замечание В.В. из лекции React-1-1: "Хороший компонент делает одно дело."
 * Этот компонент только отображает услугу и вызывает callbacks при кликах.
 * Он НЕ знает, как работает избранное или запись — это забота родителя.
 * 
 * 🔥 ЭТАП 7.5: Локализация всех текстов
 * 🔥 ИСПРАВЛЕНО: Опечатка 'изб ранного' в aria-label
 */

import { Clock, Star, Heart, Calendar } from 'lucide-react';

import { SERVICE_CATEGORY_LABELS } from '../../utils/constants';
import { formatPrice, formatDuration } from '../../utils/formatters';
import { useLanguage } from '../../hooks/useLanguage'; // 🔥 ЭТАП 7.5

import Button from '../UI/Button';
import Badge from '../UI/Badge';

import './ServiceCard.css';

export default function ServiceCard({
  service,
  isFavorite,
  onToggleFavorite,
  onBook,
}) {
  const { t } = useLanguage(); // 🔥 ЭТАП 7.5

  return (
    <article className="service-card">
      {/* === КНОПКА ИЗБРАННОГО === */}
      <button
        type="button"
        className={`service-card__favorite ${isFavorite ? 'service-card__favorite--active' : ''}`}
        onClick={(e) => {
          // ПОЧЕМУ stopPropagation?
          // Чтобы клик по сердечку не срабатывал как клик по всей карточке
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

      {/* === КАТЕГОРИЯ === */}
      <Badge variant="default" size="sm">
        {SERVICE_CATEGORY_LABELS[service.category]}
      </Badge>

      {/* === ЗАГОЛОВОК === */}
      <h3 className="service-card__title">{service.name}</h3>

      {/* === ОПИСАНИЕ (text-break для длинных текстов — замечание из ПР-07!) === */}
      <p className="service-card__description text-break">{service.description}</p>

      {/* === МЕТА-ИНФОРМАЦИЯ === */}
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

      {/* === ЦЕНА И КНОПКА === */}
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