/**
 * Каталог специалистов салона «Здоровье и красота»
 *
 * ПОЧЕМУ workingHours как объект с ключами-днями недели?
 * - Ключ = номер дня (0 = воскресенье, 1 = понедельник, ... 6 = суббота)
 * - Позволяет быстро проверять доступность: specialist.workingHours[dayOfWeek]
 * - null означает выходной (не работаем в этот день)
 *
 * ПОЧЕМУ serviceIds, а не полные объекты услуг?
 * - Нормализация данных: нет дублирования
 * - Одна услуга может быть у нескольких мастеров
 * - Легко обновлять: поменял услугу в одном месте — обновилось везде
 */

export const INITIAL_SPECIALISTS = [
  {
    id: "spc_01",
    fullName: "Светлана Иванова",
    position: "Топ-стилист",
    experience: 12,
    rating: 4.9,
    serviceIds: ["svc_hair_01", "svc_hair_02", "svc_hair_03", "svc_hair_04"],
    image: "/images/specialists/svetlana.jpg",
    workingHours: {
      0: null, // Воскресенье — выходной
      1: { start: "09:00", end: "18:00" }, // Понедельник
      2: { start: "09:00", end: "18:00" }, // Вторник
      3: { start: "09:00", end: "18:00" }, // Среда
      4: { start: "09:00", end: "18:00" }, // Четверг
      5: { start: "09:00", end: "18:00" }, // Пятница
      6: { start: "10:00", end: "16:00" }, // Суббота
    },
  },
  {
    id: "spc_02",
    fullName: "Анна Михайлова",
    position: "Мастер маникюра и педикюра",
    experience: 8,
    rating: 4.9,
    serviceIds: ["svc_nails_01", "svc_nails_02", "svc_nails_03"],
    image: "/images/specialists/anna.jpg",
    workingHours: {
      0: null,
      1: { start: "10:00", end: "19:00" },
      2: { start: "10:00", end: "19:00" },
      3: { start: "10:00", end: "19:00" },
      4: { start: "10:00", end: "19:00" },
      5: { start: "10:00", end: "19:00" },
      6: null, // Суббота — выходной
    },
  },
  {
    id: "spc_03",
    fullName: "Дмитрий Петров",
    position: "Массажист",
    experience: 10,
    rating: 5.0,
    serviceIds: ["svc_massage_01", "svc_massage_02"],
    image: "/images/specialists/dmitry.jpg",
    workingHours: {
      0: null,
      1: { start: "11:00", end: "20:00" },
      2: { start: "11:00", end: "20:00" },
      3: { start: "11:00", end: "20:00" },
      4: { start: "11:00", end: "20:00" },
      5: { start: "11:00", end: "20:00" },
      6: { start: "11:00", end: "18:00" },
    },
  },
  {
    id: "spc_04",
    fullName: "Елена Козлова",
    position: "Косметолог-эстетист",
    experience: 7,
    rating: 4.8,
    serviceIds: ["svc_cosm_01", "svc_cosm_02"],
    image: "/images/specialists/elena.jpg",
    workingHours: {
      0: null,
      1: { start: "09:00", end: "17:00" },
      2: { start: "09:00", end: "17:00" },
      3: { start: "09:00", end: "17:00" },
      4: { start: "09:00", end: "17:00" },
      5: { start: "09:00", end: "17:00" },
      6: null,
    },
  },
  {
    id: "spc_05",
    fullName: "Ольга Сидорчук",
    position: "SPA-терапевт",
    experience: 9,
    rating: 4.9,
    serviceIds: ["svc_spa_01", "svc_spa_02", "svc_massage_02"],
    image: "/images/specialists/olga.jpg",
    workingHours: {
      0: null,
      1: null, // Понедельник — выходной
      2: { start: "10:00", end: "19:00" },
      3: { start: "10:00", end: "19:00" },
      4: { start: "10:00", end: "19:00" },
      5: { start: "10:00", end: "19:00" },
      6: { start: "10:00", end: "17:00" },
    },
  },
  {
    id: "spc_06",
    fullName: "Ирина Волкова",
    position: "Парикмахер-универсал",
    experience: 5,
    rating: 4.7,
    serviceIds: ["svc_hair_01", "svc_hair_02"],
    image: "/images/specialists/irina.jpg",
    workingHours: {
      0: null,
      1: { start: "12:00", end: "20:00" },
      2: { start: "12:00", end: "20:00" },
      3: { start: "12:00", end: "20:00" },
      4: { start: "12:00", end: "20:00" },
      5: { start: "12:00", end: "20:00" },
      6: null,
    },
  },
];
