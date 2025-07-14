// 전역 변수
let currentUser = null;
let friends = {};
let friendsOrder = []; // 친구들의 순서 저장
let currentFriend = null;
let currentPage = 0;
let selectedColor = 'yellow'; // 기본 색상을 노란색으로 변경
let isModalOpen = false; // 모달 상태 플래그 추가
let isDeleteModalOpen = false; // 삭제 모달 상태 플래그 추가
const maxStarsPerPage = 10;

// DOM 요소
const loginScreen = document.getElementById('login-screen');
const homeScreen = document.getElementById('home-screen');
const stampScreen = document.getElementById('stamp-screen');
const folderList = document.getElementById('folder-list');
const addFriendBtn = document.getElementById('add-friend');
const deleteFriendBtn = document.getElementById('delete-friend');
const friendTitle = document.getElementById('friend-title');
const stampPagesContainer = document.getElementById('stamp-pages');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const backButton = document.getElementById('back-button');
const modal = document.getElementById('modal');
const modalInput = document.getElementById('modal-input');
const modalConfirm = document.getElementById('modal-confirm');
const modalClose = document.getElementById('modal-close');
const colorPicker = document.getElementById('color-picker');

// 로그인 관련 DOM 요소
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const errorMessage = document.getElementById('error-message');
const loading = document.getElementById('loading');

// 색상 버튼 이벤트 설정
function setupColorButtons() {
  const colorButtons = document.querySelectorAll('.color-btn');
  colorButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      colorButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedColor = btn.dataset.color;
    });
  });
}

// 에러/알림 모달 표시 함수
function showAlertModal(message, isError = false) {
  const modalDiv = document.createElement('div');
  modalDiv.className = 'modal';
  modalDiv.style.display = 'flex';
  modalDiv.style.alignItems = 'center';
  modalDiv.style.justifyContent = 'center';
  modalDiv.style.zIndex = '2000';
  
  const titleColor = isError ? '#e74c3c' : '#2271b1';
  const title = isError ? 'WARNING' : 'NOTICE';
  
  modalDiv.innerHTML = `
    <div class="modal-content" style="display:flex;flex-direction:column;align-items:center;max-width:400px;">
      <span class="modal-close" style="position:absolute;right:20px;top:10px;font-size:24px;cursor:pointer;">&times;</span>
      <h2 style="margin-bottom:24px;color:${titleColor};">${title}</h2>
      <p style="text-align:center;line-height:1.5;margin-bottom:24px;color:#333;">${message}</p>
      <button style="font-size:18px;padding:12px 40px;background:#ffccdd;color:black;border:none;border-radius:12px;cursor:pointer;font-family:'Spicy Rice','Gowun Dodum',cursive,sans-serif;">OK</button>
    </div>
  `;
  
  document.body.appendChild(modalDiv);
  
  const closeModal = () => document.body.removeChild(modalDiv);
  modalDiv.querySelector('.modal-close').onclick = closeModal;
  modalDiv.querySelector('button').onclick = closeModal;
  
  modalDiv.onclick = (e) => {
    if (e.target === modalDiv) closeModal();
  };
}

// 로딩 상태 관리
function setLoading(isLoading) {
  loading.style.display = isLoading ? 'block' : 'none';
  loginBtn.disabled = isLoading;
  signupBtn.disabled = isLoading;
}

// Firebase 초기화 대기
function waitForFirebase() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50;
    
    const checkFirebase = () => {
      if (window.auth && window.db) {
        resolve();
      } else if (attempts >= maxAttempts) {
        reject(new Error('Firebase 초기화 실패'));
      } else {
        attempts++;
        setTimeout(checkFirebase, 100);
      }
    };
    checkFirebase();
  });
}

// 사용자 시간대 기준 날짜 생성 함수
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 이메일 유효성 검사
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 날짜 형식 검증 함수
function isValidDateFormat(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  const [year, month, day] = dateString.split('-').map(num => parseInt(num));
  const date = new Date(year, month - 1, day);
  
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day;
}

// 모달 함수 정의
function showModal(title, defaultValue, callback, isDateModal = false, hasExistingDate = false, showColorPicker = false) {
  // 이미 모달이 열려있으면 무시
  if (isModalOpen) {
    console.log('모달이 이미 열려있음 - 무시');
    return;
  }
  
  isModalOpen = true; // 모달 열림 상태로 설정
  
  document.getElementById('modal-title').textContent = title;
  
  if (title === "change date" || title === "date") {
    document.getElementById('modal-title').innerHTML = title + '<br><small style="font-size:14px;color:#666;font-weight:normal;">(yyyy-mm-dd)</small>';
  }
  
  modalInput.value = defaultValue;
  modal.classList.remove('hidden');
  
  // 색상 선택기 강제 숨김/표시
  const colorPickerElement = document.getElementById('color-picker');
  if (showColorPicker) {
    console.log('색상 선택기 표시');
    colorPickerElement.classList.remove('hidden');
    colorPickerElement.style.display = 'flex';
    setupColorButtons();
    // 현재 친구의 색상이 있다면 선택
    if (currentFriend && friends[currentFriend] && friends[currentFriend].color) {
      const currentColorBtn = document.querySelector(`.color-btn[data-color="${friends[currentFriend].color}"]`);
      if (currentColorBtn) {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
        currentColorBtn.classList.add('selected');
        selectedColor = friends[currentFriend].color;
      }
    } else {
      // 기본값으로 노란색 선택
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
      const yellowBtn = document.querySelector('.color-btn.yellow');
      if (yellowBtn) {
        yellowBtn.classList.add('selected');
        selectedColor = 'yellow';
      }
    }
  } else {
    console.log('색상 선택기 숨김');
    colorPickerElement.classList.add('hidden');
    colorPickerElement.style.display = 'none';
  }
  
  modalInput.focus();

  // 기존 버튼들 제거
  const existingButtons = modal.querySelectorAll('.custom-buttons');
  existingButtons.forEach(btn => btn.remove());
  
  // 원래 OK 버튼 숨기기
  modalConfirm.style.display = 'none';

  // 새 버튼 컨테이너 생성
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'custom-buttons';
  buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: center; margin-top: 20px;';

  // OK 버튼
  const okButton = document.createElement('button');
  okButton.textContent = 'OK';
  okButton.style.cssText = 'font-size: 18px; padding: 8px 20px; background: #ffccdd; border: none; border-radius: 8px; cursor: pointer; font-family: "Spicy Rice", "Gowun Dodum", cursive, sans-serif;';

  // Delete 버튼 (날짜 수정 시에만)
  let deleteButton = null;
  if (title === "change date" && hasExistingDate) {
    deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.style.cssText = 'font-size: 18px; padding: 8px 20px; background: #ff6b6b; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: "Spicy Rice", "Gowun Dodum", cursive, sans-serif;';
  }

  // 모달 닫기 함수
  const closeModal = () => {
    modal.classList.add('hidden');
    isModalOpen = false; // 모달 닫힘 상태로 설정
  };

  // OK 버튼 이벤트
  okButton.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    let inputValue = modalInput.value.trim();

    // 날짜 검증
    if (isDateModal && inputValue) {
      if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(inputValue)) {
        showAlertModal('날짜를 YYYY-MM-DD 형식으로 입력해주세요.<br>(예: 2025-01-01)', true);
        return;
      }

      const [y, m, d] = inputValue.split('-');
      inputValue = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      if (!isValidDateFormat(inputValue)) {
        showAlertModal('올바르지 않은 날짜입니다.<br>YYYY-MM-DD 형식으로 입력해주세요.', true);
        return;
      }
    }

    closeModal();
    
    // 색상 선택기가 표시되었을 때만 색상 정보 전달
    if (showColorPicker) {
      callback(inputValue, false, selectedColor);
    } else {
      callback(inputValue, false);
    }
  };

  // Delete 버튼 이벤트
  if (deleteButton) {
    deleteButton.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
      callback(null, true);
    };
  }

  modalClose.onclick = () => closeModal();

  // 엔터키 이벤트를 keypress로 변경하고 한 번만 실행되도록
  modalInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      
      // delete 버튼이 있고 입력값이 비어있으면 delete 실행
      if (deleteButton && modalInput.value.trim() === '') {
        deleteButton.click();
      } else {
        // 그렇지 않으면 OK 버튼 실행
        okButton.click();
      }
    }
  };
  
  modalInput.onkeydown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
    }
  };

  // 버튼 추가
  buttonContainer.appendChild(okButton);
  if (deleteButton) {
    buttonContainer.appendChild(deleteButton);
  }

  modal.querySelector('.modal-content').appendChild(buttonContainer);
}

// 회원가입 기능
async function handleSignup() {
  const email = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!email || !password) {
    showAlertModal('이메일과 비밀번호를 모두 입력해주세요.', true);
    return;
  }

  if (!isValidEmail(email)) {
    showAlertModal('올바른 이메일 형식을 입력해주세요.', true);
    return;
  }

  if (password.length < 6) {
    showAlertModal('비밀번호는 6자리 이상이어야 합니다.', true);
    return;
  }

  setLoading(true);
  
  try {
    await waitForFirebase();
    
    const userCredential = await window.createUserWithEmailAndPassword(window.auth, email, password);
    
    await window.setDoc(window.doc(window.db, 'users', userCredential.user.uid), {
      email: email,
      friends: {},
      friendsOrder: [],
      createdAt: new Date().toISOString()
    });

    showAlertModal('회원가입이 완료되었습니다!', false);
  } catch (error) {
    console.error('회원가입 오류:', error);
    if (error.message === 'Firebase 초기화 실패') {
      showAlertModal('연결에 실패했습니다.<br>인터넷 연결을 확인해주세요.', true);
    } else {
      switch (error.code) {
        case 'auth/email-already-in-use':
          showAlertModal('이미 사용 중인 이메일입니다.', true);
          break;
        case 'auth/weak-password':
          showAlertModal('비밀번호가 너무 약합니다.', true);
          break;
        case 'auth/invalid-email':
          showAlertModal('올바르지 않은 이메일 형식입니다.', true);
          break;
        default:
          showAlertModal('회원가입 중 오류가 발생했습니다.<br>다시 시도해주세요.', true);
      }
    }
  } finally {
    setLoading(false);
  }
}

// 로그인 기능
async function handleLogin() {
  const email = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!email || !password) {
    showAlertModal('이메일과 비밀번호를 모두 입력해주세요.', true);
    return;
  }

  setLoading(true);

  try {
    await waitForFirebase();
    await window.signInWithEmailAndPassword(window.auth, email, password);
  } catch (error) {
    console.error('로그인 오류:', error);
    
    if (error.message === 'Firebase 초기화 실패') {
      showAlertModal('연결에 실패했습니다.<br>인터넷 연결을 확인해주세요.', true);
    } else {
      switch (error.code) {
        case 'auth/user-not-found':
          showAlertModal('존재하지 않는 사용자입니다.<br>먼저 회원가입을 해주세요.', true);
          break;
        case 'auth/wrong-password':
          showAlertModal('비밀번호가 올바르지 않습니다.', true);
          break;
        case 'auth/invalid-email':
          showAlertModal('올바르지 않은 이메일 형식입니다.', true);
          break;
        case 'auth/too-many-requests':
          showAlertModal('너무 많은 로그인 시도가 있었습니다.<br>잠시 후 다시 시도해주세요.', true);
          break;
        case 'auth/invalid-credential':
          showAlertModal('잘못된 로그인 정보입니다.<br>이메일과 비밀번호를 확인해주세요.', true);
          break;
        default:
          showAlertModal('로그인 중 오류가 발생했습니다.<br>다시 시도해주세요.', true);
      }
    }
  } finally {
    setLoading(false);
  }
}

// 로그아웃 기능
async function handleLogout() {
  try {
    if (currentUser) {
      await saveUserData();
    }
    await window.signOut(window.auth);
  } catch (error) {
    console.error('로그아웃 오류:', error);
    currentUser = null;
    friends = {};
    friendsOrder = [];
    showLoginScreen();
  }
}

// 화면 전환 함수들
function showLoginScreen() {
  loginScreen.style.display = 'flex';
  homeScreen.style.display = 'none';
  stampScreen.style.display = 'none';
}

function showMainScreen() {
  loginScreen.style.display = 'none';
  homeScreen.style.display = 'block';
  stampScreen.style.display = 'none';
  renderFolders();
}

// 사용자 데이터 저장
async function saveUserData() {
  if (!currentUser || !window.db) {
    console.error('사용자 또는 DB가 없습니다:', { currentUser: !!currentUser, db: !!window.db });
    return;
  }
  
  try {
    console.log('저장 시도 중:', friends);
    
    await window.setDoc(window.doc(window.db, 'users', currentUser.uid), {
      email: currentUser.email,
      friends: friends,
      friendsOrder: friendsOrder,
      lastUpdated: new Date().toISOString()
    }, { merge: false });
    
    console.log('데이터가 성공적으로 저장되었습니다:', Object.keys(friends));
    
  } catch (error) {
    console.error('데이터 저장 오류:', error);
    showAlertModal('데이터 저장에 실패했습니다.<br>다시 시도해주세요.', true);
    throw error;
  }
}

// 사용자 데이터 로드
async function loadUserData() {
  if (!currentUser || !window.db) return;
  
  try {
    console.log('=== 데이터 로드 시작 ===');
    console.log('사용자 ID:', currentUser.uid);
    
    const docRef = window.doc(window.db, 'users', currentUser.uid);
    const docSnap = await window.getDoc(docRef);
    
    if (docSnap.exists()) {
      const userData = docSnap.data();
      console.log('Firebase에서 받은 전체 데이터:', userData);
      
      const loadedFriends = userData.friends;
      const loadedOrder = userData.friendsOrder;
      
      if (loadedFriends && typeof loadedFriends === 'object') {
        // 기존 데이터 구조와 새 데이터 구조 모두 지원
        friends = {};
        Object.keys(loadedFriends).forEach(name => {
          const friendData = loadedFriends[name];
          
          // 기존 구조: friends[name] = [stamps...]
          if (Array.isArray(friendData)) {
            friends[name] = {
              stamps: [...friendData],
              color: 'yellow' // 기본 색상
            };
          }
          // 새 구조: friends[name] = {stamps: [...], color: '...'}
          else if (friendData && typeof friendData === 'object') {
            friends[name] = {
              stamps: friendData.stamps || [],
              color: friendData.color || 'yellow'
            };
          }
        });
      } else {
        friends = {};
      }
      
      if (Array.isArray(loadedOrder)) {
        friendsOrder = [...loadedOrder];
      } else {
        // 기존 데이터가 있다면 순서 생성
        friendsOrder = Object.keys(friends);
      }
      
      console.log('최종 설정된 friends:', friends);
      console.log('최종 설정된 friendsOrder:', friendsOrder);
    } else {
      console.log('사용자 문서가 존재하지 않습니다. 새 문서를 생성합니다.');
      friends = {};
      friendsOrder = [];
      await saveUserData();
    }
    
    console.log('=== 데이터 로드 완료 ===');
  } catch (error) {
    console.error('데이터 로드 오류:', error);
    friends = {};
    friendsOrder = [];
    throw error;
  }
}

// 인증 상태 변화 감지
async function initAuthListener() {
  try {
    await waitForFirebase();
    
    window.onAuthStateChanged(window.auth, async (user) => {
      if (user) {
        console.log('사용자 로그인됨:', user.email);
        currentUser = user;
        
        friends = {};
        friendsOrder = [];
        
        try {
          await loadUserData();
          console.log('로그인 후 friends 상태:', friends);
          console.log('로그인 후 friendsOrder 상태:', friendsOrder);
          showMainScreen();
        } catch (error) {
          console.error('데이터 로드 실패:', error);
          showAlertModal('데이터 로드에 실패했습니다.<br>다시 로그인해주세요.', true);
          await handleLogout();
        }
      } else {
        console.log('사용자 로그아웃됨');
        currentUser = null;
        friends = {};
        friendsOrder = [];
        showLoginScreen();
        
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
      }
    });
  } catch (error) {
    console.error('Firebase 초기화 실패:', error);
    showAlertModal('연결에 실패했습니다.<br>페이지를 새로고침해주세요.', true);
  }
}

// 이벤트 리스너 설정
function setupEventListeners() {
  if (loginBtn) loginBtn.addEventListener('click', handleLogin);
  if (signupBtn) signupBtn.addEventListener('click', handleSignup);
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleLogin();
      }
    });
  }

  if (usernameInput) {
    usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        passwordInput.focus();
      }
    });
  }
}

// 홈으로 돌아가기
backButton.onclick = () => {
  stampScreen.style.display = 'none';
  homeScreen.style.display = 'block';
};

// 자동 저장 함수 - 즉시 저장으로 변경
async function autoSave() {
  if (currentUser) {
    try {
      console.log('즉시 저장 시작...');
      await saveUserData();
      console.log('즉시 저장 완료');
    } catch (error) {
      console.error('즉시 저장 실패:', error);
      showAlertModal('저장에 실패했습니다.<br>네트워크를 확인해주세요.', true);
    }
  } else {
    console.error('즉시 저장 실패: 사용자가 로그인되지 않음');
  }
}

// add friend 버튼 - 완전히 새로운 접근
addFriendBtn.onclick = () => {
  console.log('=== ADD FRIEND 버튼 클릭 ===');
  
  showModal("Write your file's name!", "", async (name, isDelete, color) => {
    if (!name || !name.trim()) {
      console.log('빈 이름 입력됨');
      return;
    }
    
    const trimmedName = name.trim();
    console.log('입력된 이름:', trimmedName);
    console.log('선택된 색상:', color);
    
    // friends 객체 안전성 확인
    if (!friends) {
      console.log('friends 객체 초기화');
      friends = {};
    }
    if (!friendsOrder) {
      console.log('friendsOrder 배열 초기화');
      friendsOrder = [];
    }
    
    console.log('현재 friends:', Object.keys(friends));
    
    // 가장 단순한 중복 검사 - 직접 확인
    let nameExists = false;
    
    // Object.keys 대신 직접 확인
    try {
      if (friends[trimmedName] !== undefined) {
        nameExists = true;
      }
    } catch (error) {
      console.error('중복 검사 오류:', error);
      nameExists = false;
    }
    
    console.log('중복 검사 결과:', nameExists);
    
    if (nameExists) {
      showAlertModal('이미 존재하는 이름입니다.', true);
      return;
    }
    
    // 친구 추가
    try {
      console.log('친구 추가 시작');
      
      friends[trimmedName] = {
        stamps: [],
        color: color || 'yellow'
      };
      
      friendsOrder.push(trimmedName);
      
      console.log('추가 완료 - friends:', Object.keys(friends));
      console.log('추가 완료 - order:', friendsOrder);
      
      // 저장
      await saveUserData();
      
      // UI 업데이트
      renderFolders();
      showAlertModal('성공적으로 추가되었습니다.', false);
      
    } catch (error) {
      console.error('친구 추가 실패:', error);
      
      // 롤백
      try {
        delete friends[trimmedName];
        const idx = friendsOrder.indexOf(trimmedName);
        if (idx > -1) friendsOrder.splice(idx, 1);
      } catch (rollbackError) {
        console.error('롤백 실패:', rollbackError);
      }
      
      showAlertModal('저장에 실패했습니다.<br>다시 시도해주세요.', true);
    }
  }, false, false, true);
};

// 드래그 앤 드롭 기능
let draggedElement = null;
let draggedIndex = -1;

function addDragEvents(folder, friendName, index) {
  folder.draggable = true;
  
  folder.addEventListener('dragstart', (e) => {
    draggedElement = folder;
    draggedIndex = index;
    folder.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  folder.addEventListener('dragend', () => {
    folder.classList.remove('dragging');
    draggedElement = null;
    draggedIndex = -1;
  });

  folder.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  });

  folder.addEventListener('drop', async (e) => {
    e.preventDefault();
    
    if (draggedElement && draggedIndex !== -1 && draggedIndex !== index) {
      const draggedName = friendsOrder[draggedIndex];
      
      // 배열에서 요소 이동
      friendsOrder.splice(draggedIndex, 1);
      
      // 새 위치 계산 (드래그된 요소가 앞에서 뒤로 이동하는 경우 인덱스 조정)
      let newIndex = index;
      if (draggedIndex < index) {
        newIndex = index - 1;
      }
      
      friendsOrder.splice(newIndex, 0, draggedName);
      
      console.log('이동 후 순서:', friendsOrder);
      
      try {
        await saveUserData();
        renderFolders();
      } catch (error) {
        console.error('순서 저장 실패:', error);
        showAlertModal('순서 변경 저장에 실패했습니다.', true);
      }
    }
  });
}

// 폴더 요소 생성 함수
function createFolderElement(name, index) {
  const folder = document.createElement('div');
  folder.className = 'folder';
  
  const friendData = friends[name];
  const color = friendData && friendData.color ? friendData.color : 'yellow';
  folder.classList.add(`folder-${color}`);
  
  folder.style.position = 'relative';
  folder.style.display = 'flex';
  folder.style.flexDirection = 'column';
  folder.style.alignItems = 'center';
  folder.style.cursor = 'pointer';

  folder.onclick = (e) => {
    if (!folder.classList.contains('dragging')) {
      openStampPage(name);
    }
  };

  const icon = document.createElement('img');
  icon.src = 'https://cdn-icons-png.flaticon.com/512/716/716784.png';
  icon.alt = 'folder';
  icon.style.width = '80px';

  const label = document.createElement('span');
  label.textContent = name;
  label.style.marginTop = '8px';
  label.style.fontSize = '20px';
  label.style.color = 'black';

  folder.appendChild(icon);
  folder.appendChild(label);
  
  // 드래그 이벤트 추가
  addDragEvents(folder, name, index);
  
  return folder;
}

// 색상별로 그룹핑
function groupFriendsByColor() {
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
}

// 폴더 목록 그리기
function renderFolders() {
  folderList.innerHTML = '';
  
  if (!friends || typeof friends !== 'object') {
    friends = {};
  }
  
  if (!Array.isArray(friendsOrder)) {
    friendsOrder = [];
  }
  
  // 순서 배열에 없는 친구들을 끝에 추가
  Object.keys(friends).forEach(name => {
    if (!friendsOrder.includes(name)) {
      friendsOrder.push(name);
    }
  });
  
  // 순서 배열에 있지만 friends에 없는 이름들 제거
  friendsOrder = friendsOrder.filter(name => friends[name]);
  
  const colorGroups = groupFriendsByColor();
  const colors = ['yellow', 'pink', 'blue'];
  
  console.log('색상별 그룹:', colorGroups);
  
  colors.forEach(color => {
    const friendsInColor = colorGroups[color];
    if (friendsInColor.length === 0) return;
    
    const colorGroup = document.createElement('div');
    colorGroup.className = 'color-group';
    
    if (window.innerWidth > 600) {
      // 데스크톱 버전: 5개씩 나열
      const rowsNeeded = Math.ceil(friendsInColor.length / 5);
      
      for (let row = 0; row < rowsNeeded; row++) {
        const rowContainer = document.createElement('div');
        rowContainer.style.display = 'flex';
        rowContainer.style.gap = '50px';
        rowContainer.style.marginBottom = row < rowsNeeded - 1 ? '40px' : '0';
        rowContainer.style.width = '100%';
        rowContainer.style.maxWidth = '1200px';
        rowContainer.style.margin = '0 auto';
        if (row > 0) rowContainer.style.marginTop = '40px';
        
        rowContainer.style.justifyContent = 'center';
        
        const startIndex = row * 5;
        const endIndex = Math.min(startIndex + 5, friendsInColor.length);
        
        for (let i = startIndex; i < endIndex; i++) {
          const { name, index } = friendsInColor[i];
          const folder = createFolderElement(name, index);
          rowContainer.appendChild(folder);
        }
        
        colorGroup.appendChild(rowContainer);
      }
    } else {
      // 모바일 버전: 2개씩 나열 (원래대로)
      colorGroup.style.display = 'grid';
      colorGroup.style.gridTemplateColumns = 'repeat(2, 1fr)';
      colorGroup.style.columnGap = '80px'; // 가로 간격만 조정
      colorGroup.style.rowGap = '25px'; // 세로 간격은 원래대로 유지
      colorGroup.style.justifyItems = 'center';
      
      friendsInColor.forEach(({ name, index }) => {
        const folder = createFolderElement(name, index);
        colorGroup.appendChild(folder);
      });
    }
    
    folderList.appendChild(colorGroup);
  });
}

// 폴더 클릭 → 스탬프 페이지
function openStampPage(name) {
  currentFriend = name;
  
  const friendData = friends[name];
  const stamps = friendData && friendData.stamps ? friendData.stamps : [];
  
  let targetPage = 0;
  if (stamps.length > 0) {
    const stampCount = stamps.length;
    targetPage = Math.floor((stampCount - 1) / maxStarsPerPage);
  }
  currentPage = targetPage;
  
  homeScreen.style.display = 'none';
  stampScreen.style.display = 'block'; 
  friendTitle.textContent = name; 
  
  setTimeout(() => {
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    
    if (prevButton) {
      prevButton.style.display = 'block';
      prevButton.style.visibility = 'visible';
      prevButton.style.opacity = '1';
    }
    
    if (nextButton) {
      nextButton.style.display = 'block';
      nextButton.style.visibility = 'visible';
      nextButton.style.opacity = '1';
    }
  }, 100);
  
  renderStamps();
  updateButtons();
}

function renderStamps() {
  const friendData = friends[currentFriend];
  const stamps = friendData && friendData.stamps ? friendData.stamps : [];
  const sorted = [...stamps].sort((a, b) => new Date(a) - new Date(b));

  const start = currentPage * maxStarsPerPage;
  const end = start + maxStarsPerPage;

  stampPagesContainer.innerHTML = '';
  const page = document.createElement('div');
  page.className = 'stamp-page';

  console.log('스탬프 렌더링:', {
    totalStamps: stamps.length,
    currentPage,
    start,
    end,
    maxStarsPerPage
  });

  for (let i = 0; i < maxStarsPerPage; i++) {
    const globalIndex = start + i;

    const wrapper = document.createElement('div');
    wrapper.style.textAlign = 'center';

    const star = document.createElement('span');
    star.className = 'star';
    star.innerHTML = '★';

    const thisStamp = sorted[globalIndex];
    if (thisStamp) star.classList.add('filled');

    star.onclick = () => {
      showModal(
        thisStamp ? "change date" : "date", 
        thisStamp || getCurrentDate(), 
        async (date, isDelete) => {
          if (isDelete && thisStamp) {
            const originalIndex = stamps.indexOf(thisStamp);
            if (originalIndex !== -1) {
              stamps.splice(originalIndex, 1);
              renderStamps();
              updateButtons();
              await autoSave();
            }
          } else if (date && date.trim()) {
            if (thisStamp) {
              const originalIndex = stamps.indexOf(thisStamp);
              stamps[originalIndex] = date.trim();
            } else {
              stamps.push(date.trim());

              const total = stamps.length;
              const newTotalPages = Math.ceil(total / maxStarsPerPage);
              if (globalIndex + 1 === total) {
                currentPage = newTotalPages - 1;
              }
            }

            renderStamps();
            updateButtons();
            await autoSave();
          }
        },
        true,
        !!thisStamp,
        false // 색상 선택기 숨김
      );
    };

    wrapper.appendChild(star);

    if (thisStamp) {
      const date = document.createElement('div');
      date.className = 'date-label';
      date.textContent = thisStamp;
      wrapper.appendChild(date);
    }

    page.appendChild(wrapper);
  }

  stampPagesContainer.appendChild(page);
}

function getTotalPages() {
  const friendData = friends[currentFriend];
  const stamps = friendData && friendData.stamps ? friendData.stamps : [];
  const totalPages = Math.max(1, Math.ceil(stamps.length / maxStarsPerPage));
  console.log('총 페이지 계산:', {
    friend: currentFriend,
    stampsCount: stamps.length,
    maxStarsPerPage,
    totalPages
  });
  return totalPages;
}

// 페이지 전환
function changePage(offset) {
  currentPage += offset;
  renderStamps();
  updateButtons();
}

function updateButtons() {
  const prevButton = document.getElementById('prevPage');
  const nextButton = document.getElementById('nextPage');
  
  console.log('updateButtons 호출됨');
  
  if (prevButton) {
    prevButton.style.display = 'block';
    prevButton.style.visibility = 'visible';
    prevButton.style.opacity = '1';
    if (currentPage === 0) {
      prevButton.style.opacity = '0.3';
    } else {
      prevButton.style.opacity = '1';
    }
  }
  
  if (nextButton) {
    nextButton.style.display = 'block';
    nextButton.style.visibility = 'visible';
    nextButton.style.opacity = '1';
    if (currentPage >= getTotalPages() - 1) {
      nextButton.style.opacity = '0.3';
    } else {
      nextButton.style.opacity = '1';
    }
  }
}

// 전역에서 사용할 수 있도록 설정
window.changePage = changePage;

// delete 버튼 기능
deleteFriendBtn.onclick = () => {
  // 이미 삭제 모달이 열려있으면 무시
  if (isDeleteModalOpen) {
    console.log('삭제 모달이 이미 열려있음 - 무시');
    return;
  }
  
  if (!friends || typeof friends !== 'object') {
    friends = {};
  }
  
  if (friendsOrder.length === 0) {
    showAlertModal('삭제할 파일이 없습니다.', false);
    return;
  }

  isDeleteModalOpen = true; // 삭제 모달 열림 상태로 설정
  
  const reversedFriendNames = [...friendsOrder].reverse();

  const modalDiv = document.createElement('div');
  modalDiv.className = 'modal';
  modalDiv.style.display = 'flex';
  modalDiv.style.alignItems = 'center';
  modalDiv.style.justifyContent = 'center';
  modalDiv.style.zIndex = '2000';
  modalDiv.innerHTML = `
    <div class="modal-content" style="display:flex;flex-direction:column;align-items:center;">
      <span class="modal-close" style="position:absolute;right:20px;top:10px;font-size:24px;cursor:pointer;">&times;</span>
      <h2 style="margin-bottom:24px;">Which file do you want to delete?</h2>
      <select id="delete-select" style="font-size:18px;padding:8px;width:80%;margin-bottom:32px;border-radius:8px;border:1px solid #ccc;">
        ${reversedFriendNames.map(n => `<option value="${n}">${n}</option>`).join('')}
      </select>
      <button id="delete-confirm" style="font-size:18px;padding:12px 40px;background:#ffccdd;color:black;border:none;border-radius:12px;cursor:pointer;font-family:'Spicy Rice','Gowun Dodum',cursive,sans-serif;margin-top:12px;">OK</button>
    </div>
  `;
  document.body.appendChild(modalDiv);
  
  const deleteSelect = modalDiv.querySelector('#delete-select');
  const deleteConfirmBtn = modalDiv.querySelector('#delete-confirm');
  const closeBtn = modalDiv.querySelector('.modal-close');
  
  // 모달 닫기 함수
  const closeDeleteModal = () => {
    if (document.body.contains(modalDiv)) {
      document.body.removeChild(modalDiv);
    }
    isDeleteModalOpen = false; // 삭제 모달 닫힘 상태로 설정
  };
  
  // 삭제 실행 함수 - 한 번만 실행되도록 플래그 추가
  let isDeleting = false;
  const executeDelete = async () => {
    if (isDeleting) {
      console.log('이미 삭제 중 - 무시');
      return;
    }
    
    isDeleting = true;
    
    const sel = deleteSelect.value;
    
    console.log('=== 친구 삭제 시작 ===');
    console.log('삭제할 친구:', sel);
    
    // 백업
    const backupData = friends[sel];
    const orderIndex = friendsOrder.indexOf(sel);
    
    // friends 객체에서 삭제
    delete friends[sel];
    
    // friendsOrder에서도 삭제
    if (orderIndex > -1) {
      friendsOrder.splice(orderIndex, 1);
    }
    
    console.log('삭제 후 friends 객체:', Object.keys(friends));
    console.log('삭제 후 friendsOrder:', friendsOrder);
    
    try {
      console.log('저장 중...');
      await saveUserData();
      console.log('=== 친구 삭제 완료 ===');
      
      renderFolders();
      showAlertModal('성공적으로 삭제되었습니다.', false);
    } catch (error) {
      console.error('삭제 저장 실패:', error);
      // 롤백
      friends[sel] = backupData;
      if (orderIndex > -1) {
        friendsOrder.splice(orderIndex, 0, sel);
      }
      showAlertModal('삭제에 실패했습니다.<br>다시 시도해주세요.', true);
    }
    
    closeDeleteModal();
  };
  
  // 엔터키 이벤트 - once: true 옵션으로 한 번만 실행
  deleteSelect.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      console.log('엔터키로 삭제 실행');
      executeDelete();
    }
  });
  
  // 버튼 클릭 이벤트
  deleteConfirmBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('버튼으로 삭제 실행');
    executeDelete();
  });
  
  // 닫기 이벤트
  closeBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    closeDeleteModal();
  });
  
  // 배경 클릭 시 닫기
  modalDiv.addEventListener('click', function(e) {
    if (e.target === modalDiv) {
      closeDeleteModal();
    }
  });
  
  // 포커스를 select 요소에 설정
  setTimeout(() => {
    deleteSelect.focus();
  }, 100);
};

// edit 버튼 기능
const editFriendBtn = document.getElementById('edit-friend');
editFriendBtn.onclick = () => {
  if (!currentFriend) return;
  
  const currentFriendData = friends[currentFriend];
  const currentColor = currentFriendData && currentFriendData.color ? currentFriendData.color : 'yellow';
  
  showModal("Edit file's name", currentFriend, async (newName, isDelete, newColor) => {
    if (newName && newName.trim() && (newName.trim() !== currentFriend || newColor !== currentColor)) {
      const trimmedName = newName.trim();
      
      // 이름이 변경되었는데 이미 존재하는 이름인지 확인
      if (trimmedName !== currentFriend && friends[trimmedName]) {
        showAlertModal('이미 존재하는 파일 이름입니다.', true);
        return;
      }
      
      console.log('=== 친구 정보 수정 시작 ===');
      console.log('변경 전 이름:', currentFriend);
      console.log('변경 후 이름:', trimmedName);
      console.log('변경 전 색상:', currentColor);
      console.log('변경 후 색상:', newColor);
      
      // 백업
      const oldFriend = currentFriend;
      const friendData = friends[currentFriend];
      const orderIndex = friendsOrder.indexOf(currentFriend);
      
      if (trimmedName !== currentFriend) {
        // 이름이 변경된 경우
        delete friends[oldFriend];
        friends[trimmedName] = {
          stamps: friendData.stamps || [],
          color: newColor || currentColor
        };
        
        // 순서에서도 변경
        if (orderIndex > -1) {
          friendsOrder[orderIndex] = trimmedName;
        }
      } else {
        // 이름은 같고 색상만 변경된 경우
        friends[currentFriend].color = newColor;
      }
      
      // 현재 상태 업데이트
      currentFriend = trimmedName;
      friendTitle.textContent = trimmedName;
      
      try {
        console.log('저장 중...');
        await saveUserData();
        console.log('=== 친구 정보 수정 완료 ===');
        
        renderFolders();
        showAlertModal('정보가 성공적으로 변경되었습니다.', false);
      } catch (error) {
        console.error('저장 실패, 롤백 중:', error);
        // 롤백
        if (trimmedName !== oldFriend) {
          delete friends[trimmedName];
          friends[oldFriend] = friendData;
          if (orderIndex > -1) {
            friendsOrder[orderIndex] = oldFriend;
          }
        } else {
          friends[currentFriend].color = currentColor;
        }
        currentFriend = oldFriend;
        friendTitle.textContent = oldFriend;
        showAlertModal('저장에 실패했습니다.<br>다시 시도해주세요.', true);
      }
    }
  }, false, false, true);
};

// 페이지 로드 시 초기화
window.addEventListener('load', () => {
  setupEventListeners();
  initAuthListener();
});

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initAuthListener();
});

// 페이지를 떠날 때 마지막으로 저장
window.addEventListener('beforeunload', async () => {
  if (currentUser) {
    await saveUserData();
  }
});

// 30초마다 자동저장 제거 - 이제 즉시 저장으로 변경됨
// setInterval(async () => {
//   if (currentUser) {
//     await autoSave();
//   }
// }, 30000);