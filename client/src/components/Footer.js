import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h4>꿈해몽 서비스</h4>
          <p>AI가 당신의 꿈을 해석해드립니다</p>
        </div>
        
        <div className="footer-section">
          <h4>사이트 정보</h4>
          <p><strong>운영자:</strong> AI꿈해몽 팀</p>
          <p><strong>이메일:</strong> admin@dreamai.co.kr</p>
        </div>
        
        <div className="footer-section">
          <h4>정책</h4>
          <ul>
            <li><a href="/privacy-policy" target="_blank" rel="noopener noreferrer">개인정보 처리방침</a></li>
            <li className="terms-disclaimer">
              <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">이용약관</a>
              <span> | </span>
              <a href="/disclaimer" target="_blank" rel="noopener noreferrer">면책조항</a>
            </li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>소셜 미디어</h4>
          <div className="social-links">
            <button type="button" className="social-btn" aria-label="페이스북">📘</button>
            <button type="button" className="social-btn" aria-label="트위터">🐦</button>
            <button type="button" className="social-btn" aria-label="인스타그램">📷</button>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2025 꿈해몽 서비스. All rights reserved. | 본 서비스는 오락 목적으로만 사용되며, 의학적 조언을 대체할 수 없습니다.</p>
      </div>
    </footer>
  );
}

export default Footer;