import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dreamAPI } from '../utils/api';
import './DreamInput.css';

const DreamInput = () => {
  const [dreamContent, setDreamContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!dreamContent.trim()) {
      setError('꿈 내용을 입력해주세요.');
      return;
    }

    if (dreamContent.length > 2000) {
      setError('꿈 내용은 2000자 이내로 작성해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 서버 API를 사용하여 실제 AI 해석 요청
      const response = await dreamAPI.interpretDream({ dreamContent: dreamContent.trim() });

      // 서버에서 저장된 해석 결과를 받아옴
      const dreamData = response.data;

      // 해석 결과 페이지로 이동 (서버에 저장된 데이터 사용)
      navigate(`/dream/${dreamData.id}`);
    } catch (error) {
      console.error('Dream interpretation error:', error);
      setError('꿈 해석 중 오류가 발생했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setDreamContent(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="dream-input">
      <div className="container">
        <div className="dream-input-card">
          <div className="dream-input-header">
            <h1>🔮 꿈 해석하기</h1>
            <p>당신의 꿈 이야기를 들려주세요. AI가 전통적, 심리학적 관점에서 해석해드릴게요.</p>
          </div>

          <form onSubmit={handleSubmit} className="dream-form">
            <div className="form-group">
              <label htmlFor="dreamContent">꿈 내용을 자세히 적어주세요</label>
              <textarea
                id="dreamContent"
                value={dreamContent}
                onChange={handleChange}
                placeholder="예시: 어젯밤 꿈에서 하늘을 날고 있었어요. 구름 위를 자유롭게 날아다니며 아래를 내려다보니 집이 작게 보였습니다. 날아가면서 기분이 매우 좋았고 자유로운 느낌이었어요..."
                className={`dream-textarea ${error ? 'error' : ''}`}
                rows="10"
                maxLength="2000"
                disabled={loading}
              />
              <div className="char-count">
                {dreamContent.length}/2000
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className={`submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading || !dreamContent.trim()}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    해석 중...
                  </>
                ) : (
                  '꿈 해석하기'
                )}
              </button>
            </div>
          </form>

          <div className="tips">
            <h3>🔑 더 정확한 해석을 위한 팁</h3>
            <ul>
              <li>꿈에서 보았던 색깔, 장소, 사람들을 구체적으로 기술해보세요</li>
              <li>꿈 속에서 느꼈던 감정(기쁨, 불안, 두려움 등)을 포함해주세요</li>
              <li>꿈의 시간순서나 주요 사건들을 순서대로 적어보세요</li>
              <li>현실에서 최근에 겪었던 일들과 연관지어 생각해보세요</li>
            </ul>
          </div>

          <div className="privacy-notice">
            <p>
              🔒 개인정보 보호: 입력하신 꿈 내용은 해석을 위해서만 사용되며, 
              회원님이 직접 공유하기를 선택하지 않는 한 다른 사용자에게 공개되지 않습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DreamInput;