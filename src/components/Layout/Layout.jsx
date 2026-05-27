/**
 * Layout.jsx — Компонент-обёртка (паттерн Wrapper Component)
 *
 * ПОЧЕМУ используется children, а не конкретные компоненты внутри?
 * - Механизм children — это основа композиции в React
 * - Layout задаёт каркас (шапка + контент + подвал), а содержимое вставляется снаружи
 * - Избавляет от копипаста Header/Footer на каждой странице
 * - Замечание В.В. из лекции React-1-2: "Composition over Inheritance"
 */

import { Link, useLocation } from 'react-router-dom';
import { USER_ROLES, BOOKING_STATUS_LABELS } from '../../utils/constants.js';
import './Layout.css';

export default function Layout({ children, userRole, onRoleChange }) {
  const location = useLocation();

  // ПОЧЕМУ массив для меню? Легко расширять и рендерить через .map()
  const menuItems = [
    { path: '/', label: '📝 Запись', roles: [USER_ROLES.CLIENT, USER_ROLES.ADMIN] },
    { path: '/catalog', label: '📋 Каталог', roles: [USER_ROLES.CLIENT, USER_ROLES.ADMIN] },
    { path: '/admin', label: '👨‍💼 Менеджер', roles: [USER_ROLES.ADMIN] }
  ];

  // ПОЧЕМУ filter? Показываем пункты меню только для текущей роли
  const visibleMenu = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="layout">
      {/* === ШАПКА === */}
      <header className="layout__header">
        <div className="layout__container">
          <div className="layout__brand">
            <Link to="/" className="layout__logo">
              💇‍♀️ <span>Здоровье и красота</span>
            </Link>
          </div>

          {/* ПОЧЕМУ <nav>? Семантический тег для навигации — важно для SEO и A11y */}
          <nav className="layout__nav" aria-label="Главная навигация">
            {visibleMenu.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`layout__nav-link ${
                  location.pathname === item.path ? 'layout__nav-link--active' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* === ПЕРЕКЛЮЧАТЕЛЬ РОЛИ (упрощённо, без авторизации) === */}
          <div className="layout__role-switcher">
            <label className="layout__role-label">
              Роль:
              <select
                value={userRole}
                onChange={(e) => onRoleChange(e.target.value)}
                className="layout__role-select"
              >
                <option value={USER_ROLES.CLIENT}>Клиент</option>
                <option value={USER_ROLES.ADMIN}>Менеджер</option>
              </select>
            </label>
          </div>
        </div>
      </header>

      {/* === ОСНОВНОЙ КОНТЕНТ === */}
      {/* 
        ПОЧЕМУ {children}? 
        Это "волшебная" prop React, в которую попадает всё, 
        что написали между <Layout>...</Layout> в родителе.
        Layout не знает и не должен знать, что именно будет внутри.
      */}
      <main className="layout__main">
        <div className="layout__container">
          {children}
        </div>
      </main>

      {/* === ПОДВАЛ === */}
      <footer className="layout__footer">
        <div className="layout__container">
          <div className="layout__footer-grid">
            <div className="layout__footer-col">
              <h4>Салон «Здоровье и красота»</h4>
              <p>г. Минск, ул. Примерная, 42</p>
              <p>Ежедневно с 9:00 до 21:00</p>
            </div>
            <div className="layout__footer-col">
              <h4>Контакты</h4>
              <p>📞 +375 (29) 123-45-67</p>
              <p>✉️ info@bookme24.by</p>
            </div>
            <div className="layout__footer-col">
              <h4>Онлайн-запись</h4>
              <p>bookme24.by — круглосуточно</p>
              <p>© 2026 Все права защищены</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}