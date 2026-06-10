/**
 * ServiceCard.jsx — карточка услуги в каталоге
 * 🔥 ЭТАП 5.2: Динамический рендеринг названия и описания в зависимости от языка
 * 🔥 ЭТАП 5.4: Полная локализация, исправлены опечатки в ключах
 */
import { Clock, Star, Heart, Calendar } from 'lucide-react';
import { SERVICE_CATEGORY_LABELS } from '../../utils/constants';
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
  // 🔥 ЭТАП 5.2: получаем и language, и t
  const { t, language } = useLanguage();

  // 🔥 ЭТАП 5.2: Динамический выбор поля с фолбэком на русский
  const displayName = language === 'en' && service.nameEn ? service.nameEn : service.name;
  const displayDescription = language === 'en' && service.descriptionEn ? service.descriptionEn : service.description;

  return (
    <article className="service-card">
      <button
        type="button"
        className={`service-card__favorite ${isFavorite ? 'service-card__favorite--active' : ''}`}
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
        {SERVICE_CATEGORY_LABELS[service.category]}
      </Badge>

      {/* 🔥 ЭТАП 5.2: Используем динамическое имя */}
      <h3 className="service-card__title">{displayName}</h3>

      {/* 🔥 ЭТАП 5.2: Используем динамическое описание */}
      <p className="service-card__description text-break">{displayDescription}</p>

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