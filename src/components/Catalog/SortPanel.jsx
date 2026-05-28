/**
 * SortPanel.jsx — выпадающий список сортировки
 *
 * ПОЧЕМУ select, а не кнопки?
 * Вариантов сортировки много (5+), кнопки заняли бы слишком много места.
 * Select компактнее и привычнее для пользователя.
 */

import { ArrowUpDown } from 'lucide-react';
import './SortPanel.css';

export default function SortPanel({ value, onChange, viewMode = 'services' }) {
  // === ОПЦИИ СОРТИРОВКИ ЗАВИСЯТ ОТ РЕЖИМА ===
  const options =
    viewMode === 'services'
      ? [
          { value: 'popular', label: 'По популярности' },
          { value: 'price-asc', label: 'Цена: по возрастанию' },
          { value: 'price-desc', label: 'Цена: по убыванию' },
          { value: 'rating', label: 'По рейтингу' },
          { value: 'name', label: 'По алфавиту' },
        ]
      : [
          { value: 'popular', label: 'По популярности' },
          { value: 'rating', label: 'По рейтингу' },
          { value: 'experience', label: 'По стажу' },
          { value: 'name', label: 'По имени' },
        ];

  return (
    <div className="sort-panel">
      <label htmlFor="sort-select" className="sort-panel__label">
        <ArrowUpDown size={16} />
        Сортировка
      </label>

      <select
        id="sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sort-panel__select"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}