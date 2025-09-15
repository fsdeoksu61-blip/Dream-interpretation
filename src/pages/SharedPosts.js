import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postAPI } from '../utils/api';
import './SharedPosts.css';

const SharedPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await postAPI.getSharedPosts();
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('게시물을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="shared-posts loading">
        <div className="container">
          <div className="loading-spinner-large"></div>
          <p>게시물을 불러오고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-posts">
      <div className="container">
        <div className="page-header">
          <h1>💫 꿈 공유 게시판</h1>
          <p>다른 사람들이 공유한 꿈 해석을 살펴보고, 함께 이야기해보세요</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌙</div>
            <h3>아직 공유된 꿈이 없습니다</h3>
            <p>첫 번째 꿈을 공유해보세요!</p>
            <Link to="/dream/new" className="btn-primary">
              꿈 해석하고 공유하기
            </Link>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <h3 className="post-title">{post.title}</h3>
                  <div className="post-meta">
                    <span className="post-author">
                      👤 {post.author_username || '익명 사용자'}
                    </span>
                    <span className="post-date">
                      📅 {formatDate(post.created_at)}
                    </span>
                  </div>
                </div>
                
                <div className="post-content">
                  <div className="dream-preview">
                    <h4>꿈 내용</h4>
                    <p>{truncateText(post.dream_content, 120)}</p>
                  </div>
                  
                  <div className="interpretation-preview">
                    <h4>해석</h4>
                    <p>{truncateText(post.interpretation, 100)}</p>
                  </div>
                </div>
                
                <div className="post-footer">
                  <div className="post-stats">
                    <span className="stat">
                      👁️ {post.views}
                    </span>
                    <span className="stat">
                      ❤️ {post.likes}
                    </span>
                  </div>
                  <Link 
                    to={`/post/${post.id}`}
                    className="btn-secondary"
                  >
                    자세히 보기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedPosts;