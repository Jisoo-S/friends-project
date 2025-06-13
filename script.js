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
