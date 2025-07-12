// 전역 변수
let currentUser = null;
let friends = {};
let currentFriend = null;
let currentPage = 0;
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

// 로그인 관련 DOM 요소
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const errorMessage = document.getElementById('error-message');
const loading = document.getElementById('loading');

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
  
  // 닫기 이벤트
  const closeModal = () => document.body.removeChild(modalDiv);
  modalDiv.querySelector('.modal-close').onclick = closeModal;
  modalDiv.querySelector('button').onclick = closeModal;
  
  // 배경 클릭 시 닫기
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
    const maxAttempts = 50; // 5초 대기
    
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
function showModal(title, defaultValue, callback, isDateModal = false, hasExistingDate = false) {
  document.getElementById('modal-title').textContent = title;
  
  // date 또는 change date 모달인 경우 설명 추가
  if (title === "change date" || title === "date") {
    document.getElementById('modal-title').innerHTML = title + '<br><small style="font-size:14px;color:#666;font-weight:normal;">(yyyy-mm-dd)</small>';
  }
  
  modalInput.value = defaultValue;
  modal.classList.remove('hidden');
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

  // Delete 버튼 (조건 확인)
  let deleteButton = null;
  if (title === "change date" && hasExistingDate) {
    deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.style.cssText = 'font-size: 18px; padding: 8px 20px; background: #ff6b6b; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: "Spicy Rice", "Gowun Dodum", cursive, sans-serif;';
  }

  // OK 버튼 이벤트
  okButton.onclick = () => {
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

    modal.classList.add('hidden');
    callback(inputValue, false);
  };

  // Delete 버튼 이벤트
  if (deleteButton) {
    deleteButton.onclick = () => {
      modal.classList.add('hidden');
      callback(null, true);
    };
  }

  modalClose.onclick = () => modal.classList.add('hidden');

  modalInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      okButton.click();
    } else if (e.key === 'Escape') {
      modal.classList.add('hidden');
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
    
    // merge: false로 설정하여 전체 문서를 덮어쓰기
    await window.setDoc(window.doc(window.db, 'users', currentUser.uid), {
      email: currentUser.email,
      friends: friends,
      lastUpdated: new Date().toISOString()
    }, { merge: false }); // 전체 덮어쓰기
    
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
      console.log('로드된 friends 데이터:', loadedFriends);
      console.log('로드된 friends 타입:', typeof loadedFriends);
      
      if (loadedFriends && typeof loadedFriends === 'object') {
        friends = { ...loadedFriends }; // 객체 복사
      } else {
        friends = {};
      }
      
      console.log('최종 설정된 friends:', friends);
      console.log('friends의 키들:', Object.keys(friends));
    } else {
      console.log('사용자 문서가 존재하지 않습니다. 새 문서를 생성합니다.');
      friends = {};
      await saveUserData();
    }
    
    console.log('=== 데이터 로드 완료 ===');
  } catch (error) {
    console.error('데이터 로드 오류:', error);
    friends = {};
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
        
        // friends 객체 초기화
        friends = {};
        
        try {
          await loadUserData();
          console.log('로그인 후 friends 상태:', friends);
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

// 자동 저장 함수
async function autoSave() {
  if (currentUser) {
    try {
      console.log('자동 저장 시작...');
      await saveUserData();
      console.log('자동 저장 완료');
    } catch (error) {
      console.error('자동 저장 실패:', error);
      showAlertModal('저장에 실패했습니다.<br>네트워크를 확인해주세요.', true);
    }
  } else {
    console.error('자동 저장 실패: 사용자가 로그인되지 않음');
  }
}

// add friend 버튼
addFriendBtn.onclick = () => {
  console.log('=== ADD FRIEND 버튼 클릭 ===');
  console.log('현재 friends 상태:', friends);
  console.log('friends 타입:', typeof friends);
  console.log('friends가 null인가?', friends === null);
  console.log('friends가 undefined인가?', friends === undefined);
  
  showModal("Write your friend's name!", "", async (name) => {
    if (name && name.trim()) {
      const trimmedName = name.trim();
      
      console.log('=== 친구 추가 과정 시작 ===');
      console.log('입력된 이름:', `"${trimmedName}"`);
      console.log('현재 friends:', friends);
      
      // friends가 undefined이거나 null인 경우 빈 객체로 초기화
      if (!friends || typeof friends !== 'object') {
        console.log('friends 객체 초기화 중...');
        friends = {};
      }
      
      console.log('초기화 후 friends:', friends);
      console.log('friends의 키들:', Object.keys(friends));
      
      // 각 키와 비교
      const existingKeys = Object.keys(friends);
      for (let key of existingKeys) {
        console.log(`키 "${key}"와 입력값 "${trimmedName}" 비교:`, key === trimmedName);
      }
      
      const alreadyExists = !!friends[trimmedName];
      console.log('이미 존재하는가?', alreadyExists);
      
      if (alreadyExists) {
        console.log('중복 이름으로 판단되어 경고 표시');
        showAlertModal('이미 존재하는 친구 이름입니다.', true);
        return;
      }
      
      console.log('새 친구 추가 진행');
      friends[trimmedName] = [];
      
      console.log('추가 후 friends 객체:', friends);
      console.log('추가 후 friends의 키들:', Object.keys(friends));
      
      try {
        await saveUserData();
        console.log('친구 추가 저장 완료');
        renderFolders();
        showAlertModal('친구가 성공적으로 추가되었습니다.', false);
      } catch (error) {
        console.error('친구 추가 저장 실패:', error);
        // 롤백
        delete friends[trimmedName];
        showAlertModal('저장에 실패했습니다.<br>다시 시도해주세요.', true);
      }
    } else {
      console.log('빈 이름 입력됨');
    }
  }, false, false);
};

// 폴더 요소 생성 함수
function createFolderElement(name) {
  const folder = document.createElement('div');
  folder.className = 'folder';
  folder.style.position = 'relative';
  folder.style.display = 'flex';
  folder.style.flexDirection = 'column';
  folder.style.alignItems = 'center';
  folder.style.cursor = 'pointer';

  folder.onclick = () => openStampPage(name);

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
  
  return folder;
}

// 폴더 목록 그리기
function renderFolders() {
  folderList.innerHTML = '';
  
  // friends가 올바른 객체인지 확인
  if (!friends || typeof friends !== 'object') {
    friends = {};
  }
  
  const friendNames = Object.keys(friends);
  const totalFolders = friendNames.length;
  
  console.log('renderFolders 호출:', friendNames);
  
  if (window.innerWidth > 600) {
    const rowsNeeded = Math.ceil(totalFolders / 5);
    
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
      const endIndex = Math.min(startIndex + 5, totalFolders);
      
      for (let i = startIndex; i < endIndex; i++) {
        const name = friendNames[i];
        const folder = createFolderElement(name);
        rowContainer.appendChild(folder);
      }
      
      folderList.appendChild(rowContainer);
    }
  } else {
    folderList.style.display = 'grid';
    folderList.style.gridTemplateColumns = 'repeat(2, 1fr)';
    folderList.style.gap = '25px';
    folderList.style.justifyItems = 'center';
    
    for (const name of friendNames) {
      const folder = createFolderElement(name);
      folderList.appendChild(folder);
    }
  }
}

// 폴더 클릭 → 스탬프 페이지
function openStampPage(name) {
  currentFriend = name;
  
  // 스탬프 개수에 따라 마지막 페이지로 이동 (새로 추가된 부분)
  const stamps = friends[name] || [];
  const totalStamps = stamps.length;
  const lastPageWithStamp = Math.max(0, Math.floor((totalStamps - 1) / maxStarsPerPage));
  currentPage = totalStamps > 0 ? lastPageWithStamp : 0;
  
  homeScreen.style.display = 'none';
  stampScreen.style.display = 'block'; 
  friendTitle.textContent = name; 
  
  // 버튼 강제로 보이게 만들기
  setTimeout(() => {
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    
    console.log('openStampPage에서 버튼 확인:');
    console.log('prevButton:', prevButton);
    console.log('nextButton:', nextButton);
    
    if (prevButton) {
      prevButton.style.display = 'block';
      prevButton.style.visibility = 'visible';
      prevButton.style.opacity = '1';
      console.log('← 버튼 강제 표시됨');
    }
    
    if (nextButton) {
      nextButton.style.display = 'block';
      nextButton.style.visibility = 'visible';
      nextButton.style.opacity = '1';
      console.log('→ 버튼 강제 표시됨');
    }
  }, 100);
  
  renderStamps();
  updateButtons();
}

function renderStamps() {
  const stamps = friends[currentFriend] || [];
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
        !!thisStamp
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
  const stamps = friends[currentFriend] || [];
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
  console.log('prevButton:', prevButton);
  console.log('nextButton:', nextButton);
  
  // 버튼 강제로 보이게 만들기
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

// 이벤트 리스너 설정 (기존 코드 제거)
// prevBtn.onclick = () => changePage(-1);
// nextBtn.onclick = () => changePage(1);

// 홈으로 돌아가기 (setupEventListeners로 이동됨)
// backButton.onclick = () => {
//   stampScreen.style.display = 'none';
//   homeScreen.style.display = 'block';
// };

// delete 버튼 기능
deleteFriendBtn.onclick = () => {
  // friends가 올바른 객체인지 확인
  if (!friends || typeof friends !== 'object') {
    friends = {};
  }
  
  const friendNames = Object.keys(friends);
  if (friendNames.length === 0) {
    showAlertModal('삭제할 친구가 없습니다.', false);
    return;
  }

  const reversedFriendNames = [...friendNames].reverse();

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
  
  modalDiv.querySelector('.modal-close').onclick = () => document.body.removeChild(modalDiv);
  modalDiv.querySelector('#delete-confirm').onclick = async () => {
    const sel = modalDiv.querySelector('#delete-select').value;
    
    console.log('=== 친구 삭제 시작 ===');
    console.log('삭제할 친구:', sel);
    console.log('삭제 전 friends 객체:', Object.keys(friends));
    
    // 백업
    const backupData = friends[sel];
    
    // 새로운 friends 객체 생성 (삭제할 친구 제외)
    const newFriends = {};
    Object.keys(friends).forEach(key => {
      if (key !== sel) {
        newFriends[key] = [...friends[key]];
      }
    });
    
    // friends 객체 교체
    friends = newFriends;
    
    console.log('삭제 후 friends 객체:', Object.keys(friends));
    console.log('전체 friends:', friends);
    
    try {
      console.log('저장 중...');
      await saveUserData();
      console.log('=== 친구 삭제 완료 ===');
      
      renderFolders();
      showAlertModal('친구가 성공적으로 삭제되었습니다.', false);
    } catch (error) {
      console.error('삭제 저장 실패:', error);
      // 롤백
      friends[sel] = backupData;
      showAlertModal('삭제에 실패했습니다.<br>다시 시도해주세요.', true);
    }
    
    document.body.removeChild(modalDiv);
  };
};

// edit 버튼 기능
const editFriendBtn = document.getElementById('edit-friend');
editFriendBtn.onclick = () => {
  if (!currentFriend) return;
  showModal("Edit friend's name", currentFriend, async (newName) => {
    if (newName && newName.trim() && newName.trim() !== currentFriend) {
      const trimmedName = newName.trim();
      if (friends[trimmedName]) {
        showAlertModal('이미 존재하는 친구 이름입니다.', true);
        return;
      }
      
      console.log('=== 친구 이름 수정 시작 ===');
      console.log('변경 전:', currentFriend);
      console.log('변경 후:', trimmedName);
      console.log('변경 전 friends 객체:', Object.keys(friends));
      
      // 백업
      const oldFriend = currentFriend;
      const friendData = [...friends[currentFriend]];
      
      // 새로운 friends 객체 생성 (완전히 새로 만들기)
      const newFriends = {};
      Object.keys(friends).forEach(key => {
        if (key === oldFriend) {
          newFriends[trimmedName] = [...friends[key]];
        } else {
          newFriends[key] = [...friends[key]];
        }
      });
      
      // friends 객체 교체
      friends = newFriends;
      
      console.log('변경 후 friends 객체:', Object.keys(friends));
      console.log('전체 friends:', friends);
      
      // 현재 상태 업데이트
      currentFriend = trimmedName;
      friendTitle.textContent = trimmedName;
      
      try {
        // 강제 저장
        console.log('저장 중...');
        await saveUserData();
        console.log('=== 친구 이름 수정 완료 ===');
        
        // 화면 업데이트
        renderFolders();
        
        showAlertModal('친구 이름이 성공적으로 변경되었습니다.', false);
      } catch (error) {
        // 실패 시 롤백
        console.error('저장 실패, 롤백 중:', error);
        const rollbackFriends = {};
        Object.keys(newFriends).forEach(key => {
          if (key === trimmedName) {
            rollbackFriends[oldFriend] = friendData;
          } else {
            rollbackFriends[key] = [...newFriends[key]];
          }
        });
        friends = rollbackFriends;
        currentFriend = oldFriend;
        friendTitle.textContent = oldFriend;
        showAlertModal('저장에 실패했습니다.<br>다시 시도해주세요.', true);
      }
    }
  }, false, false);
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

// 주기적 자동 저장 (30초마다)
setInterval(async () => {
  if (currentUser) {
    await autoSave();
  }
}, 30000);