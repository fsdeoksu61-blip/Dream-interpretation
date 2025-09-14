import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <span className="footer-inline">
            <strong>꿈해몽 서비스:</strong> AI가 당신의 꿈을 해석해드립니다
          </span>
        </div>
        
        <div className="footer-section">
          <span className="footer-inline">
            <strong>사이트 정보:</strong> 운영자 AI꿈해몽 팀 | 이메일 admin@dreamai.co.kr
          </span>
        </div>
        
        <div className="footer-section">
          <span className="footer-inline">
            <strong>정책:</strong> 
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">개인정보 처리방침</a> | 
            <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">이용약관</a> | 
            <a href="/disclaimer" target="_blank" rel="noopener noreferrer">면책조항</a>
          </span>
        </div>
        
      </div>
      
      <div className="footer-bottom">
        <p>
          &copy; 2025 꿈해몽 서비스. All rights reserved.
          <br className="mobile-break" />
          본 서비스는 오락 목적으로만 사용되며, 의학적 조언을 대체할 수 없습니다.
        </p>
      </div>
    </footer>
  );
}

export default Footer;