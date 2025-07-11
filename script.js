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
  return new Promise((resolve) => {
    const checkFirebase = () => {
      if (window.auth && window.db) {
        resolve();
      } else {
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

// 모달 함수 정의 (delete 버튼 포함)
function showModal(title, defaultValue, callback, isDateModal = false, hasExistingDate = false) {
  console.log('모달 호출:', { title, defaultValue, isDateModal, hasExistingDate });
  
  document.getElementById('modal-title').textContent = title;
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
    console.log('Delete 버튼 생성');
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
        showAlertModal('날짜를 YYYY-MM-DD 형식으로 입력해주세요.<br>(예: 2025-01-15)', true);
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
      console.log('Delete 클릭');
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

  if (!window.auth || !window.db) {
    showAlertModal('Firebase 설정이 완료되지 않았습니다. 임시로 회원가입합니다. 이제 로그인해주세요!', false);
    return;
  }

  setLoading(true);
  
  try {
    const userCredential = await window.createUserWithEmailAndPassword(window.auth, email, password);
    
    await window.setDoc(window.doc(window.db, 'users', userCredential.user.uid), {
      email: email,
      friends: {},
      createdAt: new Date().toISOString()
    });

    showAlertModal('회원가입이 완료되었습니다!', false);
  } catch (error) {
    console.error('회원가입 오류:', error);
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
        showAlertModal('회원가입 중 오류가 발생했습니다. Firebase 설정을 확인해주세요.', true);
    }
  } finally {
    setLoading(false);
  }
}

// 로그인 기능
async function handleLogin() {
  const email = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  
  console.log('로그인 시도:', email);
  console.log('Firebase Auth 상태:', !!window.auth);
  console.log('Firebase DB 상태:', !!window.db);
  
  if (!email || !password) {
    showAlertModal('이메일과 비밀번호를 모두 입력해주세요.', true);
    return;
  }

  setLoading(true);

  if (!window.auth || !window.db) {
    console.log('Firebase 미연결');
    showAlertModal('Firebase가 아직 로드되지 않았습니다. 임시 모드로 로그인합니다.', false);
    currentUser = { uid: 'temp-user-' + Date.now(), email: email };
    friends = {};
    showMainScreen();
    setLoading(false);
    return;
  }
  
  try {
    console.log('Firebase 로그인 시도 시작');
    const userCredential = await window.signInWithEmailAndPassword(window.auth, email, password);
    console.log('로그인 성공:', userCredential.user.email);
  } catch (error) {
    console.error('로그인 오류 상세:', error);
    console.log('오류 코드:', error.code);
    console.log('오류 메시지:', error.message);
    
    if (error.code === 'auth/configuration-not-found' || 
        error.code === 'auth/invalid-api-key' ||
        error.message.includes('Firebase')) {
      showAlertModal('Firebase Authentication이 설정되지 않았습니다. 임시 모드로 로그인합니다.', false);
      currentUser = { uid: 'temp-user-' + Date.now(), email: email };
      friends = {};
      showMainScreen();
    } else {
      switch (error.code) {
        case 'auth/user-not-found':
          showAlertModal('존재하지 않는 사용자입니다. 먼저 회원가입을 해주세요.', true);
          break;
        case 'auth/wrong-password':
          showAlertModal('비밀번호가 올바르지 않습니다.', true);
          break;
        case 'auth/invalid-email':
          showAlertModal('올바르지 않은 이메일 형식입니다.', true);
          break;
        case 'auth/too-many-requests':
          showAlertModal('너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.', true);
          break;
        case 'auth/invalid-credential':
          showAlertModal('잘못된 로그인 정보입니다. 이메일과 비밀번호를 확인해주세요.', true);
          break;
        default:
          showAlertModal(`로그인 중 오류가 발생했습니다: ${error.code} - ${error.message}`, true);
      }
    }
  } finally {
    setLoading(false);
  }
}

// 로그아웃 기능
window.handleLogout = async function() {
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
  if (currentUser) {
    try {
      await window.setDoc(window.doc(window.db, 'users', currentUser.uid), {
        email: currentUser.email,
        friends: friends,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      console.log('데이터가 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('데이터 저장 오류:', error);
      
      if (error.code === 'permission-denied') {
        showAlertModal('데이터 저장 권한이 없습니다. Firebase 보안 규칙을 확인해주세요.', true);
      } else if (error.code === 'unavailable') {
        console.log('Firestore 일시적으로 사용 불가, 재시도합니다.');
        setTimeout(() => saveUserData(), 2000);
      } else {
        console.log('저장 오류 발생, 로컬에 임시 저장합니다.');
      }
    }
  }
}

// 사용자 데이터 로드
async function loadUserData() {
  if (currentUser) {
    try {
      const docRef = window.doc(window.db, 'users', currentUser.uid);
      const docSnap = await window.getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        friends = userData.friends || {};
        console.log('데이터 로드 완료:', Object.keys(friends).length, '개의 친구');
      } else {
        console.log('사용자 문서가 존재하지 않습니다. 새 문서를 생성합니다.');
        friends = {};
        await saveUserData();
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      
      if (error.code === 'permission-denied') {
        showAlertModal('데이터 접근 권한이 없습니다. Firebase 보안 규칙을 확인해주세요.', true);
        friends = {};
      } else if (error.code === 'unavailable') {
        console.log('Firestore 일시적으로 사용 불가, 빈 데이터로 시작합니다.');
        friends = {};
      } else {
        console.log('로드 오류 발생, 빈 데이터로 시작합니다.');
        friends = {};
      }
    }
  }
}

// 인증 상태 변화 감지
async function initAuthListener() {
  await waitForFirebase();
  
  window.onAuthStateChanged(window.auth, async (user) => {
    if (user) {
      console.log('사용자 로그인됨:', user.email);
      currentUser = user;
      await loadUserData();
      showMainScreen();
    } else {
      console.log('사용자 로그아웃됨');
      currentUser = null;
      friends = {};
      showLoginScreen();
      
      if (usernameInput) usernameInput.value = '';
      if (passwordInput) passwordInput.value = '';
    }
  });
}

// 이벤트 리스너 설정
function setupEventListeners() {
  if (loginBtn) loginBtn.addEventListener('click', handleLogin);
  if (signupBtn) signupBtn.addEventListener('click', handleSignup);
  if (logoutBtn) logoutBtn.addEventListener('click', window.handleLogout);

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

// 자동 저장 함수
async function autoSave() {
  if (currentUser) {
    await saveUserData();
  }
}

// add friend 버튼
addFriendBtn.onclick = () => {
  showModal("Write your friend's name!", "", async (name) => {
    if (name && !friends[name]) {
      friends[name] = [];
      renderFolders();
      await autoSave();
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
  
  const friendNames = Object.keys(friends);
  const totalFolders = friendNames.length;
  
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
  currentPage = 0;
  homeScreen.style.display = 'none';
  stampScreen.style.display = 'block';
  friendTitle.textContent = name;
  renderStamps();
  updateButtons();
}

function renderStamps() {
  const stamps = friends[currentFriend];
  const sorted = [...stamps].sort((a, b) => new Date(a) - new Date(b));

  const start = currentPage * maxStarsPerPage;
  const end = start + maxStarsPerPage;

  stampPagesContainer.innerHTML = '';
  const page = document.createElement('div');
  page.className = 'stamp-page';

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
          } else if (date) {
            if (thisStamp) {
              const originalIndex = stamps.indexOf(thisStamp);
              stamps[originalIndex] = date;
            } else {
              stamps.push(date);

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
  return Math.max(1, Math.ceil(stamps.length / maxStarsPerPage));
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
  
  if (prevButton) {
    prevButton.style.visibility = currentPage === 0 ? "hidden" : "visible";
  }
  
  if (nextButton) {
    nextButton.style.visibility = currentPage >= getTotalPages() - 1 ? "hidden" : "visible";
  }
}

window.changePage = changePage;

// 홈으로 돌아가기
backButton.onclick = () => {
  stampScreen.style.display = 'none';
  homeScreen.style.display = 'block';
};

// delete 버튼 기능
deleteFriendBtn.onclick = () => {
  const friendNames = Object.keys(friends);
  if (friendNames.length === 0) {
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal';
    modalDiv.style.display = 'flex';
    modalDiv.style.alignItems = 'center';
    modalDiv.style.justifyContent = 'center';
    modalDiv.style.zIndex = '2000';
    modalDiv.innerHTML = `
      <div class="modal-content" style="display:flex;flex-direction:column;align-items:center;">
        <span class="modal-close" style="position:absolute;right:20px;top:10px;font-size:24px;cursor:pointer;">&times;</span>
        <h2 style="margin-bottom:24px;">There is no file to delete.</h2>
      </div>
    `;
    document.body.appendChild(modalDiv);
    modalDiv.querySelector('.modal-close').onclick = () => document.body.removeChild(modalDiv);
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
    delete friends[sel];
    renderFolders();
    await autoSave();
    document.body.removeChild(modalDiv);
  };
};

// edit 버튼 기능
const editFriendBtn = document.getElementById('edit-friend');
editFriendBtn.onclick = () => {
  if (!currentFriend) return;
  showModal("Edit friend's name", currentFriend, async (newName) => {
    if (newName && newName !== currentFriend) {
      friends[newName] = friends[currentFriend];
      delete friends[currentFriend];
      currentFriend = newName;
      friendTitle.textContent = newName;
      renderFolders();
      await autoSave();
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