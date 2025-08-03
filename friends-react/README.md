# Friends React App

Nice to Meet You! - Friends 프로젝트의 React 버전입니다.

## 기능

- Firebase Authentication을 통한 로그인/회원가입
- 친구 폴더 추가/삭제/수정
- 색상별 폴더 구분 (노란색, 분홍색, 파란색)
- 드래그 앤 드롭으로 폴더 순서 변경
- 스탬프 페이지에서 날짜별 스탬프 관리
- 모든 데이터는 Firebase Firestore에 실시간 저장

## 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. 개발 서버 실행:
```bash
npm start
```

3. 프로덕션 빌드:
```bash
npm run build
```

## 프로젝트 구조

```
src/
├── components/         # React 컴포넌트들
│   ├── LoginScreen.js  # 로그인 화면
│   ├── HomeScreen.js   # 메인 화면
│   ├── StampScreen.js  # 스탬프 화면
│   ├── FolderList.js   # 폴더 목록
│   ├── Modal.js        # 모달 컴포넌트
│   ├── AlertModal.js   # 알림 모달
│   └── DeleteModal.js  # 삭제 모달
├── services/          # 서비스 레이어
│   └── firebase.js    # Firebase 설정 및 함수
├── styles/            # 전역 스타일
│   └── index.css
├── App.js             # 메인 앱 컴포넌트
└── index.js           # 엔트리 포인트
```

## 기술 스택

- React 18
- Firebase (Authentication, Firestore)
- CSS3
- ES6+

## 주요 변경사항

- 모든 기능을 React 컴포넌트로 모듈화
- 상태 관리를 React State로 전환
- Firebase SDK 최신 버전 사용
- 반응형 디자인 유지
- 원본과 동일한 UI/UX 제공

© 2025. Michelle.J.S. All rights reserved.
