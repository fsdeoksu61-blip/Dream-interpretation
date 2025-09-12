import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './QnADetail.css';

const QnADetail = () => {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminAnswer, setAdminAnswer] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  useEffect(() => {
    loadQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadQuestion = () => {
    try {
      const questions = JSON.parse(localStorage.getItem('qna-questions') || '[]');
      const foundQuestion = questions.find(q => q.id === parseInt(id));
      
      if (!foundQuestion) {
        setError('질문을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      // 조회수 증가 (안전하게 처리)
      const updatedQuestions = questions.map(q => 
        q.id === parseInt(id) 
          ? { ...q, views: (q.views || 0) + 1 }
          : q
      );
      localStorage.setItem('qna-questions', JSON.stringify(updatedQuestions));
      
      setQuestion({ ...foundQuestion, views: (foundQuestion.views || 0) + 1 });
      setLoading(false);
    } catch (err) {
      console.error('질문 로드 실패:', err);
      setError('질문을 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return '날짜 없음';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '잘못된 날짜';
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Date formatting error:', err);
      return '날짜 오류';
    }
  };

  const handleAdminAccess = () => {
    const password = prompt('관리자 비밀번호를 입력하세요:');
    if (password === 'dream2024') { // 간단한 비밀번호
      setShowAdminPanel(true);
      setAdminAnswer(question.answer || '');
    } else if (password !== null) {
      alert('비밀번호가 올바르지 않습니다.');
    }
  };

  const handleAnswerSubmit = () => {
    if (!adminAnswer.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    setIsSubmittingAnswer(true);

    try {
      const questions = JSON.parse(localStorage.getItem('qna-questions') || '[]');
      const updatedQuestions = questions.map(q => 
        q.id === parseInt(id)
          ? {
              ...q,
              answered: true,
              answer: adminAnswer.trim(),
              answerDate: new Date().toISOString()
            }
          : q
      );
      
      localStorage.setItem('qna-questions', JSON.stringify(updatedQuestions));
      
      // 페이지 새로고침
      window.location.reload();
    } catch (err) {
      console.error('답변 저장 실패:', err);
      alert('답변 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleDeleteAnswer = () => {
    if (!window.confirm('답변을 삭제하시겠습니까?')) return;

    try {
      const questions = JSON.parse(localStorage.getItem('qna-questions') || '[]');
      const updatedQuestions = questions.map(q => 
        q.id === parseInt(id)
          ? {
              ...q,
              answered: false,
              answer: null,
              answerDate: null
            }
          : q
      );
      
      localStorage.setItem('qna-questions', JSON.stringify(updatedQuestions));
      window.location.reload();
    } catch (err) {
      console.error('답변 삭제 실패:', err);
      alert('답변 삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="qna-detail-page">
        <div className="loading">질문 로딩중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qna-detail-page">
        <div className="error-container">
          <h2>❌ 오류</h2>
          <p>{error}</p>
          <Link to="/qna" className="back-button">
            Q&A 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="qna-detail-page">
      <div className="qna-detail-container">
        <div className="detail-header">
          <Link to="/qna" className="back-link">
            ← Q&A 목록으로
          </Link>
          
          <button 
            className="admin-access-btn"
            onClick={handleAdminAccess}
          >
            관리자
          </button>
        </div>

        <div className="question-card">
          <div className="question-status">
            {question.answered ? (
              <span className="status-badge answered">답변완료</span>
            ) : (
              <span className="status-badge waiting">답변대기</span>
            )}
          </div>

          <h1 className="question-title">{question.title || '제목 없음'}</h1>

          <div className="question-meta">
            <span className="category">#{question.category || '일반'}</span>
            <span className="author">{question.author || '익명'}</span>
            <span className="date">{formatDate(question.date)}</span>
            <span className="views">👁️ {question.views || 0}</span>
          </div>

          <div className="question-content">
            {question.content && question.content.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>

        {question.answered && question.answer && (
          <div className="answer-card">
            <div className="answer-header">
              <h2>💬 답변</h2>
              <span className="answer-date">
                {formatDate(question.answerDate)}
              </span>
            </div>
            
            <div className="answer-content">
              {question.answer && question.answer.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>

            {showAdminPanel && (
              <button 
                className="delete-answer-btn"
                onClick={handleDeleteAnswer}
              >
                답변 삭제
              </button>
            )}
          </div>
        )}

        {showAdminPanel && !question.answered && (
          <div className="admin-panel">
            <h3>관리자 답변 작성</h3>
            <textarea
              value={adminAnswer}
              onChange={(e) => setAdminAnswer(e.target.value)}
              placeholder="답변을 작성해주세요..."
              className="admin-textarea"
              rows="8"
            />
            <div className="admin-buttons">
              <button
                onClick={() => setShowAdminPanel(false)}
                className="cancel-btn"
              >
                취소
              </button>
              <button
                onClick={handleAnswerSubmit}
                disabled={isSubmittingAnswer}
                className="submit-btn"
              >
                {isSubmittingAnswer ? '답변 등록 중...' : '답변 등록'}
              </button>
            </div>
          </div>
        )}

        {showAdminPanel && question.answered && (
          <div className="admin-panel">
            <h3>답변 수정</h3>
            <textarea
              value={adminAnswer}
              onChange={(e) => setAdminAnswer(e.target.value)}
              className="admin-textarea"
              rows="8"
            />
            <div className="admin-buttons">
              <button
                onClick={() => setShowAdminPanel(false)}
                className="cancel-btn"
              >
                취소
              </button>
              <button
                onClick={handleAnswerSubmit}
                disabled={isSubmittingAnswer}
                className="submit-btn"
              >
                {isSubmittingAnswer ? '답변 수정 중...' : '답변 수정'}
              </button>
            </div>
          </div>
        )}

        <div className="action-buttons">
          <Link to="/qna" className="list-button">
            목록으로
          </Link>
          <Link to="/qna/write" className="write-button">
            새 질문하기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QnADetail;