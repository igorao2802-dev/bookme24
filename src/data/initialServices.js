/**
 * Начальный каталог услуг салона «Здоровье и красота»
 *
 * ПОЧЕМУ вынесено в отдельный файл?
 * - Единый источник истины для услуг (используется во вкладках 1, 2, 3)
 * - Легко расширять и поддерживать
 * - На следующем этапе будет заменено на загрузку из API / PostgreSQL
 *
 * ПОЧЕМУ массив, а не объект?
 * - Удобно фильтровать (.filter), сортировать (.sort), искать (.find)
 * - Рендер через .map() с уникальным key
 */

import { SERVICE_CATEGORIES } from "../utils/constants.js";

export const INITIAL_SERVICES = [
  // === ПАРикмахерские услуги ===
  {
    id: "svc_hair_01",
    name: "Женская стрижка",
    category: SERVICE_CATEGORIES.HAIR,
    description:
      "Профессиональная стрижка с мытьём головы и укладкой. Подбор формы под тип лица.",
    duration: 60,
    price: 45.0,
    rating: 4.8,
    image: "/images/services/haircut-women.jpg",
  },
  {
    id: "svc_hair_02",
    name: "Мужская стрижка",
    category: SERVICE_CATEGORIES.HAIR,
    description:
      "Классическая или модельная мужская стрижка с оформлением контура.",
    duration: 45,
    price: 30.0,
    rating: 4.9,
    image: "/images/services/haircut-men.jpg",
  },
  {
    id: "svc_hair_03",
    name: "Окрашивание волос",
    category: SERVICE_CATEGORIES.HAIR,
    description:
      "Однотонное окрашивание профессиональными красителями. Включает мытьё и укладку.",
    duration: 120,
    price: 95.0,
    rating: 4.7,
    image: "/images/services/coloring.jpg",
  },
  {
    id: "svc_hair_04",
    name: "Мелирование",
    category: SERVICE_CATEGORIES.HAIR,
    description:
      "Классическое или калифорнийское мелирование для создания объёма и глубины цвета.",
    duration: 150,
    price: 120.0,
    rating: 4.9,
    image: "/images/services/highlights.jpg",
  },

  // === МАНИКЮР / ПЕДИКЮР ===
  {
    id: "svc_nails_01",
    name: "Классический маникюр",
    category: SERVICE_CATEGORIES.NAILS,
    description: "Обработка кутикулы, придание формы ногтям, покрытие базой.",
    duration: 60,
    price: 35.0,
    rating: 4.6,
    image: "/images/services/manicure.jpg",
  },
  {
    id: "svc_nails_02",
    name: "Маникюр с гель-лаком",
    category: SERVICE_CATEGORIES.NAILS,
    description:
      "Комбинированный маникюр с покрытием стойким гель-лаком (до 3 недель).",
    duration: 90,
    price: 55.0,
    rating: 4.9,
    image: "/images/services/gel-polish.jpg",
  },
  {
    id: "svc_nails_03",
    name: "Педикюр аппаратный",
    category: SERVICE_CATEGORIES.NAILS,
    description: "Аппаратная обработка стоп и ногтей, покрытие по желанию.",
    duration: 75,
    price: 60.0,
    rating: 4.8,
    image: "/images/services/pedicure.jpg",
  },

  // === МАССАЖ ===
  {
    id: "svc_massage_01",
    name: "Массаж классический (спина)",
    category: SERVICE_CATEGORIES.MASSAGE,
    description: "Расслабляющий массаж спины и шейно-воротниковой зоны.",
    duration: 45,
    price: 50.0,
    rating: 4.9,
    image: "/images/services/massage-back.jpg",
  },
  {
    id: "svc_massage_02",
    name: "Массаж общий (всё тело)",
    category: SERVICE_CATEGORIES.MASSAGE,
    description: "Полный расслабляющий массаж тела длительностью 1 час.",
    duration: 60,
    price: 80.0,
    rating: 5.0,
    image: "/images/services/massage-full.jpg",
  },

  // === КОСМЕТОЛОГИЯ ===
  {
    id: "svc_cosm_01",
    name: "Чистка лица комбинированная",
    category: SERVICE_CATEGORIES.COSMETOLOGY,
    description: "Механическая и ультразвуковая чистка с маской по типу кожи.",
    duration: 90,
    price: 75.0,
    rating: 4.8,
    image: "/images/services/facial-cleaning.jpg",
  },
  {
    id: "svc_cosm_02",
    name: "Пилинг химический",
    category: SERVICE_CATEGORIES.COSMETOLOGY,
    description:
      "Поверхностный пилинг для обновления кожи и улучшения цвета лица.",
    duration: 45,
    price: 65.0,
    rating: 4.7,
    image: "/images/services/peeling.jpg",
  },

  // === SPA-ПРОЦЕДУРЫ ===
  {
    id: "svc_spa_01",
    name: "SPA-обёртывание шоколадное",
    category: SERVICE_CATEGORIES.SPA,
    description:
      "Тонизирующее обёртывание с натуральным шоколадом. Улучшает тонус кожи.",
    duration: 90,
    price: 85.0,
    rating: 4.9,
    image: "/images/services/spa-chocolate.jpg",
  },
  {
    id: "svc_spa_02",
    name: "Стоун-терапия",
    category: SERVICE_CATEGORIES.SPA,
    description:
      "Массаж горячими вулканическими камнями для глубокого расслабления.",
    duration: 75,
    price: 90.0,
    rating: 5.0,
    image: "/images/services/spa-stones.jpg",
  },
];
