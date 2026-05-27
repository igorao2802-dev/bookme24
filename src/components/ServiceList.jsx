import ServiceCard from "./ServiceCard";

// ПОЧЕМУ? Компонент отвечает только за отображение списка,
// логика фильтрации и сортировки находится в родителе
export default function ServiceList({ 
  items, 
  onDelete, 
  onUpdate, 
  sortOrder, 
  onSortChange 
}) {
  if (!items || items.length === 0) {
    return (
      <div className="service-list__empty">
        <p>📭 Список пуст. Запишитесь на первую услугу!</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '12px' 
      }}>
        <span style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
          Всего записей: {items.length}
        </span>
        <select 
          className="sort-select" 
          value={sortOrder} 
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="asc">⏱ Сначала короткие</option>
          <option value="desc">⏱ Сначала длинные</option>
        </select>
      </div>
      <div className="service-grid">
        {items.map((item) => (
          <ServiceCard 
            key={item.id} 
            {...item} 
            onDelete={onDelete} 
            onUpdate={onUpdate} 
          />
        ))}
      </div>
    </div>
  );
}