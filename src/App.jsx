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
 */

import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Layout from './components/Layout/Layout';
import BookingWizard from './components/Booking/BookingWizard';
import CatalogPage from './components/Catalog/CatalogPage';
import AdminDashboard from './components/Admin/AdminDashboard';
import ProfilePage from './components/Profile/ProfilePage'; // 🔥 ЭТАП 5.1

import { useBookings } from './hooks/useBookings';
import { useLocalStorage } from './hooks/useLocalStorage';
import { STORAGE_KEYS, USER_ROLES } from './utils/constants';

function App() {
  // === НАВИГАЦИЯ (для onNewBooking) ===
  // 🔥 ЭТАП 5.2: useNavigate нужен для перенаправления на главную
  // при клике "Создать запись" из Личного кабинета
  const navigate = useNavigate();

  // === ЗАГРУЗКА ДАННЫХ ИЗ JSON ===
  const [services, setServices] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Загружаем услуги
        const servicesResponse = await fetch('/data/services.json');
        const servicesData = await servicesResponse.json();
        
        // Загружаем мастеров
        const specialistsResponse = await fetch('/data/specialists.json');
        const specialistsData = await specialistsResponse.json();

        setServices(servicesData.services);
        setSpecialists(specialistsData.specialists);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* === 🔥 ЛИЧНЫЙ КАБИНЕТ (ЭТАП 5.1 + 5.2 + 5.3) === */}
        {/* 
          ПОЧЕМУ проверка роли здесь, а не только в ProfilePage?
          - Двойная защита: если пользователь вручную введёт /profile в URL,
            он будет перенаправлен на главную
          - ProfilePage тоже проверяет роль (защита в глубине)
          - Это стандартный паттерн "defence in depth" (многоуровневая защита)
        */}
        <Route
          path="/profile"
          element={
            userRole === USER_ROLES.CLIENT ? (
              <ProfilePage
                userRole={userRole}
                bookings={bookings}
                services={services}
                specialists={specialists}
                // 🔥 ЭТАП 5.2: callback для перехода к созданию записи
                onNewBooking={() => navigate('/')}
                // 🔥 ЭТАП 5.3: callback для отмены записи
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

export default App;