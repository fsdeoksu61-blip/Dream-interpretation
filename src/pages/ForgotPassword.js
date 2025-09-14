import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import './Auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await authAPI.forgotPassword(email);
      setMessage(response.data.message);
      if (response.data.tempPassword) {
        setTempPassword(response.data.tempPassword);
      }
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
          <p>가입하신 이메일을 입력하시면 임시 비밀번호를 생성해드립니다.</p>
        </div>

        {message && (
          <div className="success-message">
            <div className="success-content">
              <strong>✅ {message}</strong>
              {tempPassword && (
                <div style={{
                  margin: '20px 0',
                  padding: '15px',
                  backgroundColor: '#fff',
                  border: '2px solid #667eea',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>
                    새로운 임시 비밀번호:
                  </p>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#667eea',
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    padding: '10px',
                    backgroundColor: '#f8f9ff',
                    borderRadius: '4px'
                  }}>
                    {tempPassword}
                  </div>
                  <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', color: '#e74c3c' }}>
                    ⚠️ 로그인 후 반드시 비밀번호를 변경해주세요!
                  </p>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/login" className="submit-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
                임시 비밀번호로 로그인하기
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
              {loading ? '생성 중...' : '임시 비밀번호 생성'}
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