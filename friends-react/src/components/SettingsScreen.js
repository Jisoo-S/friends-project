import React, { useState } from 'react';
import './SettingsScreen.css';

const SettingsScreen = ({ onBack, onChangePassword, onDeleteAccount, onShowAlert }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      onShowAlert('모든 필드를 입력해주세요.', true);
      return;
    }

    if (newPassword.length < 6) {
      onShowAlert('새 비밀번호는 6자리 이상이어야 합니다.', true);
      return;
    }

    if (newPassword !== confirmPassword) {
      onShowAlert('새 비밀번호가 일치하지 않습니다.', true);
      return;
    }

    setLoading(true);
    try {
      await onChangePassword(currentPassword, newPassword);
      onShowAlert('비밀번호가 성공적으로 변경되었습니다!', false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        onShowAlert('현재 비밀번호가 올바르지 않습니다.', true);
      } else if (error.code === 'auth/requires-recent-login') {
        onShowAlert('보안을 위해 다시 로그인해주세요.', true);
      } else {
        onShowAlert('비밀번호 변경에 실패했습니다.<br>다시 시도해주세요.', true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      onShowAlert('DELETE를 정확히 입력해주세요.', true);
      return;
    }

    setLoading(true);
    try {
      await onDeleteAccount();
    } catch (error) {
      console.error('계정 삭제 오류:', error);
      if (error.code === 'auth/requires-recent-login') {
        onShowAlert('보안을 위해 다시 로그인해주세요.', true);
      } else {
        onShowAlert('계정 삭제에 실패했습니다.<br>다시 시도해주세요.', true);
      }
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div id="settings-screen" className="screen">
      <button className="back-btn" onClick={onBack}>← Back</button>
      
      <div className="settings-container">
        <h1>Settings</h1>
        
        <div className="settings-section">
          <h2>비밀번호 변경</h2>
          <input
            type="password"
            placeholder="현재 비밀번호"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="새 비밀번호 (6자리 이상)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="새 비밀번호 확인"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
          <button 
            className="change-password-btn"
            onClick={handleChangePassword}
            disabled={loading}
          >
            비밀번호 변경
          </button>
        </div>

        <div className="settings-section danger-zone">
          <h2>회원 탈퇴</h2>
          <p className="warning-text">
            ⚠️ 주의: 계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
          </p>
          
          {!showDeleteConfirm ? (
            <button 
              className="delete-account-btn"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
            >
              회원 탈퇴
            </button>
          ) : (
            <div className="delete-confirm">
              <p>정말로 계정을 삭제하시겠습니까?</p>
              <p>확인을 위해 <strong>DELETE</strong>를 입력해주세요:</p>
              <input
                type="text"
                placeholder="DELETE 입력"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                disabled={loading}
              />
              <div className="confirm-buttons">
                <button 
                  className="cancel-btn"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={loading}
                >
                  취소
                </button>
                <button 
                  className="confirm-delete-btn"
                  onClick={handleDeleteAccount}
                  disabled={loading || deleteConfirmText !== 'DELETE'}
                >
                  삭제
                </button>
              </div>
            </div>
          )}
        </div>

        {loading && <div className="loading">처리중...</div>}
      </div>
    </div>
  );
};

export default SettingsScreen;
