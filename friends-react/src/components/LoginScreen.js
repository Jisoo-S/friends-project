import React, { useState } from 'react';
import { createUser, signIn } from '../services/firebase';
import './LoginScreen.css';

const LoginScreen = ({ onShowAlert }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) {
      onShowAlert('이메일과 비밀번호를 모두 입력해주세요.', true);
      return;
    }

    if (!isValidEmail(email)) {
      onShowAlert('올바른 이메일 형식을 입력해주세요.', true);
      return;
    }

    if (password.length < 6) {
      onShowAlert('비밀번호는 6자리 이상이어야 합니다.', true);
      return;
    }

    setLoading(true);
    
    try {
      await createUser(email, password);
      onShowAlert('회원가입이 완료되었습니다!', false);
    } catch (error) {
      console.error('회원가입 오류:', error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          onShowAlert('이미 사용 중인 이메일입니다.', true);
          break;
        case 'auth/weak-password':
          onShowAlert('비밀번호가 너무 약합니다.', true);
          break;
        case 'auth/invalid-email':
          onShowAlert('올바르지 않은 이메일 형식입니다.', true);
          break;
        default:
          onShowAlert('회원가입 중 오류가 발생했습니다.<br>다시 시도해주세요.', true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      onShowAlert('이메일과 비밀번호를 모두 입력해주세요.', true);
      return;
    }

    setLoading(true);

    try {
      await signIn(email, password);
    } catch (error) {
      console.error('로그인 오류:', error);
      
      switch (error.code) {
        case 'auth/user-not-found':
          onShowAlert('존재하지 않는 사용자입니다.<br>먼저 회원가입을 해주세요.', true);
          break;
        case 'auth/wrong-password':
          onShowAlert('비밀번호가 올바르지 않습니다.', true);
          break;
        case 'auth/invalid-email':
          onShowAlert('올바르지 않은 이메일 형식입니다.', true);
          break;
        case 'auth/too-many-requests':
          onShowAlert('너무 많은 로그인 시도가 있었습니다.<br>잠시 후 다시 시도해주세요.', true);
          break;
        case 'auth/invalid-credential':
          onShowAlert('잘못된 로그인 정보입니다.<br>이메일과 비밀번호를 확인해주세요.', true);
          break;
        default:
          onShowAlert('로그인 중 오류가 발생했습니다.<br>다시 시도해주세요.', true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e, isEmail) => {
    if (e.key === 'Enter') {
      if (isEmail) {
        document.getElementById('password').focus();
      } else {
        handleLogin();
      }
    }
  };

  return (
    <div id="login-screen" className="screen">
      <div className="login-container">
        <h1>friends</h1>
        <input 
          type="email" 
          id="username" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={(e) => handleKeyPress(e, true)}
          disabled={loading}
        />
        <input 
          type="password" 
          id="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => handleKeyPress(e, false)}
          disabled={loading}
        />
        <button 
          className="login-btn" 
          style={{ width: '70%' }}
          onClick={handleLogin}
          disabled={loading}
        >
          Login
        </button>
        <button 
          className="signup-btn" 
          style={{ width: '70%' }}
          onClick={handleSignup}
          disabled={loading}
        >
          Sign Up
        </button>
        
        <div className="login-info">
          처음 로그인 하는 경우에는 id와 password를 적고<br/>회원가입(Sign Up) 버튼을 누른 뒤에 로그인 해주세요!
        </div>
        <div className="password-note">
          *password는 6자리 이상이어야합니다.
        </div>
        
        {loading && <div className="loading">loading...</div>}
      </div>
    </div>
  );
};

export default LoginScreen;
