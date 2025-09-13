import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    // Immediately redirect to prevent React state conflicts
    logout();
    window.location.href = '/';
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/" className="nav-logo">
            🌙 꿈해몽
          </Link>
          
          <div className="nav-auth">
            {isAuthenticated ? (
              <div className="user-menu">
                <span className="welcome-text">
                  안녕하세요, {user?.username}님!
                </span>
                {user?.is_admin && (
                  <Link to="/admin" className="nav-link admin-link">
                    관리자
                  </Link>
                )}
                <button onClick={handleLogout} className="logout-btn">
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="auth-links">
                <Link to="/login" className="nav-link">로그인</Link>
                <Link to="/register" className="nav-link register-link">회원가입</Link>
              </div>
            )}
          </div>
        </div>

        <div className="nav-links">
          <Link to="/" className="nav-link">홈</Link>
          <Link to="/dream/new" className="nav-link">꿈 해석</Link>
          <Link to="/my-dreams" className="nav-link">내 꿈 기록</Link>
          <Link to="/qna" className="nav-link">Q&A</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;