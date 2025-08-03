import React, { useState, useEffect } from 'react';
import './StampScreen.css';

const StampScreen = ({ 
  currentFriend, 
  friends, 
  onBack, 
  onUpdateStamps,
  onEditFriend,
  onShowModal,
  onShowAlert 
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const maxStarsPerPage = 10;

  useEffect(() => {
    // 친구가 변경되면 마지막 페이지로 이동
    const friendData = friends[currentFriend];
    const stamps = friendData && friendData.stamps ? friendData.stamps : [];
    if (stamps.length > 0) {
      const stampCount = stamps.length;
      const targetPage = Math.floor((stampCount - 1) / maxStarsPerPage);
      setCurrentPage(targetPage);
    } else {
      setCurrentPage(0);
    }
  }, [currentFriend, friends]);

  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isValidDateFormat = (dateString) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }
    
    const [year, month, day] = dateString.split('-').map(num => parseInt(num));
    const date = new Date(year, month - 1, day);
    
    return date.getFullYear() === year &&
           date.getMonth() === month - 1 &&
           date.getDate() === day;
  };

  const handleStarClick = (localIndex, existingStamp) => {
    
    onShowModal(
      existingStamp ? "change date" : "date",
      existingStamp || getCurrentDate(),
      async (date, isDelete) => {
        const friendData = friends[currentFriend];
        const stamps = friendData && friendData.stamps ? [...friendData.stamps] : [];

        if (isDelete && existingStamp) {
          const originalIndex = stamps.indexOf(existingStamp);
          if (originalIndex !== -1) {
            stamps.splice(originalIndex, 1);
            await onUpdateStamps(currentFriend, stamps);
            
            // 삭제 후 페이지 조정
            const newTotalPages = Math.ceil(stamps.length / maxStarsPerPage) || 1;
            if (currentPage >= newTotalPages) {
              setCurrentPage(newTotalPages - 1);
            }
          }
        } else if (date && date.trim()) {
          let inputValue = date.trim();

          // 날짜 검증
          if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(inputValue)) {
            onShowAlert('날짜를 YYYY-MM-DD 형식으로 입력해주세요.<br>(예: 2025-01-01)', true);
            return;
          }

          const [y, m, d] = inputValue.split('-');
          inputValue = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          
          if (!isValidDateFormat(inputValue)) {
            onShowAlert('올바르지 않은 날짜입니다.<br>YYYY-MM-DD 형식으로 입력해주세요.', true);
            return;
          }

          if (existingStamp) {
            const originalIndex = stamps.indexOf(existingStamp);
            stamps[originalIndex] = inputValue;
          } else {
            stamps.push(inputValue);
          }

          await onUpdateStamps(currentFriend, stamps);

          // 새 스탬프 추가 또는 수정 후 해당 스탬프가 있는 페이지로 이동
          const sortedStamps = [...stamps].sort((a, b) => new Date(a) - new Date(b));
          const newIndex = sortedStamps.indexOf(inputValue);
          const targetPage = Math.floor(newIndex / maxStarsPerPage);
          setCurrentPage(targetPage);
        }
      },
      true,
      !!existingStamp,
      false
    );
  };

  const handleEditFriend = () => {
    const currentFriendData = friends[currentFriend];
    const currentColor = currentFriendData && currentFriendData.color ? currentFriendData.color : 'yellow';
    
    onShowModal("Edit file's name", currentFriend, (newName, isDelete, newColor) => {
      if (newName && newName.trim() && (newName.trim() !== currentFriend || newColor !== currentColor)) {
        const trimmedName = newName.trim();
        
        // 이름이 변경되었는데 이미 존재하는 이름인지 확인
        if (trimmedName !== currentFriend && friends[trimmedName]) {
          onShowAlert('이미 존재하는 파일 이름입니다.', true);
          return;
        }
        
        onEditFriend(currentFriend, trimmedName, newColor);
      }
    }, false, false, true);
  };

  const renderStamps = () => {
    const friendData = friends[currentFriend];
    const stamps = friendData && friendData.stamps ? friendData.stamps : [];
    const sorted = [...stamps].sort((a, b) => new Date(a) - new Date(b));

    const start = currentPage * maxStarsPerPage;

    const starsElements = [];
    
    for (let i = 0; i < maxStarsPerPage; i++) {
      // const globalIndex = start + i;
      const thisStamp = sorted[start + i];

      starsElements.push(
        <div key={i} style={{ textAlign: 'center' }}>
          <span 
            className={`star ${thisStamp ? 'filled' : ''}`}
            onClick={() => handleStarClick(i, thisStamp)}
          >
            ★
          </span>
          {thisStamp && (
            <div className="date-label">{thisStamp}</div>
          )}
        </div>
      );
    }

    return starsElements;
  };

  const getTotalPages = () => {
    const friendData = friends[currentFriend];
    const stamps = friendData && friendData.stamps ? friendData.stamps : [];
    // 기본 페이지 수 계산
    const pages = Math.ceil(stamps.length / maxStarsPerPage) || 1;
    
    // 현재 페이지보다 하나 더 많은 페이지 표시 (빈 페이지 추가를 위해)
    // 마지막 페이지가 꽉 찼다면 하나 더 표시
    if (stamps.length % maxStarsPerPage === 0 && stamps.length > 0) {
      return pages + 1;
    }
    
    // 현재 페이지가 마지막 페이지보다 크면 현재 페이지 + 1
    return Math.max(pages, currentPage + 1);
  };

  const changePage = (offset) => {
    const newPage = currentPage + offset;
    const totalPages = getTotalPages();
    
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div id="stamp-screen" className="screen">
      <div className="top-bar">
        <button id="back-button" onClick={onBack}>← home</button>
        <button id="edit-friend" onClick={handleEditFriend}>edit</button>
      </div>
      <h1 id="friend-title" className="center-title">{currentFriend}</h1>

      <div className="nav-buttons">
        <button 
          id="prevPage" 
          onClick={() => changePage(-1)}
          style={{ opacity: currentPage === 0 ? '0.3' : '1' }}
          disabled={currentPage === 0}
        >
          ←
        </button>
        <button 
          id="nextPage" 
          onClick={() => changePage(1)}
          style={{ opacity: currentPage >= getTotalPages() - 1 ? '0.3' : '1' }}
          disabled={currentPage >= getTotalPages() - 1}
        >
          →
        </button>
      </div>
      
      <div id="stamp-pages">
        <div className="stamp-page">
          {renderStamps()}
        </div>
      </div>
    </div>
  );
};

export default StampScreen;
