import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBXCbQ00Gruy6IL9LiWe7n148P6OU7WCyM",
  authDomain: "friends-fad33.firebaseapp.com",
  projectId: "friends-fad33",
  storageBucket: "friends-fad33.appspot.com",
  messagingSenderId: "839126031945",
  appId: "friends-fad33"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth 함수들
export const createUser = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const signOutUser = () => signOut(auth);

// 비밀번호 재설정 이메일 보내기
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

// 비밀번호 변경
export const changePassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('사용자가 로그인되지 않았습니다.');
  
  // 재인증
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  
  // 비밀번호 업데이트
  return updatePassword(user, newPassword);
};

// 계정 삭제
export const deleteAccount = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('사용자가 로그인되지 않았습니다.');
  
  // 사용자 데이터 삭제 (Firestore에서)
  try {
    await setDoc(doc(db, 'users', user.uid), { deleted: true, deletedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error('사용자 데이터 삭제 오류:', error);
  }
  
  // 계정 삭제
  return deleteUser(user);
};

// Firestore 함수들
export const saveUserData = async (userId, data) => {
  try {
    await setDoc(doc(db, 'users', userId), data, { merge: false });
  } catch (error) {
    console.error('데이터 저장 오류:', error);
    throw error;
  }
};

export const getUserData = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('데이터 로드 오류:', error);
    throw error;
  }
};

export { onAuthStateChanged };
