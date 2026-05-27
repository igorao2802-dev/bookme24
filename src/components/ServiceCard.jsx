import { useState } from "react";

// ПОЧЕМУ? Деструктуризация сразу показывает контракт данных.
// Поля соответствуют форме записи, чтобы избежать рассинхрона интерфейса.
export default function ServiceCard({
  id, serviceName, specialist, customerName, customerPhone, 
  appointmentDateTime, duration, status, onDelete, onUpdate
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ serviceName, specialist, customerName, customerPhone, appointmentDateTime, duration });
  const [editErrors, setEditErrors] = useState({});

  // ПОЧЕМУ? Логика редактирования необходима для салона: клиент/администратор может 
  // скорректировать время, мастера или контакты ДО подтверждения. После подтверждения 
  // запись блокируется, чтобы не нарушать расписание мастеров и финансовый учёт.
  const validateEdit = () => {
    const errs = {};
    if (!editData.customerName.trim() || editData.customerName.trim().length < 3) errs.customerName = "Минимум 3 символа";
    if (!/^(17|25|29|33|44)\s\d{3}\s\d{2}\s\d{2}$/.test(editData.customerPhone)) errs.customerPhone = "Неверный формат телефона";
    if (!editData.appointmentDateTime || new Date(editData.appointmentDateTime) <= new Date()) errs.appointmentDateTime = "Выберите будущую дату";
    const d = parseInt(editData.duration, 10);
    if (isNaN(d) || d < 30 || d > 480 || d % 5 !== 0) errs.duration = "30-480 мин, шаг 5";
    return errs;
  };

  function handleSave() {
    const errs = validateEdit();
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return; }
    onUpdate(id, editData);
    setIsEditing(false);
    setEditErrors({});
  }

  const formatPhone = (phone) => phone ? `+375 (${phone.replace(/\s/g, "")})` : "Не указан";
  const formatDateTime = (dt) => dt ? new Date(dt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Не указано";
  const canEdit = status !== "Подтверждено";
  const badgeClass = status === "Подтверждено" ? "badge--confirmed" : "badge--pending";

  if (isEditing) {
    return (
      <article className="service-card service-card--editing">
        <h3 className="service-card__title">Редактирование записи</h3>
        <div className="edit-field">
          <label>Услуга</label>
          <input className="edit-input" value={editData.serviceName} onChange={e => setEditData(p => ({ ...p, serviceName: e.target.value }))} />
        </div>
        <div className="edit-field">
          <label>Специалист</label>
          <input className="edit-input" value={editData.specialist} onChange={e => setEditData(p => ({ ...p, specialist: e.target.value }))} />
        </div>
        <div className="edit-field">
          <label>ФИО</label>
          <input className={`edit-input ${editErrors.customerName ? "input--error" : ""}`} value={editData.customerName} onChange={e => setEditData(p => ({ ...p, customerName: e.target.value }))} />
          {editErrors.customerName && <span className="field-error">{editErrors.customerName}</span>}
        </div>
        <div className="edit-field">
          <label>Телефон</label>
          <input className={`edit-input ${editErrors.customerPhone ? "input--error" : ""}`} value={editData.customerPhone} onChange={e => setEditData(p => ({ ...p, customerPhone: e.target.value }))} />
          {editErrors.customerPhone && <span className="field-error">{editErrors.customerPhone}</span>}
        </div>
        <div className="edit-field">
          <label>Дата/время</label>
          <input className={`edit-input ${editErrors.appointmentDateTime ? "input--error" : ""}`} type="datetime-local" value={editData.appointmentDateTime} onChange={e => setEditData(p => ({ ...p, appointmentDateTime: e.target.value }))} />
          {editErrors.appointmentDateTime && <span className="field-error">{editErrors.appointmentDateTime}</span>}
        </div>
        <div className="edit-field">
          <label>Длительность</label>
          <input className={`edit-input ${editErrors.duration ? "input--error" : ""}`} type="number" value={editData.duration} onChange={e => setEditData(p => ({ ...p, duration: e.target.value }))} min="30" max="480" step="5" />
          {editErrors.duration && <span className="field-error">{editErrors.duration}</span>}
        </div>
        <div className="service-card__actions">
          <button onClick={handleSave} className="btn btn--save"> Сохранить</button>
          <button onClick={() => { setIsEditing(false); setEditErrors({}); }} className="btn btn--cancel"> Отмена</button>
        </div>
      </article>
    );
  }

  return (
    <article className="service-card">
      <span className={`badge ${badgeClass}`}>{status}</span>
      <h3 className="service-card__title">{serviceName}</h3>
      <div className="service-card__info">
        {specialist && <p><strong>👤 Мастер:</strong> {specialist}</p>}
        <p><strong>👤 Клиент:</strong> {customerName}</p>
        <p><strong>📞 Телефон:</strong> {formatPhone(customerPhone)}</p>
        <p><strong>📅 Запись:</strong> {formatDateTime(appointmentDateTime)}</p>
        <p><strong>⏱ Длительность:</strong> {duration} мин</p>
      </div>
      <div className="service-card__actions">
        {canEdit && <button className="btn btn--edit" onClick={() => setIsEditing(true)}>✏️ Изменить</button>}
        <button className="btn btn--delete" onClick={() => onDelete(id)}>🗑 Отменить запись</button>
      </div>
    </article>
  );
}