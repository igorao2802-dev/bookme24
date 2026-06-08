/**
 * App.jsx — ДИРИЖЁР приложения (Single Source of Truth)
 * 
 * ПОЧЕМУ App — владелец глобального состояния?
 * Согласно принципу Lifting State Up (подъём состояния),
 * данные, нужные нескольким компонентам, хранятся у их общего родителя.
 * App.jsx — самый верхний компонент, поэтому он "владеет правдой".
 * 
 * Архитектурные роли:
 * - Данные текут ВНИЗ через props (приказы)
 * - События текут ВВЕРХ через callbacks (отчёты)
 * 
 * 🔥 ЭТАП 5.1: Добавлен маршрут /profile для Личного кабинета
 * 🔥 ЭТАП 5.2: Передача onNewBooking в ProfilePage
 * 🔥 ЭТАП 5.3: Передача onCancelBooking в ProfilePage
 * 🔥 ЭТАП 5.5: Передача onRoleChange для выхода из аккаунта
 * 🔥 ЭТАП 6.1: Интеграция ThemeProvider для переключения тем
 * 🔥 ЭТАП 6.3: Интеграция хуков useServices и useSpecialists для CRUD
 * 🔥 ЭТАП 7.1: Интеграция LanguageProvider для локализации
 * 🔥 ИСПРАВЛЕНО: Опечатки onUpdateBooking, onUpdateSpecialist
 */

import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// === ПРОВАЙДЕРЫ КОНТЕКСТА ===
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

// === КОМПОНЕНТЫ СТРАНИЦ ===
import Layout from './components/Layout/Layout';
import BookingWizard from './components/Booking/BookingWizard';
import CatalogPage from './components/Catalog/CatalogPage';
import AdminDashboard from './components/Admin/AdminDashboard';
import ProfilePage from './components/Profile/ProfilePage';

// === ХУКИ ===
import { useBookings } from './hooks/useBookings';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useServices } from './hooks/useServices';
import { useSpecialists } from './hooks/useSpecialists';

// === КОНСТАНТЫ ===
import { STORAGE_KEYS, USER_ROLES } from './utils/constants';

/**
 * AppContent — внутренний компонент с бизнес-логикой и роутингом
 * 
 * ПОЧЕМУ отдельный компонент?
 * - useNavigate() требует, чтобы BrowserRouter был выше в дереве
 * - Провайдеры (ThemeProvider, LanguageProvider) оборачивают всё приложение
 * - Разделение упрощает тестирование и избегает вложенных хуков
 */
function AppContent() {
  const navigate = useNavigate();

  // === ЗАГРУЗКА ДАННЫХ ИЗ JSON ===
  const [jsonServices, setJsonServices] = useState([]);
  const [jsonSpecialists, setJsonSpecialists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // ПОЧЕМУ Promise.all? Параллельная загрузка ускоряет старт в ~2 раза
        const [servicesResponse, specialistsResponse] = await Promise.all([
          fetch('/data/services.json'),
          fetch('/data/specialists.json'),
        ]);

        const servicesData = await servicesResponse.json();
        const specialistsData = await specialistsResponse.json();

        setJsonServices(servicesData.services);
        setJsonSpecialists(specialistsData.specialists);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // === 🔥 ХУКИ ДЛЯ CRUD УСЛУГ И СПЕЦИАЛИСТОВ (ЭТАП 6.3) ===
  const {
    services,
    addService,
    updateService,
    deleteService,
  } = useServices(jsonServices);

  const {
    specialists,
    addSpecialist,
    updateSpecialist,
    deleteSpecialist,
  } = useSpecialists(jsonSpecialists);

  // === ГЛАВНЫЙ ХУК — CRUD ЗАПИСЕЙ ===
  const {
    bookings,
    stats,
    createBooking,
    updateBooking,
    cancelBooking,
  } = useBookings(services, specialists);

  const [userRole, setUserRole] = useLocalStorage(
    STORAGE_KEYS.USER_ROLE,
    USER_ROLES.CLIENT
  );

  // === СОСТОЯНИЕ ЗАГРУЗКИ ===
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <p>Загрузка данных салона...</p>
      </div>
    );
  }

  return (
    <Layout userRole={userRole} onRoleChange={setUserRole}>
      <Routes>
        {/* === ГЛАВНАЯ: МНОГОШАГОВАЯ ЗАПИСЬ === */}
        <Route
          path="/"
          element={
            <BookingWizard
              services={services}
              specialists={specialists}
              bookings={bookings}
              onCreateBooking={createBooking}
            />
          }
        />

        {/* === КАТАЛОГ === */}
        <Route
          path="/catalog"
          element={
            <CatalogPage services={services} specialists={specialists} />
          }
        />

        {/* === АДМИН-ПАНЕЛЬ === */}
        <Route
          path="/admin"
          element={
            userRole === USER_ROLES.ADMIN ? (
              <AdminDashboard
                bookings={bookings}
                services={services}
                specialists={specialists}
                stats={stats}
                onUpdateBooking={updateBooking}
                onCancelBooking={cancelBooking}
                // 🔥 ЭТАП 6.3: CRUD для услуг
                onAddService={addService}
                onUpdateService={updateService}
                onDeleteService={deleteService}
                // 🔥 ЭТАП 6.3: CRUD для специалистов
                onAddSpecialist={addSpecialist}
                onUpdateSpecialist={updateSpecialist}
                onDeleteSpecialist={deleteSpecialist}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* === 🔥 ЛИЧНЫЙ КАБИНЕТ (ЭТАП 5.1 + 5.2 + 5.3 + 5.5) === */}
        <Route
          path="/profile"
          element={
            userRole === USER_ROLES.CLIENT ? (
              <ProfilePage
                userRole={userRole}
                bookings={bookings}
                services={services}
                specialists={specialists}
                onNewBooking={() => navigate('/')}
                onCancelBooking={cancelBooking}
                onRoleChange={setUserRole}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* === 404: ЛЮБОЙ ДРУГОЙ МАРШРУТ === */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

/**
 * App — главный компонент с провайдерами контекста
 * 
 * ПОЧЕМУ именно такой порядок провайдеров?
 * 1. ThemeProvider — самый внешний (тема применяется ко всему)
 * 2. LanguageProvider — внутри темы (локализация зависит от темы)
 * 3. AppContent — самый внутренний (бизнес-логика и роутинг)
 * 
 * ПОЧЕМУ BrowserRouter не здесь?
 * - BrowserRouter должен быть в index.js или main.jsx
 * - Это позволяет использовать useNavigate внутри AppContent
 */
export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}