import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import BookingForm from "./components/BookingForm";
import ServiceCard from "./components/ServiceCard";

const STORAGE_KEY = "salon-bookings-v1";

const INITIAL_ITEMS = [
  {
    id: 1,
    serviceName: "Стрижка женская",
    specialist: "Анна Михайлова",
    customerName: "Иванова Мария",
    customerPhone: "29 111 22 33",
    appointmentDateTime: "2026-05-10T14:00",
    duration: 60,
    status: "Ожидание",
  },
  {
    id: 2,
    serviceName: "Массаж расслабляющий",
    specialist: "Иван Сидоров",
    customerName: "Петров Алексей",
    customerPhone: "33 444 55 66",
    appointmentDateTime: "2026-05-12T10:30",
    duration: 90,
    status: "Подтверждено",
  },
  {
    id: 3,
    serviceName: "Маникюр классический",
    specialist: "Елена Петрова",
    customerName: "Сидорова Ольга",
    customerPhone: "44 777 88 99",
    appointmentDateTime: "2026-05-08T16:00",
    duration: 45,
    status: "Ожидание",
  },
];

export default function App() {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_ITEMS;
    } catch {
      return INITIAL_ITEMS;
    }
  });

  const [filterStatus, setFilterStatus] = useState("Все");
  const [sortBy, setSortBy] = useState("soonest");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Ошибка сохранения в localStorage:", e);
    }
  }, [items]);

  function handleAddItem(newItem) {
    setItems((prev) => [...prev, { ...newItem, id: Date.now() }]);
  }

  function handleDelete(id) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleUpdate(id, updatedData) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedData } : item)),
    );
  }

  const processedItems = items
    .filter((item) => filterStatus === "Все" || item.status === filterStatus)
    .sort((a, b) => {
      const dateA = new Date(a.appointmentDateTime);
      const dateB = new Date(b.appointmentDateTime);
      return sortBy === "soonest" ? dateA - dateB : dateB - dateA;
    });

  return (
    <Layout title="Салон «Здоровье и красота»">
      {/* ИЗМЕНЕНИЕ: Форма записи теперь идет первой, так как это основное действие пользователя */}
      <section className="section">
        <h2 className="section__title">📝 Новая запись</h2>
        <BookingForm onAddItem={handleAddItem} />
      </section>

      {/* ИЗМЕНЕНИЕ: Панель фильтров перенесена сюда, чтобы быть непосредственно перед списком */}
      <div className="controls-panel">
        <div className="control-group">
          <label className="control-label">🔍 Фильтр по статусу</label>
          <select
            className="control-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Все">Все записи</option>
            <option value="Ожидание">Ожидание</option>
            <option value="Подтверждено">Подтверждено</option>
          </select>
        </div>
        <div className="control-group">
          <label className="control-label">📊 Сортировка</label>
          <select
            className="control-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="soonest">Сначала ближайшие</option>
            <option value="latest">Сначала поздние</option>
          </select>
        </div>
      </div>

      <section className="section">
        <h2 className="section__title">
          {" "}
          Мои записи ({processedItems.length})
        </h2>
        {processedItems.length === 0 ? (
          <div className="empty-state">
            Записи не найдены. Измените фильтр или добавьте новую запись.
          </div>
        ) : (
          <div className="cards-grid">
            {processedItems.map((item) => (
              <ServiceCard
                key={item.id}
                {...item}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
