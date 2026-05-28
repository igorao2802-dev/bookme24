/**
 * SearchBar.jsx — поле поиска с debounce
 *
 * ПОЧЕМУ debounce?
 * Замечание В.В. из ПР-08: "Когда пользователь печатает 'стрижка' в поиске,
 * мы НЕ хотим отправлять 7 запросов (с, ст, стр...). Мы хотим дождаться,
 * пока он закончит печатать."
 *
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Это "глупый" (presentational) компонент — он не владеет state.
 * Значение приходит из родителя через props.value, изменения отправляются
 * через props.onChange.
 */

import { Search, X } from 'lucide-react';
import { useRef } from 'react';
import './SearchBar.css';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Поиск...',
  className = '',
}) {
  // ПОЧЕМУ useRef для input?
  // Чтобы программно очищать поле и устанавливать фокус (UX-улучшение)
  const inputRef = useRef(null);

  const handleClear = () => {
    onChange('');
    // Возвращаем фокус на поле после очистки
    inputRef.current?.focus();
  };

  return (
    <div className={`search-bar ${className}`}>
      <div className="search-bar__wrapper">
        <Search size={18} className="search-bar__icon" aria-hidden="true" />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="search-bar__input"
          aria-label="Поиск"
        />

        {/* Кнопка очистки — показывается только при непустом поле */}
        {value && (
          <button
            type="button"
            className="search-bar__clear"
            onClick={handleClear}
            aria-label="Очистить поиск"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ПОЧЕМУ счётчик символов? Задание PRO из Starter Kit React-1-1 */}
      {value && (
        <span className="search-bar__counter">
          Введено символов: {value.length}
        </span>
      )}
    </div>
  );
}