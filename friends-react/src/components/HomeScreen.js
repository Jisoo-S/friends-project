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

  const moveColor = (fromIndex, direction) => {
    const newColorOrder = [...colorOrder];
    const toIndex = fromIndex + direction;
    
    if (toIndex >= 0 && toIndex < newColorOrder.length) {
      // 요소 순서 바꾸기
      [newColorOrder[fromIndex], newColorOrder[toIndex]] = [newColorOrder[toIndex], newColorOrder[fromIndex]];
      onUpdateColorOrder(newColorOrder);
    }
  };

  const changeFileColor = (friendName, newColor) => {
    onUpdateFriendColor(friendName, newColor);
  };

  const moveFileInGroup = (groupColor, indexInGroup, direction) => {
    // 해당 색상 그룹의 파일들만 가져오기
    const filesInGroup = friendsOrder.filter(name => {
      const friendData = friends[name];
      return (friendData?.color || 'yellow') === groupColor;
    });
    
    const newGroupOrder = [...filesInGroup];
    const toIndex = indexInGroup + direction;
    
    if (toIndex >= 0 && toIndex < newGroupOrder.length) {
      // 그룹 내에서 순서 바꿀기
      [newGroupOrder[indexInGroup], newGroupOrder[toIndex]] = [newGroupOrder[toIndex], newGroupOrder[indexInGroup]];
      
      // 전체 friendsOrder에 반영
      const otherColorFiles = friendsOrder.filter(name => {
        const friendData = friends[name];
        return (friendData?.color || 'yellow') !== groupColor;
      });
      
      // 다른 색상 파일들의 위치 파악
      const otherFilesPositions = [];
      otherColorFiles.forEach(fileName => {
        otherFilesPositions.push({
          name: fileName,
          originalIndex: friendsOrder.indexOf(fileName)
        });
      });
      
      // 새로운 배열 생성
      let newOrderResult = [];
      let groupIndex = 0;
      let otherIndex = 0;
      
      for (let i = 0; i < friendsOrder.length; i++) {
        const originalFile = friendsOrder[i];
        const friendData = friends[originalFile];
        const fileColor = friendData?.color || 'yellow';
        
        if (fileColor === groupColor) {
          if (groupIndex < newGroupOrder.length) {
            newOrderResult.push(newGroupOrder[groupIndex]);
            groupIndex++;
          }
        } else {
          if (otherIndex < otherFilesPositions.length) {
            newOrderResult.push(otherFilesPositions[otherIndex].name);
            otherIndex++;
          }
        }
      }
      
      onUpdateFriendsOrder(newOrderResult);
    }
  };

  return (
    <div id="home-screen" className="screen">
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
      <button className="settings-btn" onClick={onOpenSettings}>⚙️</button>
      <h1>nice to meet you!</h1>

      {isEditMode && (
        <div className="simple-edit-controls">
          {/* 안내 문구 */}
          <div className="edit-guide">
            <span className="guide-text">
              <span className="arrow-icon">⬆⬇</span> 화살표 버튼을 통해 목록과 파일 순서를<br className="mobile-break" /> 변경하세요!
            </span>
          </div>
          
          {/* 목록 배치 순서 */}
          <div className="edit-section">
            <h3>목록 배치 순서</h3>
            <div className="group-order-controls">
              {colorOrder.map((color, index) => (
                <div key={color} className="group-order-item">
                  <div className={`color-circle color-${color}`}></div>
                  <span className="group-name">
                    {color === 'yellow' ? 'yellow file' : color === 'pink' ? 'pink file' : 'blue file'}
                  </span>
                  <span className="group-position">#{index + 1}</span>
                  <div className="group-controls">
                    <button 
                      className="simple-btn up"
                      onClick={() => moveColor(index, -1)}
                      disabled={index === 0}
                    >
                      ⬆
                    </button>
                    <button 
                      className="simple-btn down"
                      onClick={() => moveColor(index, 1)}
                      disabled={index === colorOrder.length - 1}
                    >
                      ⬇
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 파일 순서 및 색상 변경 */}
          <div className="edit-section">
            <h3>파일 순서 및 색상 변경</h3>
            <div className="files-by-color">
              {colorOrder.map((color) => {
                const filesInColor = friendsOrder.filter(name => {
                  const friendData = friends[name];
                  return (friendData?.color || 'yellow') === color;
                });
                
                if (filesInColor.length === 0) return null;
                
                return (
                  <div key={color} className="color-group-section">
                    <div className={`color-group-header color-${color}`}>
                      <div className={`file-icon-in-header color-${color}`}></div>
                      <span className="group-title">
                        {color === 'yellow' ? 'yellow file' : color === 'pink' ? 'pink file' : 'blue file'} ({filesInColor.length})
                      </span>
                    </div>
                    <div className="color-group-files">
                      {filesInColor.map((friendName, indexInColor) => {
                        const isFirstInGroup = indexInColor === 0;
                        const isLastInGroup = indexInColor === filesInColor.length - 1;
                        return (
                          <div key={friendName} className="file-edit-item">
                            <div className="file-display">
                              <div className={`file-icon-real color-${color}`}></div>
                              <span className="simple-file-name">{friendName}</span>
                              <span className="file-position">#{indexInColor + 1}</span>
                            </div>
                            <div className="file-edit-controls-right">
                              {/* 순서 변경 - 같은 색상 그룹 내에서만 */}
                              <div className="position-controls">
                                {!isFirstInGroup && (
                                  <button 
                                    className="simple-btn up"
                                    onClick={() => moveFileInGroup(color, indexInColor, -1)}
                                  >
                                    ⬆
                                  </button>
                                )}
                                {!isLastInGroup && (
                                  <button 
                                    className="simple-btn down"
                                    onClick={() => moveFileInGroup(color, indexInColor, 1)}
                                  >
                                    ⬇
                                  </button>
                                )}
                              </div>
                              {/* 색상 변경 */}
                              <div className="color-controls">
                                <button 
                                  className={`color-btn-real yellow ${color === 'yellow' ? 'selected' : ''}`}
                                  onClick={() => changeFileColor(friendName, 'yellow')}
                                ></button>
                                <button 
                                  className={`color-btn-real pink ${color === 'pink' ? 'selected' : ''}`}
                                  onClick={() => changeFileColor(friendName, 'pink')}
                                ></button>
                                <button 
                                  className={`color-btn-real blue ${color === 'blue' ? 'selected' : ''}`}
                                  onClick={() => changeFileColor(friendName, 'blue')}
                                ></button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!isEditMode && (
        <FolderList
          friends={friends}
          friendsOrder={friendsOrder}
          colorOrder={colorOrder}
          onUpdateOrder={onUpdateFriendsOrder}
          onUpdateColorOrder={onUpdateColorOrder}
          onOpenStampPage={onOpenStampPage}
          isEditMode={false}
          onUpdateFriendColor={onUpdateFriendColor}
        />
      )}

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
