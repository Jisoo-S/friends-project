import React, { useState } from 'react';
import './FolderList.css';

const FolderList = ({ friends, friendsOrder, onUpdateOrder, onOpenStampPage }) => {
  const [draggedIndex, setDraggedIndex] = useState(-1);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.target.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDraggedIndex(-1);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex !== -1 && draggedIndex !== dropIndex) {
      const newOrder = [...friendsOrder];
      const draggedName = newOrder[draggedIndex];
      
      // 배열에서 요소 이동
      newOrder.splice(draggedIndex, 1);
      
      // 새 위치 계산
      let newIndex = dropIndex;
      if (draggedIndex < dropIndex) {
        newIndex = dropIndex - 1;
      }
      
      newOrder.splice(newIndex, 0, draggedName);
      
      onUpdateOrder(newOrder);
    }
  };

  const groupFriendsByColor = () => {
    const groups = {
      yellow: [],
      pink: [],
      blue: []
    };
    
    friendsOrder.forEach((name, index) => {
      if (friends[name]) {
        const color = friends[name].color || 'yellow';
        if (groups[color]) {
          groups[color].push({ name, index });
        }
      }
    });
    
    return groups;
  };

  const createFolderElement = (name, index) => {
    const friendData = friends[name];
    const color = friendData && friendData.color ? friendData.color : 'yellow';

    return (
      <div 
        key={name}
        className={`folder folder-${color}`}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index)}
        onClick={() => onOpenStampPage(name)}
      >
        <img 
          src="https://cdn-icons-png.flaticon.com/512/716/716784.png" 
          alt="folder" 
        />
        <span>{name}</span>
      </div>
    );
  };

  const colorGroups = groupFriendsByColor();
  const colors = ['yellow', 'pink', 'blue'];

  return (
    <div className="folder-list">
      {colors.map(color => {
        const friendsInColor = colorGroups[color];
        if (friendsInColor.length === 0) return null;

        return (
          <div key={color} className="color-group">
            {window.innerWidth > 600 ? (
              // 데스크톱 버전
              <>
                {Array.from({ length: Math.ceil(friendsInColor.length / 5) }).map((_, row) => {
                  const startIndex = row * 5;
                  const endIndex = Math.min(startIndex + 5, friendsInColor.length);
                  
                  return (
                    <div 
                      key={row}
                      className="folder-row-desktop"
                      style={{
                        display: 'flex',
                        gap: '50px',
                        marginBottom: row < Math.ceil(friendsInColor.length / 5) - 1 ? '40px' : '0',
                        marginTop: row > 0 ? '40px' : '0',
                        justifyContent: 'center'
                      }}
                    >
                      {friendsInColor.slice(startIndex, endIndex).map(({ name, index }) => 
                        createFolderElement(name, index)
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              // 모바일 버전
              <div className="folder-grid-mobile">
                {friendsInColor.map(({ name, index }) => 
                  createFolderElement(name, index)
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FolderList;
