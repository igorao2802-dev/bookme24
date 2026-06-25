/**
 * Layout.jsx — Компонент-обёртка
 * 🔥 ЭТАП 5.4: Полная локализация логотипа и подвала
 */
import { Link, useLocation } from 'react-router-dom';
import { USER_ROLES } from '../../utils/constants.js';
import ThemeToggle from '../UI/ThemeToggle';
import LanguageToggle from '../UI/LanguageToggle';
import { useLanguage } from '../../hooks/useLanguage';
import './Layout.css';

export default function Layout({ children, userRole, onRoleChange }) {
  const location = useLocation();
  const { t } = useLanguage();

  const menuItems = [
    { path: '/', label: t('nav.booking'), roles: [USER_ROLES.CLIENT, USER_ROLES.ADMIN] },
    { path: '/catalog', label: t('nav.catalog'), roles: [USER_ROLES.CLIENT, USER_ROLES.ADMIN] },
    { path: '/admin', label: t('nav.manager'), roles: [USER_ROLES.ADMIN] },
    { path: '/profile', label: t('nav.profile'), roles: [USER_ROLES.CLIENT] },
  ];

  const visibleMenu = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__container">
          <div className="layout__brand">
            <Link to="/" className="layout__logo">
              💇‍♀️ <span>{t('common.brandName')}</span> {/* 🔥 ЭТАП 5.4 */}
            </Link>
          </div>
          
          <nav className="layout__nav" aria-label={t('common.mainNavigation')}>
            {visibleMenu.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`layout__nav-link ${location.pathname === item.path ? 'layout__nav-link--active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="layout__controls">
            <ThemeToggle />
            <LanguageToggle />
            <div className="layout__role-switcher">
              <label className="layout__role-label">
                {t('common.role')}:
                <select
                  value={userRole}
                  onChange={(e) => onRoleChange(e.target.value)}
                  className="layout__role-select"
                >
                  <option value={USER_ROLES.CLIENT}>{t('common.client')}</option>
                  <option value={USER_ROLES.ADMIN}>{t('common.manager')}</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </header>

      <main className="layout__main">
        <div className="layout__container">{children}</div>
      </main>

      {/* 🔥 ЭТАП 5.4: Полная локализация подвала */}
      <footer className="layout__footer">
        <div className="layout__container">
          <div className="layout__footer-grid">
            <div className="layout__footer-col">
              <h4>{t('footer.title')}</h4>
              <p>{t('footer.address')}</p>
              <p>{t('footer.hours')}</p>
            </div>
            <div className="layout__footer-col">
              <h4>{t('footer.contacts')}</h4>
              <p>📞 {t('footer.phone')}</p>
              <p>✉️ {t('footer.email')}</p>
            </div>
            <div className="layout__footer-col">
              <h4>{t('footer.online')}</h4>
              <p>{t('footer.onlineDesc')}</p>
              <p>{t('footer.copyright')}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}