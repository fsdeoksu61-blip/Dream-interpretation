import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { postAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import './PostDetail.css';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await postAPI.getPost(id);
      setPost(response.data.post);
      setLiked(response.data.post.liked);
      setLikeCount(response.data.post.likes);
    } catch (error) {
      console.error('Error fetching post:', error);
      if (error.response?.status === 404) {
        setError('게시물을 찾을 수 없습니다.');
      } else {
        setError('게시물을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('좋아요를 누르려면 로그인이 필요합니다.');
      return;
    }

    try {
      const response = await postAPI.toggleLike(id);
      setLiked(!liked);
      setLikeCount(response.data.likes);
    } catch (error) {
      console.error('Error liking post:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
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

  if (loading) {
    return (
      <div className="post-detail loading">
        <div className="container">
          <div className="loading-spinner-large"></div>
          <p>게시물을 불러오고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="post-detail error">
        <div className="container">
          <div className="error-state">
            <div className="error-icon">😔</div>
            <h2>{error}</h2>
            <div className="error-actions">
              <Link to="/shared" className="btn-primary">
                목록으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail error">
        <div className="container">
          <div className="error-state">
            <div className="error-icon">🔍</div>
            <h2>게시물을 찾을 수 없습니다</h2>
            <div className="error-actions">
              <Link to="/shared" className="btn-primary">
                목록으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="post-detail">
      <div className="container">
        <div className="post-header-nav">
          <button onClick={() => navigate(-1)} className="back-btn">
            ← 뒤로가기
          </button>
          <Link to="/shared" className="list-btn">
            목록으로
          </Link>
        </div>

        <article className="post-article">
          <header className="post-header">
            <h1 className="post-title">{post.title}</h1>
            <div className="post-meta">
              <div className="author-info">
                <span className="author">👤 {post.author_username || '익명'}</span>
                <span className="date">📅 {formatDate(post.created_at)}</span>
              </div>
              <div className="post-stats">
                <span className="views">👁️ {post.views}</span>
                <button 
                  className={`like-btn ${liked ? 'liked' : ''}`}
                  onClick={handleLike}
                >
                  {liked ? '❤️' : '🤍'} {likeCount}
                </button>
              </div>
            </div>
          </header>

          <div className="post-content">
            <section className="dream-section">
              <h2 className="section-title">🌙 꿈 내용</h2>
              <div className="dream-content">
                <p>{post.dream_content}</p>
              </div>
            </section>

            <section className="interpretation-section">
              <h2 className="section-title">🔮 꿈 해석</h2>
              <div className="interpretation-content">
                <div className="interpretation-text">
                  {post.interpretation.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="post-actions">
            <button 
              className={`action-btn like-action ${liked ? 'liked' : ''}`}
              onClick={handleLike}
            >
              {liked ? '❤️ 좋아요 취소' : '🤍 좋아요'}
            </button>
            <Link to="/shared" className="action-btn secondary">
              다른 꿈 보기
            </Link>
          </div>
        </article>

        {!isAuthenticated && (
          <div className="guest-notice">
            <div className="notice-content">
              <h3>🔐 더 많은 기능을 이용해보세요</h3>
              <p>
                회원가입하시면 좋아요, 댓글 등 더 많은 기능을 이용하실 수 있습니다.
              </p>
              <p className="spacer-line"></p>
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

export default PostDetail;