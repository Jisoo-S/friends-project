import React from 'react';
import './AlertModal.css';

const AlertModal = ({ isOpen, message, isError, onClose }) => {
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
