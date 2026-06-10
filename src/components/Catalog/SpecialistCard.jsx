/**
 * SpecialistCard.jsx — карточка специалиста
 * 🔥 ЭТАП 5.2: Динамический рендеринг имени, должности и услуг в зависимости от языка
 * 🔥 ЭТАП 5.4: Полная локализация
 */
import { Award, Star, Heart, Calendar } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
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
  // 🔥 ЭТАП 5.2: получаем и language, и t
  const { t, language } = useLanguage();

  // 🔥 ЭТАП 5.2: Динамический выбор полей с фолбэком
  const displayFullName = language === 'en' && specialist.fullNameEn ? specialist.fullNameEn : specialist.fullName;
  const displayPosition = language === 'en' && specialist.positionEn ? specialist.positionEn : specialist.position;

  const specialistServices = services.filter((s) =>
    specialist.serviceIds.includes(s.id)
  );

  const initials = specialist.fullName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="specialist-card">
      <button
        type="button"
        className={`specialist-card__favorite ${isFavorite ? 'specialist-card__favorite--active' : ''}`}
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
        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      <div className="specialist-card__avatar">{initials}</div>

      {/* 🔥 ЭТАП 5.2: Динамические имя и должность */}
      <h3 className="specialist-card__name">{displayFullName}</h3>
      <p className="specialist-card__position">{displayPosition}</p>

      <div className="specialist-card__meta">
        <span className="specialist-card__meta-item">
          <Award size={14} />
          {t('catalog.specialist.experience', { years: specialist.experience })}
        </span>
        <span className="specialist-card__meta-item">
          <Star size={14} className="specialist-card__star" />
          {specialist.rating}
        </span>
      </div>

      <div className="specialist-card__services">
        {specialistServices.slice(0, 3).map((service) => (
          <Badge key={service.id} variant="default" size="sm">
            {/* 🔥 ЭТАП 5.2: Динамическое название услуги в теге */}
            {language === 'en' && service.nameEn ? service.nameEn : service.name}
          </Badge>
        ))}
        {specialistServices.length > 3 && (
          <Badge variant="default" size="sm">
            +{specialistServices.length - 3}
          </Badge>
        )}
      </div>

      <Button
        variant="primary"
        fullWidth
        leftIcon={<Calendar size={16} />}
        onClick={onBook}
        className="specialist-card__book-btn"
      >
        {t('catalog.buttons.book')}
      </Button>
    </article>
  );
}