const express = require('express');
const db = require('../models/database');
const openaiService = require('../utils/openai');
const { authenticateOptional, getSessionId } = require('../middleware/auth');

const router = express.Router();

// Interpret dream
router.post('/interpret', authenticateOptional, getSessionId, async (req, res) => {
  try {
    const { dreamContent } = req.body;

    if (!dreamContent || dreamContent.trim().length === 0) {
      return res.status(400).json({ error: '꿈 내용을 입력해주세요.' });
    }

    if (dreamContent.length > 2000) {
      return res.status(400).json({ error: '꿈 내용은 2000자 이내로 작성해주세요.' });
    }

    // Get interpretation from OpenAI
    const interpretation = await openaiService.interpretDream(dreamContent);

    // Save to database
    const data = {
      user_id: req.user ? req.user.id : null,
      session_id: req.user ? null : req.sessionId,
      dream_content: dreamContent,
      interpretation: interpretation,
      is_shared: false
    };

    db.createInterpretation(data, (err, interpretationId) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: '해석 저장 중 오류가 발생했습니다.' });
      }

      res.json({
        id: interpretationId,
        interpretation,
        dreamContent,
        message: '꿈 해석이 완료되었습니다.'
      });
    });

  } catch (error) {
    console.error('Dream interpretation error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      error: error.message || '꿈 해석 중 오류가 발생했습니다.'
    });
  }
});

// Get user's dream interpretations
router.get('/my-dreams', authenticateOptional, getSessionId, (req, res) => {
  const userId = req.user ? req.user.id : null;
  const sessionId = req.user ? null : req.sessionId;

  db.getUserInterpretations(userId, sessionId, (err, interpretations) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '꿈 기록을 불러오는 중 오류가 발생했습니다.' });
    }

    res.json({ interpretations });
  });
});

// Get specific interpretation
router.get('/:id', authenticateOptional, getSessionId, (req, res) => {
  const interpretationId = req.params.id;

  db.getInterpretationById(interpretationId, (err, interpretation) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '해석을 불러오는 중 오류가 발생했습니다.' });
    }

    if (!interpretation) {
      return res.status(404).json({ error: '해석을 찾을 수 없습니다.' });
    }

    // Check if user has access to this interpretation
    const hasAccess = interpretation.user_id === (req.user ? req.user.id : null) ||
                     interpretation.session_id === (req.user ? null : req.sessionId) ||
                     interpretation.is_shared;

    if (!hasAccess) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    res.json({ interpretation });
  });
});

// Share interpretation
router.post('/:id/share', authenticateOptional, getSessionId, (req, res) => {
  const interpretationId = req.params.id;
  const { title } = req.body;

  console.log('🔄 Share request received:', {
    interpretationId,
    title,
    userId: req.user?.id,
    sessionId: req.sessionId,
    user: req.user?.username
  });

  if (!title || title.trim().length === 0) {
    console.log('❌ Title missing');
    return res.status(400).json({ error: '제목을 입력해주세요.' });
  }

  // First, check if user owns this interpretation
  db.getInterpretationById(interpretationId, (err, interpretation) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '해석을 불러오는 중 오류가 발생했습니다.' });
    }

    if (!interpretation) {
      return res.status(404).json({ error: '해석을 찾을 수 없습니다.' });
    }

    // Check ownership
    const isOwner = interpretation.user_id === (req.user ? req.user.id : null) ||
                   interpretation.session_id === (req.user ? null : req.sessionId);

    if (!isOwner) {
      return res.status(403).json({ error: '공유 권한이 없습니다.' });
    }

    if (interpretation.is_shared) {
      return res.status(400).json({ error: '이미 공유된 해석입니다.' });
    }

    // Create shared post
    db.createSharedPost(interpretationId, title, (err, postId) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: '공유 중 오류가 발생했습니다.' });
      }

      res.json({
        message: '해석이 성공적으로 공유되었습니다.',
        postId
      });
    });
  });
});

module.exports = router;