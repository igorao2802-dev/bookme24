/**
 * Layout.jsx — Компонент-обёртка (паттерн Wrapper Component)
 * 
 * 🔥 ЭТАП 7.2: Интеграция LanguageToggle рядом с ThemeToggle
 * 🔥 ЭТАП 7.3: Полная интеграция с локализацией
 * 
 * Порядок в шапке: Логотип | Навигация | [ThemeToggle | LanguageToggle | RoleSwitcher]
 * Перевод пунктов меню через функцию t()
 * 
 * ПОЧЕМУ используется children, а не конкретные компоненты внутри?
 * - Механизм children — это основа композиции в React
 * - Layout задаёт каркас (шапка + контент + подвал), а содержимое вставляется снаружи
 * - Избавляет от копипаста Header/Footer на каждой странице
 */

import { Link, useLocation } from 'react-router-dom';
import { USER_ROLES } from '../../utils/constants.js';

// === ИМПОРТ ПЕРЕКЛЮЧАТЕЛЕЙ ===
import ThemeToggle from '../UI/ThemeToggle';
import LanguageToggle from '../UI/LanguageToggle';

// === ИМПОРТ ХУКА ЛОКАЛИЗАЦИИ ===
import { useLanguage } from '../../hooks/useLanguage';

import './Layout.css';

export default function Layout({ children, userRole, onRoleChange }) {
  const location = useLocation();
  
  // 🔥 ЭТАП 7.2: получаем функцию перевода
  const { t } = useLanguage();

  // === МЕНЮ НАВИГАЦИИ ===
  // ПОЧЕМУ переводим label через t()?
  // - При смене языка меню мгновенно обновляется
  // - Ключи (nav.booking) — единый источник истины в ru.json/en.json
  // - Не нужно вручную менять строки при добавлении нового языка
  const menuItems = [
    { 
      path: '/', 
      label: t('nav.booking'), 
      roles: [USER_ROLES.CLIENT, USER_ROLES.ADMIN] 
    },
    { 
      path: '/catalog', 
      label: t('nav.catalog'), 
      roles: [USER_ROLES.CLIENT, USER_ROLES.ADMIN] 
    },
    { 
      path: '/admin', 
      label: t('nav.manager'), 
      roles: [USER_ROLES.ADMIN] 
    },
    { 
      path: '/profile', 
      label: t('nav.profile'), 
      roles: [USER_ROLES.CLIENT] 
    },
  ];

  // ПОЧЕМУ filter? Показываем пункты меню только для текущей роли
  // Клиент не видит "Менеджер", админ не видит "Кабинет"
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
          <nav 
            className="layout__nav" 
            aria-label={t('common.mainNavigation') || 'Главная навигация'}
          >
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

          {/* === 🔥 ГРУППА ПЕРЕКЛЮЧАТЕЛЕЙ (ЭТАП 7.2 + 7.3) === */}
          {/* 
            ПОЧЕМУ отдельный контейнер layout__controls?
            - Группирует все переключатели вместе (тема, язык, роль)
            - На мобильных — переносится на новую строку как единый блок
            - Визуально отделяет "утилиты" от навигации
            - margin-left: auto прижимает группу к правому краю
          */}
          <div className="layout__controls">
            {/* Переключатель темы (солнце/луна) */}
            <ThemeToggle />

            {/* 🔥 Переключатель языка (RU/EN) */}
            <LanguageToggle />

            {/* Переключатель роли (для разработки) */}
            <div className="layout__role-switcher">
              <label className="layout__role-label">
                {t('common.role') || 'Роль'}:
                <select
                  value={userRole}
                  onChange={(e) => onRoleChange(e.target.value)}
                  className="layout__role-select"
                >
                  <option value={USER_ROLES.CLIENT}>
                    {t('common.client') || 'Клиент'}
                  </option>
                  <option value={USER_ROLES.ADMIN}>
                    {t('common.manager') || 'Менеджер'}
                  </option>
                </select>
              </label>
            </div>
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