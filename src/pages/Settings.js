import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';
import './Auth.css';

function Settings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('새 비밀번호는 최소 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.changePassword(currentPassword, newPassword);
      setMessage(response.data.message);

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Change password error:', error);
      if (error.response) {
        setError(error.response.data?.error || `서버 오류 (${error.response.status})`);
      } else if (error.request) {
        setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>설정</h2>
          <p>안녕하세요, <strong>{user?.username}</strong>님!</p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#333' }}>비밀번호 변경</h3>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleChangePassword} className="auth-form">
            <div className="form-group">
              <label htmlFor="currentPassword">현재 비밀번호</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호를 입력하세요"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">새 비밀번호</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">새 비밀번호 확인</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호를 다시 입력하세요"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </div>

        <div className="auth-links">
          <a href="/" className="auth-link">
            ← 홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}

export default Settings;