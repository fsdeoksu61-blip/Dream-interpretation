const express = require('express');
const db = require('../models/database');
const { authenticateOptional, getSessionId } = require('../middleware/auth');

const router = express.Router();

// Get all shared posts
router.get('/', (req, res) => {
  db.getSharedPosts((err, posts) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '게시물을 불러오는 중 오류가 발생했습니다.' });
    }

    res.json({ posts });
  });
});

// Get specific shared post
router.get('/:id', authenticateOptional, getSessionId, (req, res) => {
  const postId = req.params.id;

  db.getSharedPostById(postId, (err, post) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '게시물을 불러오는 중 오류가 발생했습니다.' });
    }

    if (!post) {
      return res.status(404).json({ error: '게시물을 찾을 수 없습니다.' });
    }

    // Increment views
    db.incrementPostViews(postId, (err) => {
      if (err) {
        console.error('Error incrementing views:', err);
      }
    });

    // Get comments
    db.getPostComments(postId, (err, comments) => {
      if (err) {
        console.error('Error getting comments:', err);
        comments = [];
      }

      res.json({ 
        post: {
          ...post,
          views: post.views + 1 // Show updated view count
        },
        comments 
      });
    });
  });
});

// Add comment to post
router.post('/:id/comments', authenticateOptional, getSessionId, (req, res) => {
  const postId = req.params.id;
  const { content, username } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: '댓글 내용을 입력해주세요.' });
  }

  if (content.length > 500) {
    return res.status(400).json({ error: '댓글은 500자 이내로 작성해주세요.' });
  }

  const userId = req.user ? req.user.id : null;
  const sessionId = req.user ? null : req.sessionId;
  const displayName = req.user ? req.user.username : (username || '익명');

  db.createComment(postId, userId, sessionId, displayName, content, (err, commentId) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '댓글 작성 중 오류가 발생했습니다.' });
    }

    res.status(201).json({
      message: '댓글이 작성되었습니다.',
      commentId
    });
  });
});

// Toggle like on post
router.post('/:id/like', authenticateOptional, getSessionId, (req, res) => {
  const postId = req.params.id;
  const userId = req.user ? req.user.id : null;
  const sessionId = req.user ? null : req.sessionId;

  db.toggleLike(postId, userId, sessionId, (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '좋아요 처리 중 오류가 발생했습니다.' });
    }

    res.json({ message: '좋아요가 처리되었습니다.' });
  });
});

// Get post comments
router.get('/:id/comments', (req, res) => {
  const postId = req.params.id;

  db.getPostComments(postId, (err, comments) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '댓글을 불러오는 중 오류가 발생했습니다.' });
    }

    res.json({ comments });
  });
});

module.exports = router;