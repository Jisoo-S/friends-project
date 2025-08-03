import React, { useState, useRef } from 'react';
import { signOutUser } from '../services/firebase';
import FolderList from './FolderList';
import DeleteModal from './DeleteModal';
import './HomeScreen.css';

const HomeScreen = ({ 
  friends, 
  friendsOrder, 
  onAddFriend, 
  onDeleteFriend, 
  onUpdateFriendsOrder,
  onOpenStampPage, 
  onShowModal,
  onShowAlert 
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  const handleAddFriend = () => {
    onShowModal("Write your file's name!", "", (name, isDelete, color) => {
      if (!name || !name.trim()) {
        return;
      }
      
      const trimmedName = name.trim();
      
      if (friends[trimmedName]) {
        onShowAlert('이미 존재하는 이름입니다.', true);
        return;
      }
      
      onAddFriend(trimmedName, color || 'yellow');
    }, false, false, true);
  };

  const handleDeleteFriend = () => {
    if (friendsOrder.length === 0) {
      onShowAlert('삭제할 파일이 없습니다.', false);
      return;
    }
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = (friendName) => {
    onDeleteFriend(friendName);
    setShowDeleteModal(false);
  };

  return (
    <div id="home-screen" className="screen">
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
      <h1>nice to meet you!</h1>
      
      <FolderList 
        friends={friends}
        friendsOrder={friendsOrder}
        onUpdateOrder={onUpdateFriendsOrder}
        onOpenStampPage={onOpenStampPage}
      />
      
      <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <button id="add-friend" className="action-btn" onClick={handleAddFriend}>add</button>
        <button id="delete-friend" className="action-btn" onClick={handleDeleteFriend}>delete</button>
      </div>

      {showDeleteModal && (
        <DeleteModal 
          friendsOrder={friendsOrder}
          onConfirm={handleDeleteConfirm}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default HomeScreen;
