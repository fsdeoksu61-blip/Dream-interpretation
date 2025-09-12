import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { communityAPI } from '../utils/api';
import './CommunityWrite.css';

function CommunityWrite() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    username: '',
    isAnnouncement: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { sessionId } = useSession();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const postData = {
        ...formData,
        sessionId: !user ? sessionId : undefined
      };

      await communityAPI.createPost(postData);
      navigate('/community');
    } catch (error) {
      console.error('Error creating post:', error);
      if (error.response) {
        setError(error.response.data?.error || `서버 오류 (${error.response.status})`);
      } else if (error.request) {
        setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="community-write-container">
      <div className="write-header">
        <h1>게시물 작성</h1>
        <button 
          type="button" 
          onClick={() => navigate('/community')}
          className="back-btn"
        >
          목록으로
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="write-form">
        {!user && (
          <div className="form-group">
            <label htmlFor="username">닉네임</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="닉네임을 입력하세요 (선택사항)"
              maxLength="20"
            />
          </div>
        )}

        {user && user.is_admin && (
          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="isAnnouncement"
                name="isAnnouncement"
                checked={formData.isAnnouncement}
                onChange={handleChange}
                className="announcement-checkbox"
              />
              <label htmlFor="isAnnouncement" className="checkbox-label">
                📢 공지사항으로 작성
              </label>
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="title">제목 *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="제목을 입력하세요"
            maxLength="100"
            required
          />
          <div className="char-count">{formData.title.length}/100</div>
        </div>

        <div className="form-group">
          <label htmlFor="content">내용 *</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="내용을 입력하세요"
            rows="12"
            maxLength="2000"
            required
          ></textarea>
          <div className="char-count">{formData.content.length}/2000</div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={() => navigate('/community')}
            className="cancel-btn"
            disabled={loading}
          >
            취소
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading || !formData.title.trim() || !formData.content.trim()}
          >
            {loading ? '작성 중...' : '게시하기'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CommunityWrite;