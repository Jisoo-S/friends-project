import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, saveUserData, getUserData } from './services/firebase';
import LoginScreen from './components/LoginScreen';
import HomeScreen from './components/HomeScreen';
import StampScreen from './components/StampScreen';
import Modal from './components/Modal';
import AlertModal from './components/AlertModal';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [friends, setFriends] = useState({});
  const [friendsOrder, setFriendsOrder] = useState([]);
  const [currentScreen, setCurrentScreen] = useState('login');
  const [currentFriend, setCurrentFriend] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    defaultValue: '',
    callback: null,
    isDateModal: false,
    hasExistingDate: false,
    showColorPicker: false,
    currentColor: 'yellow'
  });

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    message: '',
    isError: false
  });

  // 사용자 데이터 저장
  const saveData = async () => {
    if (!currentUser) return;
    
    try {
      await saveUserData(currentUser.uid, {
        email: currentUser.email,
        friends: friends,
        friendsOrder: friendsOrder,
        lastUpdated: new Date().toISOString()
      });
      console.log('데이터 저장 완료');
    } catch (error) {
      console.error('데이터 저장 실패:', error);
      showAlert('데이터 저장에 실패했습니다.<br>다시 시도해주세요.', true);
    }
  };

  // 사용자 데이터 로드
  const loadData = async (user) => {
    try {
      const userData = await getUserData(user.uid);
      
      if (userData) {
        const loadedFriends = userData.friends || {};
        const loadedOrder = userData.friendsOrder || [];
        
        // 데이터 구조 변환
        const convertedFriends = {};
        Object.keys(loadedFriends).forEach(name => {
          const friendData = loadedFriends[name];
          
          if (Array.isArray(friendData)) {
            convertedFriends[name] = {
              stamps: [...friendData],
              color: 'yellow'
            };
          } else if (friendData && typeof friendData === 'object') {
            convertedFriends[name] = {
              stamps: friendData.stamps || [],
              color: friendData.color || 'yellow'
            };
          }
        });
        
        setFriends(convertedFriends);
        setFriendsOrder(loadedOrder.length > 0 ? loadedOrder : Object.keys(convertedFriends));
      } else {
        // 새 사용자
        await saveUserData(user.uid, {
          email: user.email,
          friends: {},
          friendsOrder: [],
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      showAlert('데이터 로드에 실패했습니다.<br>다시 로그인해주세요.', true);
    }
  };

  // Auth 상태 변화 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('사용자 로그인됨:', user.email);
        setCurrentUser(user);
        await loadData(user);
        setCurrentScreen('home');
      } else {
        console.log('사용자 로그아웃됨');
        setCurrentUser(null);
        setFriends({});
        setFriendsOrder([]);
        setCurrentScreen('login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 모달 표시 함수
  const showModal = (title, defaultValue, callback, isDateModal = false, hasExistingDate = false, showColorPicker = false) => {
    const currentColor = currentFriend && friends[currentFriend] ? friends[currentFriend].color : 'yellow';
    
    setModalConfig({
      isOpen: true,
      title,
      defaultValue,
      callback,
      isDateModal,
      hasExistingDate,
      showColorPicker,
      currentColor
    });
  };

  // 모달 닫기
  const closeModal = () => {
    setModalConfig({
      ...modalConfig,
      isOpen: false
    });
  };

  // 모달 확인
  const handleModalConfirm = (value, isDelete, color) => {
    if (modalConfig.callback) {
      modalConfig.callback(value, isDelete, color);
    }
    closeModal();
  };

  // 알림 표시
  const showAlert = (message, isError = false) => {
    setAlertConfig({
      isOpen: true,
      message,
      isError
    });
  };

  // 알림 닫기
  const closeAlert = () => {
    setAlertConfig({
      isOpen: false,
      message: '',
      isError: false
    });
  };

  // 친구 추가
  const addFriend = async (name, color) => {
    const newFriends = {
      ...friends,
      [name]: {
        stamps: [],
        color: color
      }
    };
    const newOrder = [...friendsOrder, name];
    
    setFriends(newFriends);
    setFriendsOrder(newOrder);
    
    await saveData();
    showAlert('성공적으로 추가되었습니다.', false);
  };

  // 친구 삭제
  const deleteFriend = async (name) => {
    const newFriends = { ...friends };
    delete newFriends[name];
    
    const newOrder = friendsOrder.filter(n => n !== name);
    
    setFriends(newFriends);
    setFriendsOrder(newOrder);
    
    await saveData();
    showAlert('성공적으로 삭제되었습니다.', false);
  };

  // 친구 순서 업데이트
  const updateFriendsOrder = async (newOrder) => {
    setFriendsOrder(newOrder);
    await saveData();
  };

  // 스탬프 페이지 열기
  const openStampPage = (friendName) => {
    setCurrentFriend(friendName);
    setCurrentScreen('stamp');
  };

  // 스탬프 업데이트
  const updateStamps = async (friendName, newStamps) => {
    const newFriends = {
      ...friends,
      [friendName]: {
        ...friends[friendName],
        stamps: newStamps
      }
    };
    
    setFriends(newFriends);
    await saveData();
  };

  // 친구 정보 수정
  const editFriend = async (oldName, newName, newColor) => {
    const newFriends = { ...friends };
    const friendData = newFriends[oldName];
    
    if (newName !== oldName) {
      delete newFriends[oldName];
      newFriends[newName] = {
        stamps: friendData.stamps || [],
        color: newColor || friendData.color
      };
      
      const orderIndex = friendsOrder.indexOf(oldName);
      const newOrder = [...friendsOrder];
      if (orderIndex > -1) {
        newOrder[orderIndex] = newName;
      }
      setFriendsOrder(newOrder);
      setCurrentFriend(newName);
    } else {
      newFriends[oldName].color = newColor;
    }
    
    setFriends(newFriends);
    await saveData();
    showAlert('정보가 성공적으로 변경되었습니다.', false);
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="App">
      {currentScreen === 'login' && (
        <LoginScreen onShowAlert={showAlert} />
      )}
      
      {currentScreen === 'home' && (
        <HomeScreen 
          friends={friends}
          friendsOrder={friendsOrder}
          onAddFriend={addFriend}
          onDeleteFriend={deleteFriend}
          onUpdateFriendsOrder={updateFriendsOrder}
          onOpenStampPage={openStampPage}
          onShowModal={showModal}
          onShowAlert={showAlert}
        />
      )}
      
      {currentScreen === 'stamp' && (
        <StampScreen 
          currentFriend={currentFriend}
          friends={friends}
          onBack={() => setCurrentScreen('home')}
          onUpdateStamps={updateStamps}
          onEditFriend={editFriend}
          onShowModal={showModal}
          onShowAlert={showAlert}
        />
      )}
      
      <Modal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        defaultValue={modalConfig.defaultValue}
        onClose={closeModal}
        onConfirm={handleModalConfirm}
        isDateModal={modalConfig.isDateModal}
        hasExistingDate={modalConfig.hasExistingDate}
        showColorPicker={modalConfig.showColorPicker}
        currentColor={modalConfig.currentColor}
      />
      
      <AlertModal 
        isOpen={alertConfig.isOpen}
        message={alertConfig.message}
        isError={alertConfig.isError}
        onClose={closeAlert}
      />
      
      <footer>
        © 2025. Michelle.J.S. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
