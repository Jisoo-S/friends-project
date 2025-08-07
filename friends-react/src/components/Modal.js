import React, { useState, useEffect } from 'react';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  title, 
  defaultValue, 
  onClose, 
  onConfirm, 
  isDateModal, 
  hasExistingDate, 
  showColorPicker,
  currentColor 
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [selectedColor, setSelectedColor] = useState(currentColor || 'yellow');

  useEffect(() => {
    setInputValue(defaultValue);
    setSelectedColor(currentColor || 'yellow');
  }, [defaultValue, currentColor]);

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

  const handleOK = () => {
    onConfirm(inputValue, false, selectedColor);
  };

  const handleDelete = () => {
    onConfirm(null, true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (hasExistingDate && inputValue.trim() === '') {
        handleDelete();
      } else {
        handleOK();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="modal-close" onClick={onClose}>&times;</span>
        <h2>
          {title}
          {(title === "change date" || title === "date") && (
            <>
              <br />
              <small style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>
                (yyyy-mm-dd)
              </small>
            </>
          )}
        </h2>
        
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={isDateModal ? "yyyy-mm-dd" : "name"}
          autoFocus={false}
        />
        
        {showColorPicker && (
          <div className="color-picker">
            <div 
              className={`color-btn yellow ${selectedColor === 'yellow' ? 'selected' : ''}`}
              onClick={() => setSelectedColor('yellow')}
            />
            <div 
              className={`color-btn pink ${selectedColor === 'pink' ? 'selected' : ''}`}
              onClick={() => setSelectedColor('pink')}
            />
            <div 
              className={`color-btn blue ${selectedColor === 'blue' ? 'selected' : ''}`}
              onClick={() => setSelectedColor('blue')}
            />
          </div>
        )}
        
        <div className="custom-buttons">
          <button onClick={handleOK}>OK</button>
          {title === "change date" && hasExistingDate && (
            <button className="delete-btn" onClick={handleDelete}>Delete</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
