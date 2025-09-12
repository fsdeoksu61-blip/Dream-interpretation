import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { communityAPI } from '../utils/api';
import './CommunityWrite.css';

function CommunityEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isAnnouncement: false
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { sessionId } = useSession();

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await communityAPI.getPost(id);
      const post = response.data.post;
      
      // Check ownership
      const canEdit = user ? 
        (post.user_id === user.id) : 
        (post.session_id === sessionId);

      if (!canEdit) {
        setError('수정 권한이 없습니다.');
        return;
      }

      const announcementStatus = !!post.is_announcement;
      console.log('📋 Loading post data:', {
        id: post.id,
        title: post.title,
        is_announcement: post.is_announcement,
        computed_isAnnouncement: announcementStatus
      });

      setFormData({
        title: post.title,
        content: post.content,
        isAnnouncement: announcementStatus
      });
    } catch (error) {
      console.error('Error fetching post:', error);
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
  }, [id, user, sessionId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    console.log('🔄 Form field changed:', {
      name,
      type,
      oldValue: formData[name],
      newValue,
      checked: type === 'checkbox' ? checked : undefined
    });

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const updateData = {
        ...formData,
        sessionId: !user ? sessionId : undefined
      };

      console.log('Updating post with data:', updateData);
      const response = await communityAPI.updatePost(id, updateData);
      console.log('Update response:', response);
      
      // 수정 성공 후 커뮤니티 목록으로 리디렉션
      navigate('/community');
    } catch (error) {
      console.error('Error updating post:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        setError(error.response.data?.error || `서버 오류 (${error.response.status})`);
      } else if (error.request) {
        console.error('Network error:', error.request);
        setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        console.error('Unknown error:', error.message);
        setError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="community-write-container">
        <div className="loading">게시물을 불러오는 중...</div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="community-write-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/community')} className="back-btn">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="community-write-container">
      <div className="write-header">
        <h1>게시물 수정</h1>
        <button 
          type="button" 
          onClick={() => navigate(`/community/${id}`)}
          className="back-btn"
        >
          취소
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="write-form">
        {console.log('👤 User check for checkbox:', { user, isAdmin: user?.is_admin, shouldShowCheckbox: user && user.is_admin })}
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
                📢 공지사항으로 설정 (현재: {formData.isAnnouncement ? '체크됨' : '체크안됨'})
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
            onClick={() => navigate(`/community/${id}`)}
            className="cancel-btn"
            disabled={submitting}
          >
            취소
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={submitting || !formData.title.trim() || !formData.content.trim()}
          >
            {submitting ? '수정 중...' : '수정하기'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CommunityEdit;