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
      // 먼저 서버에서 해석 데이터를 가져오기 시도
      try {
        const response = await dreamAPI.getDream(id);
        // API는 { interpretation } 형태로 반환하므로 interpretation 필드 사용
        const interpretation = response.data.interpretation;
        if (interpretation) {
          setDreamData(interpretation);
          setLoading(false);
          return;
        }
      } catch (serverError) {
        console.log('Server data not found, trying localStorage:', serverError.response?.data?.error || serverError.message);
      }

      // 서버에서 찾을 수 없으면 localStorage에서 가져오기 (fallback)
      const savedInterpretations = localStorage.getItem('dream_interpretations');
      if (savedInterpretations) {
        const interpretations = JSON.parse(savedInterpretations);
        const dreamData = interpretations.find(dream => dream.id === id);

        if (dreamData) {
          // localStorage 데이터에 source 표시 추가
          setDreamData({
            ...dreamData,
            source: 'localStorage'
          });
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
        created_at: new Date().toISOString(),
        source: 'navigation' // 새로 생성된 해석
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
      // dreamData에 서버 ID가 있으면 사용, 없으면 현재 URL의 id 사용
      const dreamId = dreamData.id || id;

      await dreamAPI.shareDream(dreamId, defaultTitle);
      alert('꿈이 성공적으로 공유되었습니다!');

      // 공유 상태 업데이트
      setDreamData(prev => ({ ...prev, is_shared: true }));
    } catch (error) {
      console.error('Share error:', error);
      let errorMessage = '공유 중 오류가 발생했습니다.';

      if (error.response) {
        // 서버에서 응답이 왔지만 오류 상태
        const status = error.response.status;
        const serverError = error.response.data?.error;

        if (status === 404) {
          errorMessage = '해석을 찾을 수 없습니다. 이 해석이 서버에 저장되어 있는지 확인해주세요.';
        } else if (status === 403) {
          errorMessage = '이 해석을 공유할 권한이 없습니다.';
        } else if (status === 400 && serverError?.includes('이미 공유된')) {
          errorMessage = '이미 공유된 해석입니다.';
          setDreamData(prev => ({ ...prev, is_shared: true }));
        } else {
          errorMessage = serverError || `서버 오류 (${status})`;
        }
      } else if (error.request) {
        // 요청은 보냈지만 응답이 없음 (네트워크 오류)
        errorMessage = '서버에 연결할 수 없습니다. 네트워크 연결을 확인하고 다시 시도해주세요.';
      }

      alert(errorMessage);
      console.log('Share error details:', {
        dreamId: dreamData.id || id,
        response: error.response?.data,
        status: error.response?.status,
        message: error.message,
        dreamData: dreamData
      });
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
              onClick={() => navigate('/shared-posts')}
            >
              꿈 해석 둘러보기
            </button>

            {!dreamData.is_shared && dreamData.source !== 'localStorage' && dreamData.source !== 'navigation' && (
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

            {dreamData.source === 'localStorage' && (
              <div className="local-storage-notice">
                <p>📱 이 해석은 브라우저에만 저장되어 공유할 수 없습니다.</p>
                <p><small>회원가입 후 새 해석을 받으면 공유 기능을 사용할 수 있습니다.</small></p>
              </div>
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