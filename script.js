const folderList = document.getElementById('folder-list');
const addFriendBtn = document.getElementById('add-friend');
const homeScreen = document.getElementById('home-screen');
const stampScreen = document.getElementById('stamp-screen');
const friendTitle = document.getElementById('friend-title');

const stampPagesContainer = document.getElementById('stamp-pages');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const backButton = document.getElementById('back-button');

const modal = document.getElementById('modal');
const modalInput = document.getElementById('modal-input');
const modalConfirm = document.getElementById('modal-confirm');
const modalClose = document.getElementById('modal-close');

let friends = {};
let currentFriend = null;
let currentPage = 0;
const maxStarsPerPage = 10;

// add friend 버튼
addFriendBtn.onclick = () => {
  showModal("Write your friend's name!", "", (name) => {
    if (name && !friends[name]) {
      friends[name] = [];
      renderFolders();
    }
  });
};

// 모달 함수 정의
function showModal(title, defaultValue, callback) {
  document.getElementById('modal-title').textContent = title;
  modalInput.value = defaultValue;
  modal.classList.remove('hidden');
  modalInput.focus();

  modalConfirm.onclick = () => {
    modal.classList.add('hidden');
    let inputValue = modalInput.value.trim();

    // 날짜 자동 포맷 (YYYY-MM-DD)
    if (/^\\d{4}-\\d{1,2}-\\d{1,2}$/.test(inputValue)) {
      const [y, m, d] = inputValue.split('-');
      inputValue = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    callback(inputValue);
  };

  modalClose.onclick = () => modal.classList.add('hidden');

  modalInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      modalConfirm.click();
    } else if (e.key === 'Escape') {
      modal.classList.add('hidden');
    }
  };
}

// 폴더 목록 그리기
function renderFolders() {
  folderList.innerHTML = '';
  for (const name in friends) {
    const folder = document.createElement('div');
    folder.className = 'folder';
    folder.style.position = 'relative';

    folder.onclick = () => openStampPage(name);

    const icon = document.createElement('img');
    icon.src = 'https://cdn-icons-png.flaticon.com/512/716/716784.png';
    icon.alt = 'folder';

    const label = document.createElement('span');
    label.textContent = name;

    folder.appendChild(icon);
    folder.appendChild(label);
    folderList.appendChild(folder);
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

  // 날짜 정렬 (원본은 그대로 두고 복사본 기준)
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
      showModal(thisStamp ? "change date" : "date", thisStamp || new Date().toISOString().slice(0, 10), (date) => {
        if (date) {
          if (thisStamp) {
            const originalIndex = stamps.indexOf(thisStamp);
            stamps[originalIndex] = date;
          } else {
            stamps.push(date);

            // ⭐ 10개 넘기면 다음 페이지로 이동
            const total = stamps.length;
            const newTotalPages = Math.ceil(total / maxStarsPerPage);
            if (globalIndex + 1 === total) {
              currentPage = newTotalPages - 1;
            }
          }

          renderStamps();
          updateButtons();
        }
      });
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

  prevBtn.style.visibility = currentPage === 0 ? "hidden" : "visible";
  nextBtn.style.visibility = currentPage >= getTotalPages() - 1 ? "hidden" : "visible";

}



// 홈으로 돌아가기
backButton.onclick = () => {
  stampScreen.style.display = 'none';
  homeScreen.style.display = 'block';
};

// delete 버튼 기능 추가
const deleteFriendBtn = document.getElementById('delete-friend');
deleteFriendBtn.onclick = () => {
  // 삭제할 친구 선택 모달
  const friendNames = Object.keys(friends);
  if (friendNames.length === 0) {
    // 안내 모달
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal';
    modalDiv.style.display = 'flex';
    modalDiv.style.alignItems = 'center';
    modalDiv.style.justifyContent = 'center';
    modalDiv.style.zIndex = '2000';
    modalDiv.innerHTML = `
      <div class=\"modal-content\" style=\"display:flex;flex-direction:column;align-items:center;\">\n        <span class=\"modal-close\" style=\"position:absolute;right:20px;top:10px;font-size:24px;cursor:pointer;\">&times;</span>\n        <h2 style=\"margin-bottom:24px;\">There is no file to delete.</h2>\n      </div>\n    `;
    document.body.appendChild(modalDiv);
    modalDiv.querySelector('.modal-close').onclick = () => document.body.removeChild(modalDiv);
    return;
  }
  // 커스텀 모달 생성
  const modalDiv = document.createElement('div');
  modalDiv.className = 'modal';
  modalDiv.style.display = 'flex';
  modalDiv.style.alignItems = 'center';
  modalDiv.style.justifyContent = 'center';
  modalDiv.style.zIndex = '2000';
  modalDiv.innerHTML = `
    <div class=\"modal-content\" style=\"display:flex;flex-direction:column;align-items:center;\">\n      <span class=\"modal-close\" style=\"position:absolute;right:20px;top:10px;font-size:24px;cursor:pointer;\">&times;</span>\n      <h2 style=\"margin-bottom:24px;\">Which file do you want to delete?</h2>\n      <select id=\"delete-select\" style=\"font-size:18px;padding:8px;width:80%;margin-bottom:32px;border-radius:8px;border:1px solid #ccc;\">\n        ${friendNames.map(n => `<option value=\"${n}\">${n}</option>`).join('')}\n      </select>\n      <button id=\"delete-confirm\" style=\"font-size:18px;padding:12px 40px;background:#ffccdd;color:black;border:none;border-radius:12px;cursor:pointer;font-family:'Spicy Rice','Gowun Dodum',cursive,sans-serif;margin-top:12px;\">OK</button>\n    </div>\n  `;
  document.body.appendChild(modalDiv);
  // 닫기
  modalDiv.querySelector('.modal-close').onclick = () => document.body.removeChild(modalDiv);
  // 삭제
  modalDiv.querySelector('#delete-confirm').onclick = () => {
    const sel = modalDiv.querySelector('#delete-select').value;
    delete friends[sel];
    renderFolders();
    document.body.removeChild(modalDiv);
  };
};

// edit 버튼 기능 수정(중복 체크 제거)
const editFriendBtn = document.getElementById('edit-friend');
editFriendBtn.onclick = () => {
  if (!currentFriend) return;
  showModal("Edit friend's name", currentFriend, (newName) => {
    if (newName && newName !== currentFriend) {
      friends[newName] = friends[currentFriend];
      delete friends[currentFriend];
      currentFriend = newName;
      friendTitle.textContent = newName;
      renderFolders();
    }
  });
};
