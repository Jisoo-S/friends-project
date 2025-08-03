import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
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
