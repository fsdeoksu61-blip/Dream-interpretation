import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './QnA.css';

const QnA = () => {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('all'); // all, answered, unanswered
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();

    // 페이지가 포커스될 때 새로고침 (새 질문이 추가되었을 수 있음)
    const handleFocus = () => {
      loadQuestions();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadQuestions = () => {
    try {
      const savedQuestions = localStorage.getItem('qna-questions');
      if (savedQuestions) {
        const parsed = JSON.parse(savedQuestions);
        setQuestions(parsed);
      } else {
        // 예시 질문들로 시작
        const sampleQuestions = [
          {
            id: 1,
            title: "꿈에서 계속 같은 장소가 나와요",
            category: "일반",
            content: "최근 몇 달간 꿈에서 같은 건물이 계속 나타납니다. 이게 무슨 의미인지 궁금해요.",
            author: "꿈탐험가",
            date: "2025-01-10T10:00:00Z",
            views: 23,
            answered: true,
            answer: "반복적으로 나타나는 장소는 보통 당신의 무의식이 특별히 주목하고 있는 심리적 공간을 의미합니다. 그 건물이 어떤 느낌을 주는지, 그 안에서 무엇을 하는지 기억해보시면 더 구체적인 해석이 가능해요.",
            answerDate: "2025-01-10T14:30:00Z"
          },
          {
            id: 2,
            title: "꿈에서 날아다니는 경험이 자주 있어요",
            category: "일반",
            content: "꿈속에서 자유롭게 하늘을 날아다니는 꿈을 자주 꿔요. 이런 꿈의 의미가 궁금합니다.",
            author: "하늘나리",
            date: "2025-01-12T15:30:00Z",
            views: 47,
            answered: true,
            answer: "비행 꿈은 보통 자유와 해방감을 상징합니다. 현실에서 제약을 벗어나고 싶은 욕구나, 더 높은 차원의 통찰을 얻고자 하는 마음을 나타낼 수 있어요. 꿈속에서의 기분이 좋았다면 긍정적인 변화의 신호일 수 있습니다.",
            answerDate: "2025-01-12T18:45:00Z"
          }
        ];
        setQuestions(sampleQuestions);
        localStorage.setItem('qna-questions', JSON.stringify(sampleQuestions));
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
          <div className="header-content">
            <div>
              <h1>💬 Q&A 게시판</h1>
              <p>꿈해몽에 관한 궁금한 점을 질문하고 답변받아보세요</p>
            </div>
            <div className="header-actions">
              <button
                className="refresh-btn"
                onClick={() => loadQuestions()}
                title="목록 새로고침"
              >
                🔄
              </button>
              <Link to="/qna/write" className="write-button">
                질문하기
              </Link>
            </div>
          </div>
        </div>

        <div className="qna-controls">
          <div className="filter-tabs">
            <button 
              className={filter === 'all' ? 'active' : ''} 
              onClick={() => setFilter('all')}
            >
              전체 <span className="tab-count">{questions.length}</span>
            </button>
            <button 
              className={filter === 'unanswered' ? 'active' : ''} 
              onClick={() => setFilter('unanswered')}
            >
              답변대기 <span className="tab-count">{questions.filter(q => !q.answered).length}</span>
            </button>
            <button 
              className={filter === 'answered' ? 'active' : ''} 
              onClick={() => setFilter('answered')}
            >
              답변완료 <span className="tab-count">{questions.filter(q => q.answered).length}</span>
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