import { useState } from "react";

// ПОЧЕМУ? Управляемая форма: состояние хранится в React, 
// что позволяет мгновенно валидировать ввод, управлять прогрессом и очищать поля программно.
export default function BookingForm({ onAddItem }) {
  const [serviceName, setServiceName] = useState("");
  const [specialist, setSpecialist] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [appointmentDateTime, setAppointmentDateTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [status, setStatus] = useState("Ожидание");
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const SERVICES = [
    "Стрижка женская", "Стрижка мужская", "Укладка волос", "Окрашивание волос",
    "Маникюр классический", "Педикюр", "Массаж расслабляющий", "Массаж лечебный",
    "Чистка лица", "SPA-процедуры"
  ];

  const SPECIALISTS = [
    "Анна Михайлова", "Иван Сидоров", "Елена Петрова", "Михаил Козлов", "Ольга Смирнова"
  ];

  // ПОЧЕМУ? Валидация вынесена в отдельную функцию для переиспользования 
  const validate = (field, value) => {
    const errs = { ...errors };
    switch (field) {
      case "customerName":
        if (!value.trim() || value.trim().length < 3) errs[field] = "Минимум 3 символа (буквы, пробелы, дефис)";
        else if (!/^[a-zA-Zа-яА-ЯёЁ\s\-]+$/.test(value)) errs[field] = "Только буквы, пробелы и дефис";
        else delete errs[field];
        break;
      case "customerPhone":
        // ИЗМЕНЕНИЕ: Проверка на 9 цифр (2+3+2+2)
        if (!/^(17|25|29|33|44)\s\d{3}\s\d{2}\s\d{2}$/.test(value)) 
          errs[field] = "Формат: 29 123 45 67 (нужно 9 цифр)";
        else delete errs[field];
        break;
      case "appointmentDateTime":
        if (!value || new Date(value) <= new Date()) errs[field] = "Выберите будущую дату и время";
        else delete errs[field];
        break;
      case "duration":
        const d = parseInt(value, 10);
        if (isNaN(d) || d < 30 || d > 480 || d % 5 !== 0) errs[field] = "От 30 до 480 мин, шаг 5";
        else delete errs[field];
        break;
      default:
        break;
    }
    return errs;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(validate(field, field === "customerName" ? customerName : 
                              field === "customerPhone" ? customerPhone : 
                              field === "appointmentDateTime" ? appointmentDateTime : duration));
  };

  const handlePhoneChange = (e) => {
    // ИЗМЕНЕНИЕ: slice(0, 9) позволяет ввести 9 цифр (код оператора + 7 цифр номера)
    let digits = e.target.value.replace(/\D/g, "").slice(0, 9);
    let formatted = "";
    if (digits.length > 0) formatted = digits.slice(0, 2);
    if (digits.length > 2) formatted += " " + digits.slice(2, 5);
    if (digits.length > 5) formatted += " " + digits.slice(5, 7);
    // ИЗМЕНЕНИЕ: Добавлен блок для последних 2 цифр
    if (digits.length > 7) formatted += " " + digits.slice(7, 9);
    
    setCustomerPhone(formatted);
    setErrors(prev => {
      const next = { ...prev };
      if (/^(17|25|29|33|44)\s\d{3}\s\d{2}\s\d{2}$/.test(formatted)) delete next.customerPhone;
      else if (touched.customerPhone || isSubmitted) next.customerPhone = "Формат: 29 123 45 67";
      return next;
    });
  };

  // ПОЧЕМУ? Прогресс зависит от валидности, а не просто от заполненности.
  const isValidService = SERVICES.includes(serviceName);
  const isValidName = !errors.customerName && customerName.trim().length >= 3;
  // ИЗМЕНЕНИЕ: Валидация теперь требует полных 9 цифр
  const isValidPhone = !errors.customerPhone && /^(17|25|29|33|44)\s\d{3}\s\d{2}\s\d{2}$/.test(customerPhone);
  const isValidDate = !errors.appointmentDateTime && appointmentDateTime && new Date(appointmentDateTime) > new Date();
  
  const validCount = [isValidService, isValidName, isValidPhone, isValidDate].filter(Boolean).length;
  const progressPercent = (validCount / 4) * 100;

  function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitted(true);
    
    const newErrors = validate("customerName", customerName);
    Object.assign(newErrors, validate("customerPhone", customerPhone));
    Object.assign(newErrors, validate("appointmentDateTime", appointmentDateTime));
    Object.assign(newErrors, validate("duration", duration));
    
    if (!isValidService || Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onAddItem({
      id: Date.now(),
      serviceName,
      specialist,
      customerName: customerName.trim(),
      customerPhone,
      appointmentDateTime,
      duration: parseInt(duration, 10),
      status
    });

    setServiceName(""); setSpecialist(""); setCustomerName("");
    setCustomerPhone(""); setAppointmentDateTime(""); setDuration("30");
    setStatus("Ожидание"); setErrors({}); setTouched({}); setIsSubmitted(false);
  }

  const inputClass = (field) => `booking-form__input ${errors[field] && (touched[field] || isSubmitted) ? "input--error" : ""}`;

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <div className="progress-bar">
        <div className="progress-bar__fill" style={{ width: `${progressPercent}%` }} />
      </div>
      {Object.keys(errors).length > 0 && isSubmitted && (
        <p className="form-error">Исправьте ошибки в отмеченных полях</p>
      )}

      <div className="booking-form__field">
        <label>Услуга *</label>
        <select className={inputClass("serviceName")} value={serviceName} onChange={e => setServiceName(e.target.value)} required>
          <option value="">Выберите услугу</option>
          {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="booking-form__field">
        <label>Специалист</label>
        <select className="booking-form__input" value={specialist} onChange={e => setSpecialist(e.target.value)}>
          <option value="">Не выбран</option>
          {SPECIALISTS.map(sp => <option key={sp} value={sp}>{sp}</option>)}
        </select>
      </div>

      <div className="booking-form__field">
        <label>ФИО заказчика *</label>
        <input className={inputClass("customerName")} type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} onBlur={() => handleBlur("customerName")} placeholder="Иванов Иван Иванович" maxLength={100} required />
      </div>

      <div className="booking-form__field">
        {/* ИЗМЕНЕНИЕ: Пометка (+375) и исправленный maxLength (2+1+3+1+2+1+2 = 12 символов с пробелами) */}
        <label>Телефон * (+375)</label>
        <input className={inputClass("customerPhone")} type="text" value={customerPhone} onChange={handlePhoneChange} onBlur={() => handleBlur("customerPhone")} placeholder="29 123 45 67" maxLength={12} required />
      </div>

      <div className="booking-form__field">
        <label>Дата и время *</label>
        <input className={inputClass("appointmentDateTime")} type="datetime-local" value={appointmentDateTime} onChange={e => setAppointmentDateTime(e.target.value)} onBlur={() => handleBlur("appointmentDateTime")} min={new Date().toISOString().slice(0, 16)} required />
      </div>

      <div className="booking-form__field">
        <label>Длительность (мин)</label>
        <input className={inputClass("duration")} type="number" value={duration} onChange={e => { setDuration(e.target.value); handleBlur("duration"); }} min="30" max="480" step="5" required />
      </div>

      <div className="booking-form__field">
        <label>Статус</label>
        <select className="booking-form__input" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="Ожидание">Ожидание</option>
          <option value="Подтверждено">Подтверждено</option>
        </select>
      </div>

      <button type="submit" className="booking-form__submit">
        {/* ИЗМЕНЕНИЕ: Класс btn-icon вынесен для стилизации цвета */}
        <span className="btn-icon">➕</span> Записаться
      </button>
    </form>
  );
}