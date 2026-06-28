/**
 * SortPanel.jsx — выпадающий список сортировки
 * 
 *  ЭТАП 5.4: Полная локализация опций сортировки
 * 🔥 ЗАМЕЧАНИЕ №10: Используется nameShort ("A–Z") вместо name ("Alphabetically")
 *    для компактности на мобильных устройствах
 */
import { ArrowUpDown } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import './SortPanel.css';

export default function SortPanel({ value, onChange, viewMode = 'services' }) {
  const { t } = useLanguage();

  // 🔥 ЗАМЕЧАНИЕ №10: Используем nameShort ("A–Z") вместо name ("Alphabetically")
  // ПОЧЕМУ? "A–Z" короче, понятнее и помещается на любых экранах
  const options =
    viewMode === 'services'
      ? [
          { value: 'popular', label: t('catalog.sort.popular') },
          { value: 'price-asc', label: t('catalog.sort.priceAsc') },
          { value: 'price-desc', label: t('catalog.sort.priceDesc') },
          { value: 'rating', label: t('catalog.sort.rating') },
          { value: 'name', label: t('catalog.sort.nameShort') }, // 🔥 Было name, стало nameShort
        ]
      : [
          { value: 'popular', label: t('catalog.sort.popular') },
          { value: 'rating', label: t('catalog.sort.rating') },
          { value: 'experience', label: t('catalog.sort.experience') },
          { value: 'name', label: t('catalog.sort.nameShort') }, // 🔥 Было name, стало nameShort
        ];

  return (
    <div className="sort-panel">
      <label htmlFor="sort-select" className="sort-panel__label">
        <ArrowUpDown size={16} />
        {t('catalog.sort.title')}
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