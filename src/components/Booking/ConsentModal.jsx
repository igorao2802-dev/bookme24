/**
 * ConsentModal.jsx — модальное окно согласия на обработку персональных данных (GDPR)
 * 
 * 🔥 ЭТАП 3.3: Обязательное подтверждение перед созданием записи
 */

import Modal from '../UI/Modal';
import Button from '../UI/Button';
import { ShieldAlert } from 'lucide-react';

export default function ConsentModal({ isOpen, onApprove, onReject }) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onReject} 
      title="Согласие на обработку данных" 
      size="md"
    >
      <div style={{ padding: '8px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
          <ShieldAlert size={24} style={{ color: 'var(--color-primary, #d4a574)', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '1rem', lineHeight: '1.5', color: 'var(--color-text, #2d2419)', margin: 0 }}>
            Подтвердите добровольную передачу персональных данных для онлайн-записи. 
            Ваши данные будут использованы исключительно для формирования и подтверждения записи в салоне.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button 
            variant="outline" 
            onClick={onReject}
          >
            Запретить
          </Button>
          <Button 
            variant="primary" 
            onClick={onApprove}
          >
            Разрешаю
          </Button>
        </div>
      </div>
    </Modal>
  );
}