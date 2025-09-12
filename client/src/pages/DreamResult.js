import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { dreamAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import './DreamResult.css';

const DreamResult = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [dreamData, setDreamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareTitle, setShareTitle] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState('');

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
  }, [id, location.state]);

  const fetchDreamData = async () => {
    try {
      const response = await dreamAPI.getDream(id);
      setDreamData(response.data.interpretation);
    } catch (error) {
      console.error('Error fetching dream:', error);
      setError('해석을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    
    if (!shareTitle.trim()) {
      setShareError('제목을 입력해주세요.');
      return;
    }

    setSharing(true);
    setShareError('');

    try {
      await dreamAPI.shareDream(id, shareTitle.trim());
      setShowShareModal(false);
      setShareTitle('');
      alert('꿈이 성공적으로 공유되었습니다!');
    } catch (error) {
      console.error('Share error:', error);
      setShareError(
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
                className="btn-share"
                onClick={() => setShowShareModal(true)}
              >
                📤 공유하기
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>꿈 공유하기</h3>
              <button 
                className="modal-close"
                onClick={() => setShowShareModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleShare}>
              <div className="modal-body">
                <p>다른 사람들과 이 꿈 해석을 공유하시겠어요?</p>
                
                <div className="form-group">
                  <label htmlFor="shareTitle">공유 제목</label>
                  <input
                    type="text"
                    id="shareTitle"
                    value={shareTitle}
                    onChange={(e) => {
                      setShareTitle(e.target.value);
                      if (shareError) setShareError('');
                    }}
                    placeholder="예: 하늘을 나는 꿈의 의미"
                    maxLength="100"
                    required
                  />
                  <div className="char-count-small">
                    {shareTitle.length}/100
                  </div>
                </div>

                {shareError && (
                  <div className="error-message">
                    {shareError}
                  </div>
                )}

                <div className="share-info">
                  <p>
                    🔒 공유 시 꿈 내용과 해석이 게시판에 표시되지만, 
                    개인정보는 보호됩니다.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowShareModal(false)}
                  disabled={sharing}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className={`btn-primary ${sharing ? 'loading' : ''}`}
                  disabled={sharing || !shareTitle.trim()}
                >
                  {sharing ? (
                    <>
                      <span className="loading-spinner"></span>
                      공유 중...
                    </>
                  ) : (
                    '공유하기'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DreamResult;