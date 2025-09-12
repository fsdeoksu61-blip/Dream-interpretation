import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './QnA.css';

const QnA = () => {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('all'); // all, answered, unanswered
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // localStorage 초기화 (한 번만 실행)
    localStorage.removeItem('qna-questions');
    loadQuestions();
  }, []);

  const loadQuestions = () => {
    try {
      const savedQuestions = localStorage.getItem('qna-questions');
      if (savedQuestions) {
        const parsed = JSON.parse(savedQuestions);
        setQuestions(parsed);
      } else {
        // 빈 상태로 시작
        setQuestions([]);
      }
    } catch (error) {
      console.error('Q&A 데이터 로드 실패:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(question => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'answered' && question.answered) ||
      (filter === 'unanswered' && !question.answered);
    
    const matchesSearch = 
      question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (answered) => {
    return answered ? 
      <span className="status-badge answered">답변완료</span> :
      <span className="status-badge waiting">답변대기</span>;
  };

  if (loading) {
    return (
      <div className="qna-page">
        <div className="loading">Q&A 로딩중...</div>
      </div>
    );
  }

  return (
    <div className="qna-page">
      <div className="qna-container">
        <div className="qna-header">
          <h1>💬 Q&A 게시판</h1>
          <p>꿈해몽에 관한 궁금한 점을 질문하고 답변받아보세요</p>
          <Link to="/qna/write" className="write-button">
            질문하기
          </Link>
        </div>

        <div className="qna-controls">
          <div className="filter-tabs">
            <button 
              className={filter === 'all' ? 'active' : ''} 
              onClick={() => setFilter('all')}
            >
              전체 ({questions.length})
            </button>
            <button 
              className={filter === 'unanswered' ? 'active' : ''} 
              onClick={() => setFilter('unanswered')}
            >
              답변대기 ({questions.filter(q => !q.answered).length})
            </button>
            <button 
              className={filter === 'answered' ? 'active' : ''} 
              onClick={() => setFilter('answered')}
            >
              답변완료 ({questions.filter(q => q.answered).length})
            </button>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="제목이나 카테고리로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="questions-list">
          {filteredQuestions.length === 0 ? (
            <div className="empty-state">
              <p>등록된 질문이 없습니다.</p>
              <Link to="/qna/write" className="empty-write-button">
                첫 질문하기
              </Link>
            </div>
          ) : (
            filteredQuestions.map(question => (
              <div key={question.id} className="question-item">
                <div className="question-status">
                  {getStatusBadge(question.answered)}
                </div>
                
                <div className="question-content">
                  <Link to={`/qna/${question.id}`} className="question-title">
                    {question.title}
                  </Link>
                  
                  <div className="question-meta">
                    <span className="category">#{question.category}</span>
                    <span className="author">{question.author}</span>
                    <span className="date">{formatDate(question.date)}</span>
                    <span className="views">👁️ {question.views}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredQuestions.length > 0 && (
          <div className="qna-footer">
            <p className="tip">
              💡 <strong>팁:</strong> 구체적인 꿈의 상황을 자세히 적어주시면 더 정확한 해석을 받을 수 있어요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QnA;