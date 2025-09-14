import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { dreamAPI } from '../utils/api';
import './DreamResult.css';

const DreamResult = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [dreamData, setDreamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);

  const fetchDreamData = useCallback(async () => {
    try {
      // localStorage에서 꿈 해석 데이터 가져오기 (데모 모드)
      const savedInterpretations = localStorage.getItem('dream_interpretations');
      if (savedInterpretations) {
        const interpretations = JSON.parse(savedInterpretations);
        const dreamData = interpretations.find(dream => dream.id === id);
        
        if (dreamData) {
          setDreamData(dreamData);
        } else {
          setError('해석을 찾을 수 없습니다.');
        }
      } else {
        setError('저장된 해석이 없습니다.');
      }
    } catch (error) {
      console.error('Error fetching dream:', error);
      setError('해석을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // If data was passed through navigation state, use it
    if (location.state) {
      setDreamData({
        id: location.state.id,
        dream_content: location.state.dreamContent,
        interpretation: location.state.interpretation,
        created_at: new Date().toISOString()
      });
      setLoading(false);
    } else {
      // Otherwise, fetch from API
      fetchDreamData();
    }
  }, [id, location.state, fetchDreamData]);

  const handleDirectShare = async () => {
    setSharing(true);

    // 꿈 내용의 첫 20글자를 기본 제목으로 사용
    const defaultTitle = dreamData.dream_content
      ? `${dreamData.dream_content.substring(0, 20).trim()}...의 꿈해석`
      : '꿈해석 결과';

    try {
      await dreamAPI.shareDream(id, defaultTitle);
      alert('꿈이 성공적으로 공유되었습니다!');
      // 페이지를 새로고침하여 공유 상태 업데이트
      setDreamData(prev => ({ ...prev, is_shared: true }));
    } catch (error) {
      console.error('Share error:', error);
      alert(
        error.response?.data?.error ||
        '공유 중 오류가 발생했습니다.'
      );
    } finally {
      setSharing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="dream-result loading">
        <div className="container">
          <div className="loading-spinner-large"></div>
          <p>해석을 불러오고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dream-result error">
        <div className="container">
          <div className="error-card">
            <h2>오류가 발생했습니다</h2>
            <p>{error}</p>
            <button 
              className="btn-primary"
              onClick={() => navigate('/')}
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dream-result">
      <div className="container">
        <div className="result-card">
          <div className="result-header">
            <h1>🌟 꿈 해석 결과</h1>
            <div className="result-meta">
              <span className="result-date">
                {formatDate(dreamData.created_at)}
              </span>
            </div>
          </div>

          <div className="result-content">
            <div className="dream-section">
              <h2>💭 당신의 꿈</h2>
              <div className="dream-content">
                {dreamData.dream_content}
              </div>
            </div>

            <div className="interpretation-section">
              <h2>🔮 해석</h2>
              <div className="interpretation-content">
                {dreamData.interpretation.split('\n').map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index}>{paragraph}</p>
                  )
                ))}
              </div>
            </div>
          </div>

          <div className="result-actions">
            <button 
              className="btn-primary"
              onClick={() => navigate('/dream/new')}
            >
              새로운 꿈 해석하기
            </button>
            
            <button 
              className="btn-secondary"
              onClick={() => navigate('/my-dreams')}
            >
              내 꿈 기록 보기
            </button>

            {!dreamData.is_shared && (
              <button
                className={`btn-share ${sharing ? 'loading' : ''}`}
                onClick={handleDirectShare}
                disabled={sharing}
              >
                {sharing ? (
                  <>
                    <span className="loading-spinner"></span>
                    공유 중...
                  </>
                ) : (
                  '📤 공유하기'
                )}
              </button>
            )}
          </div>

          {dreamData.is_shared && (
            <div className="shared-notice">
              <p>✅ 이 꿈은 이미 공유되었습니다.</p>
            </div>
          )}
        </div>

        <div className="tips-section">
          <h3>💡 꿈 해석을 더 활용하는 방법</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">📓</div>
              <h4>꿈 일기 쓰기</h4>
              <p>정기적으로 꿈을 기록하면 패턴을 발견할 수 있어요</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🤝</div>
              <h4>다른 사람과 공유</h4>
              <p>다른 관점에서의 해석을 들어보세요</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🧘</div>
              <h4>명상과 성찰</h4>
              <p>해석 내용을 바탕으로 자신을 돌아보는 시간을 가져보세요</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DreamResult;