import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import './Auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await authAPI.forgotPassword(email);
      setMessage(response.data.message);
      setEmail(''); // Clear email field
    } catch (error) {
      console.error('Forgot password error:', error);
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
          <h2>비밀번호 찾기</h2>
          <p>가입하신 이메일을 입력하시면 비밀번호 재설정 링크를 전송해드립니다.</p>
        </div>

        {message && (
          <div className="success-message">
            <div className="success-content">
              <strong>✅ {message}</strong>
              <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                이메일에서 재설정 링크를 클릭하여 새 비밀번호를 설정해주세요.
              </p>
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/login" className="submit-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
                로그인하러 가기
              </Link>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {!message && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="submit-btn" 
              disabled={loading || !email.trim()}
            >
              {loading ? '전송 중...' : '재설정 링크 전송'}
            </button>
          </form>
        )}

        <div className="auth-links">
          <Link to="/login" className="auth-link">
            ← 로그인으로 돌아가기
          </Link>
          {!message && (
            <Link to="/register" className="auth-link">
              계정이 없으신가요? 회원가입
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;