import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { communityAPI } from '../utils/api';
import './CommunityDetail.css';

function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [username, setUsername] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liked, setLiked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const { sessionId } = useSession();

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await communityAPI.getPost(id);
      setPost(response.data.post);
      setComments(response.data.comments || []);
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
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleLike = async () => {
    try {
      await communityAPI.toggleLike(id);
      setPost(prev => ({
        ...prev,
        likes: liked ? prev.likes - 1 : prev.likes + 1
      }));
      setLiked(!liked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);

    try {
      const commentData = {
        content: commentText,
        username: !user ? username : undefined,
        sessionId: !user ? sessionId : undefined
      };

      await communityAPI.addComment(id, commentData);
      setCommentText('');
      setUsername('');
      fetchPost(); // Refresh to get updated comments
    } catch (error) {
      console.error('Error submitting comment:', error);
      if (error.response) {
        alert(error.response.data?.error || '댓글 작성 중 오류가 발생했습니다.');
      } else if (error.request) {
        alert('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        alert('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('게시물을 삭제하시겠습니까?')) {
      return;
    }

    setDeleting(true);

    try {
      await communityAPI.deletePost(id);
      navigate('/community');
    } catch (error) {
      console.error('Error deleting post:', error);
      if (error.response) {
        alert(error.response.data?.error || '게시물 삭제 중 오류가 발생했습니다.');
      } else if (error.request) {
        alert('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        alert('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setDeleting(false);
    }
  };

  const canEditPost = (post) => {
    if (!post) return false;
    return user ? (post.user_id === user.id) : (post.session_id === sessionId);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatContent = (content) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  if (loading) {
    return <div className="community-detail-container"><div className="loading">게시물을 불러오는 중...</div></div>;
  }

  if (error) {
    return (
      <div className="community-detail-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/community')} className="back-btn">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="community-detail-container">
      <div className="detail-header">
        <button onClick={() => navigate('/community')} className="back-btn">
          ← 목록으로
        </button>
      </div>

      {post && (
        <>
          <div className="post-detail">
            <div className="post-header">
              <h1 className="post-title">
                {post.is_announcement && <span className="announcement-badge">📢 공지</span>}
                {post.title}
              </h1>
              <div className="post-meta">
                <span className="author">{post.username || '익명'}</span>
                <span className="date">{formatDate(post.created_at)}</span>
                <div className="post-stats">
                  <span className="views">👁 {post.views}</span>
                  <span className="likes">❤ {post.likes}</span>
                </div>
              </div>
            </div>
            <div className="post-content">
              {formatContent(post.content)}
            </div>
            <div className="post-actions">
              <div className="action-left">
                <button 
                  onClick={handleLike}
                  className={`like-btn ${liked ? 'liked' : ''}`}
                >
                  ❤ {post.likes} {liked ? '좋아요 취소' : '좋아요'}
                </button>
              </div>
              {canEditPost(post) && (
                <div className="action-right">
                  <button 
                    onClick={() => navigate(`/community/${id}/edit`)}
                    className="edit-btn"
                    disabled={deleting}
                  >
                    ✏ 수정
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="delete-btn"
                    disabled={deleting}
                  >
                    {deleting ? '삭제 중...' : '🗑 삭제'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="comments-section">
            <h3>댓글 ({comments.length})</h3>
            
            <form onSubmit={handleCommentSubmit} className="comment-form">
              {!user && (
                <input
                  type="text"
                  placeholder="닉네임 (선택사항)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength="20"
                  className="username-input"
                />
              )}
              <textarea
                placeholder="댓글을 작성하세요..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows="3"
                maxLength="500"
                required
              ></textarea>
              <div className="comment-actions">
                <div className="char-count">{commentText.length}/500</div>
                <button 
                  type="submit" 
                  disabled={submittingComment || !commentText.trim()}
                  className="comment-submit-btn"
                >
                  {submittingComment ? '작성 중...' : '댓글 작성'}
                </button>
              </div>
            </form>

            <div className="comments-list">
              {comments.length === 0 ? (
                <div className="no-comments">첫 번째 댓글을 작성해보세요!</div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <span className="comment-author">
                        {comment.user_username || comment.username || '익명'}
                      </span>
                      <span className="comment-date">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <div className="comment-content">
                      {formatContent(comment.content)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CommunityDetail;