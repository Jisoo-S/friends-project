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
          autoFocus
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
