import React, { useEffect } from 'react';
import './AlertModal.css';

const AlertModal = ({ isOpen, message, isError, onClose }) => {
  // 모달이 열릴 때 스크롤 위치 저장 및 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;
      
      // body 스크롤 방지
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // 모달이 닫힐 때 원래 스크롤 위치로 복원
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const titleColor = isError ? '#e74c3c' : '#2271b1';
  const title = isError ? 'WARNING' : 'NOTICE';

  return (
    <div className="alert-modal">
      <div className="alert-modal-content">
        <span className="modal-close" onClick={onClose}>&times;</span>
        <h2 style={{ marginBottom: '24px', color: titleColor }}>{title}</h2>
        <p dangerouslySetInnerHTML={{ __html: message }} />
        <button onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

export default AlertModal;
