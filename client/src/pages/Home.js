import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">🌙 AI기반 꿈해몽 전문 사이트</h1>
          <p className="hero-subtitle">
            이해하지 못 할 꿈을 꾸셨나요?<br />
            꿈 속에 숨겨진 의미를 해석하고 공유해보세요
          </p>
          <div className="hero-buttons">
            <Link to="/dream/new" className="cta-button primary">
              꿈 해석 시작하기
            </Link>
            <Link to="/shared" className="cta-button secondary">
              다른 사람의 꿈 보기
            </Link>
          </div>
          <p className="hero-notice">✨ 회원가입 없이 이용 가능합니다</p>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>꿈해몽 서비스를 이용하면..</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔮</div>
              <h3>AI 꿈 해석</h3>
              <p>최신 AI 기술을 활용하여 당신의 꿈을 심리학적, 상징적 관점에서 해석해드립니다.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>꿈 공유 커뮤니티</h3>
              <p>다른 사람들과 꿈을 공유하고, 댓글을 통해 소통할 수 있는 공간을 제공합니다.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>꿈 기록 보관</h3>
              <p>회원가입 없이도 이용 가능하며, 가입하면 꿈이 연동되어 더욱 현실적인 해석을 제공합니다.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>안전한 환경</h3>
              <p>개인정보 보호와 사용자의 프라이버시를 최우선으로 생각합니다.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="container">
          <h2>이용 방법</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>꿈 내용 입력</h3>
                <p>기억나는 꿈의 내용을 자세히 적어보세요<br />꿈의 내용이 자세하고 상세하면 더 정확한 해석을 받아 볼 수 있어요</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>AI 해석 받기</h3>
                <p>꿈 해몽 전문으로 특화된 AI가 꿈의 전통적인 의미와 심리학적 관점에서 꿈을 해석해드립니다</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>기록 및 공유</h3>
                <p>해석 결과를 저장하고 원한다면 다른 사람들과 꿈 해몽을 공유하세요</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!isAuthenticated && (
        <section className="cta-section">
          <div className="container">
            <div className="cta-content">
              <h2>더 많은 기능을 이용하고 싶으신가요?</h2>
              <p>회원 가입하시면 모든 꿈을 안전하게 보관하고, 더 많은 혜택과 더 많은 기능을 이용할 수 있습니다.</p>
              <div className="cta-buttons">
                <Link to="/register" className="cta-button primary">
                  회원가입하기
                </Link>
                <Link to="/login" className="cta-button secondary">
                  로그인하기
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {isAuthenticated && (
        <section className="welcome-back">
          <div className="container">
            <div className="welcome-content">
              <h2>다시 오신 것을 환영합니다, {user?.username}님!</h2>
              <p>오늘은 어떤 꿈을 꾸셨나요? 새로운 꿈을 해석해보거나 이전 기록을 확인해보세요.</p>
              <div className="welcome-buttons">
                <Link to="/dream/new" className="cta-button primary">
                  새 꿈 해석하기
                </Link>
                <Link to="/my-dreams" className="cta-button secondary">
                  내 꿈 기록 보기
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;