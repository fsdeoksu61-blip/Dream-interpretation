import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });
  const [errors, setErrors] = useState({});
  
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

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
    
    if (!formData.username) {
      newErrors.username = '사용자명을 입력해주세요.';
    } else if (formData.username.length < 2) {
      newErrors.username = '사용자명은 2글자 이상이어야 합니다.';
    } else if (formData.username.length > 20) {
      newErrors.username = '사용자명은 20글자 이하여야 합니다.';
    }
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6글자 이상이어야 합니다.';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
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

    const result = await register(formData.email, formData.password, formData.username);
    if (result.success) {
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
            <h1>회원가입</h1>
            <p>꿈해몽 서비스에 가입하고 더 많은 기능을 이용해보세요</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-message global-error">
                {error}
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
              <label htmlFor="username">사용자명</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={errors.username ? 'error' : ''}
                placeholder="사용자명을 입력하세요 (2-20글자)"
                disabled={loading}
                maxLength="20"
              />
              {errors.username && (
                <div className="field-error">{errors.username}</div>
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
                placeholder="비밀번호를 입력하세요 (6글자 이상)"
                disabled={loading}
              />
              {errors.password && (
                <div className="field-error">{errors.password}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">비밀번호 확인</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder="비밀번호를 다시 입력하세요"
                disabled={loading}
              />
              {errors.confirmPassword && (
                <div className="field-error">{errors.confirmPassword}</div>
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
                  가입 중...
                </>
              ) : (
                '회원가입'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="auth-link">
                로그인하기
              </Link>
            </p>
          </div>

          <div className="guest-notice">
            <p>
              💡 회원가입 없이도 꿈 해석 서비스를 이용할 수 있습니다. 
              단, 회원가입 시 모든 기록이 안전하게 보관됩니다.
            </p>
          </div>
        </div>

        <div className="auth-info">
          <h3>🌟 회원가입 혜택</h3>
          <ul>
            <li>모든 꿈 기록 영구 보관</li>
            <li>꿈 해석 이력 관리</li>
            <li>커뮤니티 참여 및 소통</li>
            <li>개인화된 추천 기능</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;