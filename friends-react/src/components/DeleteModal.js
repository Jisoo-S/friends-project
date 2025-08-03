import React, { useState } from 'react';
import './DeleteModal.css';

const DeleteModal = ({ friendsOrder, onConfirm, onClose }) => {
  const reversedFriends = [...friendsOrder].reverse();
  const [selectedFriend, setSelectedFriend] = useState(reversedFriends[0]);

  const handleConfirm = () => {
    onConfirm(selectedFriend);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="modal" onClick={(e) => e.target.className === 'modal' && onClose()}>
      <div className="modal-content">
        <span className="modal-close" onClick={onClose}>&times;</span>
        <h2 style={{ marginBottom: '24px' }}>Which file do you want to delete?</h2>
        <select 
          id="delete-select"
          value={selectedFriend}
          onChange={(e) => setSelectedFriend(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        >
          {reversedFriends.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <button id="delete-confirm" onClick={handleConfirm}>OK</button>
      </div>
    </div>
  );
};

export default DeleteModal;
