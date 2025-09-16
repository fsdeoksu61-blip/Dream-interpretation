import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dreamAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import './MyDreams.css';

const MyDreams = () => {
  const [dreams, setDreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchMyDreams();
  }, []);

  const fetchMyDreams = async () => {
    try {
      // 먼저 서버에서 해석 데이터를 가져오기 시도
      try {
        const response = await dreamAPI.getMyDreams();
        if (response.data.interpretations && response.data.interpretations.length > 0) {
          // 서버 데이터가 있으면 서버 데이터 사용
          const sortedInterpretations = response.data.interpretations.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
          );
          setDreams(sortedInterpretations);
          setLoading(false);
          return;
        }
      } catch (serverError) {
        console.log('Server data not found, trying localStorage:', serverError.response?.data?.error || serverError.message);
      }

      // 서버에서 데이터가 없거나 오류가 발생하면 localStorage 사용 (fallback)
      const savedInterpretations = localStorage.getItem('dream_interpretations');
      if (savedInterpretations) {
        const interpretations = JSON.parse(savedInterpretations);
        // localStorage 데이터에 source 표시 추가
        const interpretationsWithSource = interpretations.map(interpretation => ({
          ...interpretation,
          source: 'localStorage'
        }));
        // 최신순으로 정렬
        const sortedInterpretations = interpretationsWithSource.sort((a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
        );
        setDreams(sortedInterpretations);
      } else {
        setDreams([]);
      }
    } catch (error) {
      console.error('Error fetching dreams:', error);
      setError('꿈 기록을 불러오는 중 오류가 발생했습니다.');
      setDreams([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="my-dreams loading">
        <div className="container">
          <div className="loading-spinner-large"></div>
          <p>꿈 기록을 불러오고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-dreams">
      <div className="container">
        <div className="page-header">
          <h1>📚 내 꿈 해석 기록</h1>
          <p>
            {isAuthenticated
              ? '지금까지 해석한 나의 모든 꿈을 확인해보세요. 새로운 꿈을 해석하거나 과거의 기록을 다시 살펴보세요'
              : '회원가입하시면 모든 기록이 영구 보관됩니다. 새로운 꿈을 해석하거나 과거의 기록을 다시 살펴보세요'
            }
          </p>
          <p className="additional-description">
          </p>
          <p className="spacer-line"></p>
          <div className="header-actions">
            <Link to="/dream/new" className="btn-primary btn-compact">
              새 꿈 해석하기
            </Link>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {dreams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌙</div>
            <h3>아직 해석한 꿈이 없습니다</h3>
            <p>첫 번째 꿈을 해석해보세요!</p>
            <Link to="/dream/new" className="btn-primary btn-compact">
              꿈 해석 시작하기
            </Link>
          </div>
        ) : (
          <div className="dreams-grid">
            {dreams.map((dream) => (
              <div key={dream.id} className="dream-card">
                <div className="dream-card-header">
                  <div className="dream-date">
                    {formatDate(dream.created_at)}
                  </div>
                  {dream.is_shared && (
                    <div className="shared-badge">
                      📤 공유됨
                    </div>
                  )}
                </div>
                
                <div className="dream-content-preview">
                  <h3>꿈 내용</h3>
                  <p>{truncateText(dream.dream_content, 120)}</p>
                </div>
                
                <div className="interpretation-preview">
                  <h4>해석</h4>
                  <p>{truncateText(dream.interpretation, 150)}</p>
                </div>
                
                <div className="dream-card-footer">
                  <Link
                    to={`/dream/${dream.id}`}
                    className="btn-secondary"
                  >
                    자세히 보기
                  </Link>
                  {dream.source === 'localStorage' && (
                    <div className="local-notice">
                      <small>📱 로컬 저장 - 공유 불가</small>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {dreams.length > 0 && (
          <div className="dreams-summary">
            <div className="summary-card">
              <h3>📊 통계</h3>
              <div className="stats">
                <div className="stat">
                  <span className="stat-number">{dreams.length}</span>
                  <span className="stat-label">총 꿈 해석 수</span>
                </div>
                <div className="stat">
                  <span className="stat-number">
                    {dreams.filter(d => d.is_shared).length}
                  </span>
                  <span className="stat-label">공유한 꿈</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isAuthenticated && dreams.length > 0 && (
          <div className="guest-notice">
            <div className="notice-content">
              <h3>🔐 회원가입으로 안전하게 보관하세요</h3>
              <p>
                현재 브라우저에만 저장된 기록입니다. 
                회원가입하시면 모든 꿈 기록이 영구적으로 보관되고, 
                어디서든 접근할 수 있습니다.
              </p>
              <div className="notice-actions">
                <Link to="/register" className="btn-primary">
                  회원가입하기
                </Link>
                <Link to="/login" className="btn-secondary">
                  로그인하기
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDreams;