import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const { login, loading, error, clearError } = useAuth();

  // 컴포넌트 마운트 시에만 AuthContext 오류 초기화
  useEffect(() => {
    clearError();
  }, []); // clearError 의존성 제거하여 마운트 시에만 실행

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (error) {
      clearError();
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Use window.location instead of navigate to avoid React timing issues
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>로그인</h1>
            <p>꿈해몽 서비스에 다시 오신 것을 환영합니다</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-message global-error">
                <div style={{ marginBottom: '10px' }}>
                  {error}
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {error.includes('존재하지 않는 사용자') && (
                    <Link
                      to="/register"
                      className="error-action-button"
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        backgroundColor: '#667eea',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}
                    >
                      회원가입하기
                    </Link>
                  )}
                  {error.includes('비밀번호') && (
                    <Link
                      to="/forgot-password"
                      className="error-action-button"
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}
                    >
                      비밀번호 찾기
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="이메일을 입력하세요"
                disabled={loading}
              />
              {errors.email && (
                <div className="field-error">{errors.email}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                placeholder="비밀번호를 입력하세요"
                disabled={loading}
              />
              {errors.password && (
                <div className="field-error">{errors.password}</div>
              )}
            </div>

            <button
              type="submit"
              className={`auth-submit ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              <Link to="/forgot-password" className="auth-link">
                비밀번호를 잊으셨나요?
              </Link>
            </p>
            <p>
              아직 계정이 없으신가요?{' '}
              <Link to="/register" className="auth-link">
                회원가입하기
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-info">
          <h3>🌙 꿈해몽 서비스</h3>
          <ul>
            <li>AI 기반 전문 꿈 해석</li>
            <li>개인 꿈 기록 관리</li>
            <li>커뮤니티 꿈 공유</li>
            <li>안전한 개인정보 보호</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;