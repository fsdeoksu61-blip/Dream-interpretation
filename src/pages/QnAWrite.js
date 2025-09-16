import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './QnAWrite.css';

const QnAWrite = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: '일반',
    content: '',
    author: '익명'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    '일반', '기타'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = '제목은 5글자 이상 입력해주세요.';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = '제목은 100글자 이하로 입력해주세요.';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = '내용을 입력해주세요.';
    } else if (formData.content.trim().length < 20) {
      newErrors.content = '구체적인 꿈 내용을 20글자 이상 작성해주세요.';
    } else if (formData.content.trim().length > 2000) {
      newErrors.content = '내용은 2000글자 이하로 입력해주세요.';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // localStorage에서 기존 질문들 가져오기
      const existingQuestions = JSON.parse(localStorage.getItem('qna-questions') || '[]');
      
      // 새 질문 생성
      const newQuestion = {
        id: Date.now() + Math.floor(Math.random() * 1000), // 고유 정수 ID 생성
        title: formData.title.trim(),
        category: formData.category,
        content: formData.content.trim(),
        author: formData.author,
        date: new Date().toISOString(),
        views: 0,
        answered: false,
        answer: null,
        answerDate: null
      };
      
      // 새 질문을 맨 앞에 추가
      const updatedQuestions = [newQuestion, ...existingQuestions];
      
      // localStorage에 저장
      localStorage.setItem('qna-questions', JSON.stringify(updatedQuestions));
      
      // 성공 메시지 표시 후 Q&A 페이지로 이동
      alert('질문이 성공적으로 등록되었습니다! 답변을 기다려주세요.');
      navigate('/qna');
      
    } catch (error) {
      console.error('질문 등록 실패:', error);
      alert('질문 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (formData.title || formData.content) {
      if (window.confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
        navigate('/qna');
      }
    } else {
      navigate('/qna');
    }
  };

  return (
    <div className="qna-write-page">
      <div className="qna-write-container">
        <div className="write-header">
          <h1>❓ 질문하기</h1>
          <p>꿈해몽 서비스 이용과 관련해 궁금한 사항을 적어주세요</p>
        </div>

        <form onSubmit={handleSubmit} className="write-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              제목 <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder=""
              className={`form-input ${errors.title ? 'error' : ''}`}
              disabled={isSubmitting}
            />
            {errors.title && (
              <div className="error-message">{errors.title}</div>
            )}
            <div className="char-counter">
              {formData.title.length}/100
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category" className="form-label">
              카테고리
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-select"
              disabled={isSubmitting}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="content" className="form-label">
              질문 내용 <span className="required">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder=""
              className={`form-textarea ${errors.content ? 'error' : ''}`}
              rows="10"
              disabled={isSubmitting}
            />
            {errors.content && (
              <div className="error-message">{errors.content}</div>
            )}
            <div className="char-counter">
              {formData.content.length}/2000
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="author" className="form-label">
              닉네임
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              placeholder="익명"
              className="form-input"
              disabled={isSubmitting}
            />
            <div className="form-help">
              닉네임을 입력하지 않으면 '익명'으로 등록됩니다.
            </div>
          </div>

          <div className="form-buttons">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-button"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  등록 중...
                </>
              ) : (
                '질문 등록하기'
              )}
            </button>
          </div>
        </form>

        <div className="write-tips">
          <h3>🎤 웹사이트 발전을 위한 제안도 받습니다</h3>
          <ul>
            <li>좋은 의견 남겨주세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QnAWrite;