import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy">
      <div className="container">
        <div className="policy-content">
          <h1>개인정보 처리방침</h1>
          
          <div className="policy-intro">
            <p>본 사이트는 이용자의 개인정보를 중요하게 생각하며, 다음과 같이 개인정보를 처리합니다.</p>
          </div>

          <section className="policy-section">
            <h2>1. 수집하는 개인정보 항목</h2>
            <ul>
              <li><strong>필수:</strong> 이메일 주소</li>
              <li><strong>선택:</strong> 이름, 닉네임</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>2. 개인정보 수집 및 이용 목적</h2>
            <ul>
              <li>회원 문의 응답 및 서비스 안내</li>
              <li>공지사항 전달</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>3. 개인정보 보유 및 이용 기간</h2>
            <ul>
              <li>회원 탈퇴 시 즉시 파기</li>
              <li>법령에 따라 보관이 필요한 경우 해당 기간 동안 보관</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>4. 개인정보 제3자 제공</h2>
            <p>본 사이트는 이용자의 개인정보를 외부에 제공하지 않습니다.</p>
          </section>

          <section className="policy-section">
            <h2>5. 개인정보 보호책임자</h2>
            <ul>
              <li><strong>책임자:</strong> 강덕수</li>
              <li><strong>이메일:</strong> admin@dreamai.co.kr</li>
            </ul>
          </section>

          <div className="policy-footer">
            <p>본 방침은 2025년 9월 1일부터 적용됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;