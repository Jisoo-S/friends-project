import React, { useState } from 'react';
import { signOutUser } from '../services/firebase';
import FolderList from './FolderList';
import DeleteModal from './DeleteModal';
import './HomeScreen.css';

const HomeScreen = ({
  friends,
  friendsOrder,
  colorOrder,
  onAddFriend,
  onDeleteFriend,
  onUpdateFriendsOrder,
  onUpdateColorOrder,
  onOpenStampPage,
  onOpenSettings,
  onShowModal,
  onShowAlert,
  onUpdateFriendColor
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalData, setOriginalData] = useState(null);

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

  const toggleEditMode = () => {
    if (!isEditMode) {
      // 편집 모드 진입 시 현재 상태 저장
      setOriginalData({
        friendsOrder: [...friendsOrder],
        colorOrder: [...colorOrder],
        friends: JSON.parse(JSON.stringify(friends))
      });
    }
    setIsEditMode(!isEditMode);
  };

  const handleCancel = () => {
    // 원래 상태로 복원
    if (originalData) {
      onUpdateFriendsOrder(originalData.friendsOrder);
      onUpdateColorOrder(originalData.colorOrder);
      // 친구들의 색상도 복원
      Object.keys(originalData.friends).forEach(friendName => {
        if (friends[friendName] && friends[friendName].color !== originalData.friends[friendName].color) {
          onUpdateFriendColor(friendName, originalData.friends[friendName].color);
        }
      });
    }
    setIsEditMode(false);
    setOriginalData(null);
  };

  const handleSave = () => {
    setIsEditMode(false);
    setOriginalData(null);
    onShowAlert('변경사항이 저장되었습니다.', false);
  };

  return (
    <div id="home-screen" className="screen">
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
      <button className="settings-btn" onClick={onOpenSettings}>⚙️</button>
      <h1>nice to meet you!</h1>

      <FolderList
        friends={friends}
        friendsOrder={friendsOrder}
        colorOrder={colorOrder}
        onUpdateOrder={onUpdateFriendsOrder}
        onUpdateColorOrder={onUpdateColorOrder}
        onOpenStampPage={onOpenStampPage}
        isEditMode={isEditMode}
        onUpdateFriendColor={onUpdateFriendColor}
      />

      <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        {!isEditMode && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button id="add-friend" className="action-btn" onClick={handleAddFriend}>add</button>
            <button id="delete-friend" className="action-btn" onClick={handleDeleteFriend}>delete</button>
          </div>
        )}
      </div>

      {!isEditMode && (
        <button className="edit-btn" onClick={toggleEditMode}>✏️</button>
      )}

      {isEditMode && (
        <div className="edit-mode-buttons">
          <button className="save-btn" onClick={handleSave}>save</button>
          <button className="cancel-btn" onClick={handleCancel}>×</button>
        </div>
      )}

      {showDeleteModal && (
        <DeleteModal
          friendsOrder={friendsOrder}
          onConfirm={handleDeleteConfirm}
          onClose={() => setShowDeleteModal(false)}
        />
      )}

      <footer className="home-footer">
        © 2025. Michelle.J.S. All rights reserved.
      </footer>
    </div>
  );
};

export default HomeScreen;
