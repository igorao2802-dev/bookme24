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
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Layout from './components/Layout/Layout';
import BookingWizard from './components/Booking/BookingWizard';
import CatalogPage from './components/Catalog/CatalogPage';
import AdminDashboard from './components/Admin/AdminDashboard';

import { useBookings } from './hooks/useBookings';
import { useLocalStorage } from './hooks/useLocalStorage';
import { STORAGE_KEYS, USER_ROLES } from './utils/constants';

function App() {
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

        <Route
          path="/catalog"
          element={
            <CatalogPage services={services} specialists={specialists} />
          }
        />

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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;