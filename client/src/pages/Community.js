import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { communityAPI } from '../utils/api';
// import { useAuth } from '../contexts/AuthContext';
// import { useSession } from '../contexts/SessionContext';
import './Community.css';

function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  // const { user } = useAuth();
  // const { sessionId } = useSession();

  const fetchPosts = useCallback(async (search = searchTerm) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        sortBy,
        page: currentPage.toString(),
        limit: '20'
      };
      
      if (search && search.trim()) {
        params.search = search.trim();
      }

      const response = await communityAPI.getPosts(params);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
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
  }, [searchTerm, sortBy, currentPage]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts(searchTerm);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return <div className="community-container"><div className="loading">게시물을 불러오는 중...</div></div>;
  }

  return (
    <div className="community-container">
      <div className="community-header">
        <h1>커뮤니티 게시판</h1>
        <Link to="/community/write" className="write-btn">
          글쓰기
        </Link>
      </div>

      <div className="community-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="제목이나 내용으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            🔍 검색
          </button>
        </form>

        <div className="sort-options">
          <label>정렬:</label>
          <select 
            value={sortBy} 
            onChange={(e) => handleSortChange(e.target.value)}
            className="sort-select"
          >
            <option value="latest">최신순</option>
            <option value="popular">인기순</option>
            <option value="views">조회수순</option>
            <option value="comments">댓글순</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="posts-list">
        {posts.length === 0 ? (
          <div className="no-posts">아직 게시물이 없습니다.</div>
        ) : (
          posts.map((post, index) => (
            <div key={post.id} className={`post-item ${post.is_announcement ? 'announcement-post' : ''}`}>
              <div className="post-number">
                {post.display_number || post.id}
              </div>
              <div className="post-content">
                <Link to={`/community/${post.id}`} className="post-title">
                  {!!post.is_announcement && <span className="announcement-badge">📢 공지</span>}
                  {post.title}
                </Link>
                <div className="post-meta">
                  <span className="author">
                    {post.author_username || post.username || '익명'}
                  </span>
                  <span className="date">{formatDate(post.created_at)}</span>
                </div>
              </div>
              <div className="post-stats">
                <span className="views">👁 {post.views}</span>
                <span className="likes">❤ {post.likes}</span>
                <span className="comments">💬 {post.comment_count}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Community;