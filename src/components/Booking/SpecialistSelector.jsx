/**
 * SpecialistSelector.jsx — Шаг 2: выбор специалиста
 *
 * ОСОБЕННОСТЬ:
 * Показывает ТОЛЬКО тех мастеров, которые оказывают выбранную услугу.
 * Это критично — клиент не должен видеть мастеров, которые не работают с этой услугой.
 */

import { useMemo } from 'react';
import { Award, Star, Check } from 'lucide-react';

import EmptyState from '../UI/EmptyState';

import './SpecialistSelector.css';

export default function SpecialistSelector({
  specialists,
  selectedServiceId,
  selectedSpecialistId,
  onSelect,
}) {
  // === ФИЛЬТРАЦИЯ МАСТЕРОВ ПО УСЛУГЕ ===
  const availableSpecialists = useMemo(() => {
    if (!selectedServiceId) return [];
    return specialists.filter((spec) =>
      spec.serviceIds.includes(selectedServiceId)
    );
  }, [specialists, selectedServiceId]);

  if (availableSpecialists.length === 0) {
    return (
      <EmptyState
        title="Нет доступных специалистов"
        description="К сожалению, на эту услугу сейчас нет свободных мастеров"
        variant="info"
      />
    );
  }

  return (
    <div className="specialist-selector">
      <div className="specialist-selector__header">
        <h2>Выберите специалиста</h2>
        <p className="specialist-selector__description">
          Доступно мастеров: {availableSpecialists.length}
        </p>
      </div>

      <div className="specialist-selector__grid">
        {availableSpecialists.map((specialist) => {
          const isSelected = selectedSpecialistId === specialist.id;
          return (
            <article
              key={specialist.id}
              className={`specialist-card ${
                isSelected ? 'specialist-card--selected' : ''
              }`}
              onClick={() => onSelect(specialist.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(specialist.id);
                }
              }}
            >
              {isSelected && (
                <div className="specialist-card__check">
                  <Check size={20} />
                </div>
              )}

              <div className="specialist-card__avatar">
                {specialist.fullName.split(' ').map((n) => n[0]).join('')}
              </div>

              <h3 className="specialist-card__name">{specialist.fullName}</h3>
              <p className="specialist-card__position">{specialist.position}</p>

              <div className="specialist-card__meta">
                <span className="specialist-card__meta-item">
                  <Award size={14} />
                  Стаж {specialist.experience} лет
                </span>
                <span className="specialist-card__meta-item">
                  <Star size={14} />
                  {specialist.rating}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}