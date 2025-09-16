const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');

// Session ID 생성 또는 가져오기
const getOrCreateSessionId = (req) => {
  let sessionId = req.headers['x-session-id'];

  if (!sessionId) {
    sessionId = uuidv4();
  }

  return sessionId;
};

// 모든 Q&A 질문 조회
router.get('/', (req, res) => {
  console.log('📨 GET /api/qna - Getting all Q&A questions');

  db.getAllQnaQuestions((err, questions) => {
    if (err) {
      console.error('❌ Error getting Q&A questions:', err);
      return res.status(500).json({ error: '질문 목록을 불러오는 중 오류가 발생했습니다.' });
    }

    console.log('✅ Successfully retrieved Q&A questions:', questions.length);
    res.json({ questions: questions || [] });
  });
});

// 새 Q&A 질문 생성
router.post('/', (req, res) => {
  console.log('📨 POST /api/qna - Creating new Q&A question');

  const { title, category, content, author } = req.body;

  // 유효성 검사
  if (!title || !content) {
    return res.status(400).json({ error: '제목과 내용은 필수입니다.' });
  }

  if (title.trim().length < 5 || title.trim().length > 100) {
    return res.status(400).json({ error: '제목은 5글자 이상 100글자 이하여야 합니다.' });
  }

  if (content.trim().length < 20 || content.trim().length > 2000) {
    return res.status(400).json({ error: '내용은 20글자 이상 2000글자 이하여야 합니다.' });
  }

  const sessionId = getOrCreateSessionId(req);

  // 세션 생성 (없으면)
  db.createSession(sessionId, (sessionErr) => {
    if (sessionErr) {
      console.error('❌ Session creation error:', sessionErr);
    }

    const questionData = {
      title: title.trim(),
      category: category || '일반',
      content: content.trim(),
      author: author?.trim() || '익명',
      user_id: req.user?.id || null,
      session_id: req.user ? null : sessionId
    };

    db.createQnaQuestion(questionData, (err, questionId) => {
      if (err) {
        console.error('❌ Error creating Q&A question:', err);
        return res.status(500).json({ error: '질문 등록 중 오류가 발생했습니다.' });
      }

      console.log('✅ Successfully created Q&A question:', questionId);
      res.status(201)
         .header('X-Session-ID', sessionId)
         .json({
           message: '질문이 성공적으로 등록되었습니다.',
           id: questionId,
           sessionId
         });
    });
  });
});

// 특정 Q&A 질문 조회 (조회수 증가)
router.get('/:id', (req, res) => {
  const questionId = req.params.id;
  console.log('📨 GET /api/qna/:id - Getting Q&A question:', questionId);

  // 조회수 증가
  db.incrementQnaViews(questionId, (viewErr) => {
    if (viewErr) {
      console.error('❌ Error incrementing views:', viewErr);
    }

    // 질문 조회
    db.getQnaQuestionById(questionId, (err, question) => {
      if (err) {
        console.error('❌ Error getting Q&A question:', err);
        return res.status(500).json({ error: '질문을 불러오는 중 오류가 발생했습니다.' });
      }

      if (!question) {
        return res.status(404).json({ error: '질문을 찾을 수 없습니다.' });
      }

      console.log('✅ Successfully retrieved Q&A question:', questionId);
      res.json({ question });
    });
  });
});

// Q&A 답변 등록/수정 (관리자용)
router.post('/:id/answer', (req, res) => {
  const questionId = req.params.id;
  const { answer, adminPassword } = req.body;

  console.log('📨 POST /api/qna/:id/answer - Updating answer for question:', questionId);

  // 관리자 비밀번호 확인
  if (adminPassword !== 'dream2024') {
    return res.status(403).json({ error: '관리자 권한이 없습니다.' });
  }

  if (!answer || !answer.trim()) {
    return res.status(400).json({ error: '답변 내용을 입력해주세요.' });
  }

  db.updateQnaAnswer(questionId, answer.trim(), (err) => {
    if (err) {
      console.error('❌ Error updating Q&A answer:', err);
      return res.status(500).json({ error: '답변 등록 중 오류가 발생했습니다.' });
    }

    console.log('✅ Successfully updated Q&A answer:', questionId);
    res.json({ message: '답변이 성공적으로 등록되었습니다.' });
  });
});

// Q&A 답변 삭제 (관리자용)
router.delete('/:id/answer', (req, res) => {
  const questionId = req.params.id;
  const { adminPassword } = req.body;

  console.log('📨 DELETE /api/qna/:id/answer - Deleting answer for question:', questionId);

  // 관리자 비밀번호 확인
  if (adminPassword !== 'dream2024') {
    return res.status(403).json({ error: '관리자 권한이 없습니다.' });
  }

  db.deleteQnaAnswer(questionId, (err) => {
    if (err) {
      console.error('❌ Error deleting Q&A answer:', err);
      return res.status(500).json({ error: '답변 삭제 중 오류가 발생했습니다.' });
    }

    console.log('✅ Successfully deleted Q&A answer:', questionId);
    res.json({ message: '답변이 성공적으로 삭제되었습니다.' });
  });
});

module.exports = router;