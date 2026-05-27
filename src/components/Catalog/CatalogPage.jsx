/**
 * CatalogPage.jsx — Страница каталога услуг и специалистов (Вкладка №2)
 *
 * ⚠️ ВРЕМЕННАЯ ЗАГЛУШКА
 * Полная реализация — в следующем спринте
 */

import { SERVICE_CATEGORY_LABELS } from '../../utils/constants.js';
import { formatPrice, formatDuration } from '../../utils/formatters.js';
import './CatalogPage.css';

export default function CatalogPage({ services, specialists }) {
  return (
    <div className="catalog-page">
      <h1>📋 Каталог услуг и специалистов</h1>
      <p className="catalog-page__description">
        Выберите услугу и мастера для записи
      </p>

      {/* === БЛОК УСЛУГ === */}
      <section className="catalog-page__section">
        <h2>Наши услуги ({services.length})</h2>
        <div className="catalog-page__grid">
          {services.map(service => (
            <article key={service.id} className="catalog-page__card">
              <h3>{service.name}</h3>
              <p className="catalog-page__category">
                {SERVICE_CATEGORY_LABELS[service.category] || service.category}
              </p>
              <p className="catalog-page__description-text text-break">
                {service.description}
              </p>
              <div className="catalog-page__meta">
                <span>⏱ {formatDuration(service.duration)}</span>
                <span>⭐ {service.rating}</span>
              </div>
              <div className="catalog-page__price">
                {formatPrice(service.price)}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* === БЛОК МАСТЕРОВ === */}
      <section className="catalog-page__section">
        <h2>Наши специалисты ({specialists.length})</h2>
        <div className="catalog-page__grid">
          {specialists.map(specialist => (
            <article key={specialist.id} className="catalog-page__card">
              <h3>{specialist.fullName}</h3>
              <p className="catalog-page__category">{specialist.position}</p>
              <div className="catalog-page__meta">
                <span>👨‍💼 Стаж: {specialist.experience} лет</span>
                <span>⭐ {specialist.rating}</span>
              </div>
              <p className="catalog-page__services-count">
                Оказывает услуг: {specialist.serviceIds.length}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}