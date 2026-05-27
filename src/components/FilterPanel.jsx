// ПОЧЕМУ? Компонент фильтрации вынесен отдельно — 
// это позволяет переиспользовать его и упрощает тестирование
export default function FilterPanel({ activeFilter, onFilterChange }) {
  const filters = [
    "Все", 
    "Парикмахерские услуги", 
    "Ногтевой сервис", 
    "Массаж",
    "Косметология",
    "SPA-процедуры"
  ];

  return (
    <div className="filter-panel">
      {filters.map((filter) => (
        <button
          key={filter}
          className={`filter-panel__btn ${
            activeFilter === filter ? "filter-panel__btn--active" : ""
          }`}
          onClick={() => onFilterChange(filter)}
          aria-pressed={activeFilter === filter}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}