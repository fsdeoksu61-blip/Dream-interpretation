import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dreamAPI } from '../utils/api';
import './DreamDiary.css';

const DreamDiary = () => {
  const { user, isAuthenticated } = useAuth();

  // 디버깅용
  console.log('DreamDiary - isAuthenticated:', isAuthenticated);
  console.log('DreamDiary - user:', user);
  const [dreams, setDreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMyDreams();
  }, []);

  const loadMyDreams = async () => {
    try {
      setLoading(true);
      console.log('사용자 정보:', user); // 디버깅용
      console.log('토큰:', localStorage.getItem('token')); // 디버깅용

      const response = await dreamAPI.getMyDreams();
      console.log('API 응답:', response.data); // 디버깅용
      setDreams(response.data.interpretations || []);
    } catch (err) {
      console.error('꿈 일기 로딩 실패:', err);
      console.error('에러 상세:', err.response?.data); // 디버깅용
      setError('꿈 일기를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  if (loading) {
    return (
      <div className="dream-diary-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>꿈 일기를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dream-diary-container">
      <div className="dream-diary-header">
        <h1>🌙 내 꿈 일기장</h1>
        <p>안녕하세요, {user?.username}님! 여기서 나만의 꿈 이야기들을 확인할 수 있어요.</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="dream-diary-content">
        {dreams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <h3>아직 꿈 일기가 없어요</h3>
            <p>첫 번째 꿈을 해석해보세요!</p>
            <a href="/dream/new" className="start-dream-btn">
              꿈 해석하러 가기
            </a>
          </div>
        ) : (
          <div className="dream-list">
            <div className="dream-stats">
              <div className="stat-card">
                <div className="stat-number">{dreams.length}</div>
                <div className="stat-label">총 꿈 기록</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{dreams.filter(dream => dream.is_shared).length}</div>
                <div className="stat-label">공유한 꿈</div>
              </div>
            </div>

            <div className="dreams-grid">
              {dreams.map((dream) => (
                <div key={dream.id} className="dream-card">
                  <div className="dream-card-header">
                    <div className="dream-date">
                      {formatDate(dream.created_at)}
                    </div>
                    {dream.is_shared && (
                      <span className="shared-badge">공유됨</span>
                    )}
                  </div>

                  <div className="dream-card-content">
                    <h3 className="dream-title">꿈 내용</h3>
                    <p className="dream-content">
                      {dream.dream_content?.substring(0, 150)}
                      {dream.dream_content?.length > 150 && '...'}
                    </p>

                    <h4 className="interpretation-title">해석</h4>
                    <p className="dream-interpretation">
                      {dream.interpretation?.substring(0, 200)}
                      {dream.interpretation?.length > 200 && '...'}
                    </p>
                  </div>

                  <div className="dream-card-actions">
                    <button
                      className="view-detail-btn"
                      onClick={() => window.open(`/dream/${dream.id}`, '_blank')}
                    >
                      자세히 보기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DreamDiary;