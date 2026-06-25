/**
 * Footer.jsx — подвал сайта
 * 
 * АРХИТЕКТУРНАЯ РОЛЬ:
 * Отображает контактную информацию, ссылки и копирайт.
 * 🔥 ИСПРАВЛЕНО: Добавлены mailto: и tel: ссылки для быстрого перехода
 */
import { MapPin, Clock, Phone, Mail, Globe } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import './Footer.css';

export default function Footer() {
  const { t } = useLanguage();

  // 🔥 Контактные данные — единая точка правды
  const CONTACTS = {
    email: 'info@bookme24.by',
    phone: '+375291234567', // Без форматирования для tel:
    phoneDisplay: '+375 (29) 123-45-67', // Для отображения
    address: t('footer.address'),
    website: 'bookme24.by',
  };

  return (
    <footer className="footer">
      <div className="footer__container">
        {/* === ЛОГОТИП И ОПИСАНИЕ === */}
        <div className="footer__brand">
          <h3 className="footer__title">{t('footer.title')}</h3>
          <p className="footer__description">
            {t('common.brandName')}
          </p>
        </div>

        {/* === КОНТАКТЫ === */}
        <div className="footer__contacts">
          <h4 className="footer__subtitle">{t('footer.contacts')}</h4>
          <ul className="footer__list">
            <li className="footer__item">
              <Phone size={16} className="footer__icon" aria-hidden="true" />
              {/* 🔥 tel: ссылка — открывает приложение для звонка на мобильных */}
              <a 
                href={`tel:${CONTACTS.phone}`} 
                className="footer__link"
                aria-label={t('footer.phone')}
              >
                {CONTACTS.phoneDisplay}
              </a>
            </li>
            <li className="footer__item">
              <Mail size={16} className="footer__icon" aria-hidden="true" />
              {/* 🔥 mailto: ссылка — открывает почтовый клиент */}
              <a 
                href={`mailto:${CONTACTS.email}`} 
                className="footer__link"
                aria-label={t('footer.email')}
              >
                {CONTACTS.email}
              </a>
            </li>
            <li className="footer__item">
              <MapPin size={16} className="footer__icon" aria-hidden="true" />
              <span className="footer__text">{CONTACTS.address}</span>
            </li>
            <li className="footer__item">
              <Clock size={16} className="footer__icon" aria-hidden="true" />
              <span className="footer__text">{t('footer.hours')}</span>
            </li>
          </ul>
        </div>

        {/* === ОНЛАЙН-ЗАПИСЬ === */}
        <div className="footer__online">
          <h4 className="footer__subtitle">{t('footer.online')}</h4>
          <p className="footer__text">{t('footer.onlineDesc')}</p>
          <a 
            href={`https://${CONTACTS.website}`} 
            className="footer__link footer__link--accent"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Globe size={16} aria-hidden="true" />
            {CONTACTS.website}
          </a>
        </div>
      </div>

      {/* === КОПИРАЙТ === */}
      <div className="footer__bottom">
        <p className="footer__copyright">{t('footer.copyright')}</p>
      </div>
    </footer>
  );
}