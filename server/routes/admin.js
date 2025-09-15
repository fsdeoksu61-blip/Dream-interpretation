const express = require('express');
const db = require('../models/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all users
router.get('/users', (req, res) => {
  db.getAllUsers((err, users) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '사용자 목록을 불러오는 중 오류가 발생했습니다.' });
    }

    res.json({ users });
  });
});

// Get all interpretations
router.get('/interpretations', (req, res) => {
  db.getAllInterpretations((err, interpretations) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '해석 목록을 불러오는 중 오류가 발생했습니다.' });
    }

    res.json({ interpretations });
  });
});

// Get dashboard statistics
router.get('/stats', (req, res) => {
  // Get total users count
  db.getAllUsers((err, users) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '통계를 불러오는 중 오류가 발생했습니다.' });
    }

    const totalUsers = users.length;

    // Get total interpretations count
    db.getAllInterpretations((err, interpretations) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: '통계를 불러오는 중 오류가 발생했습니다.' });
      }

      const totalInterpretations = interpretations.length;
      const sharedInterpretations = interpretations.filter(i => i.is_shared).length;

      // Get shared posts count (with error handling)
      db.getSharedPosts((err, posts) => {
        let totalSharedPosts = 0;
        let totalViews = 0;
        let totalLikes = 0;

        if (err) {
          console.error('getSharedPosts error (continuing with defaults):', err);
          // Continue with default values instead of failing completely
        } else {
          totalSharedPosts = posts.length;
          totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
          totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
        }

        res.json({
          stats: {
            totalUsers,
            totalInterpretations,
            sharedInterpretations,
            totalSharedPosts,
            totalViews,
            totalLikes
          }
        });
      });
    });
  });
});

// Delete user
router.delete('/users/:id', (req, res) => {
  const userId = req.params.id;

  if (userId == req.user.id) {
    return res.status(400).json({ error: '자신의 계정은 삭제할 수 없습니다.' });
  }

  db.deleteUser(userId, (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '사용자 삭제 중 오류가 발생했습니다.' });
    }

    res.json({ message: '사용자가 성공적으로 삭제되었습니다.' });
  });
});

// Delete interpretation
router.delete('/interpretations/:id', (req, res) => {
  const interpretationId = req.params.id;

  db.deleteInterpretation(interpretationId, (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '해석 삭제 중 오류가 발생했습니다.' });
    }

    res.json({ message: '해석이 성공적으로 삭제되었습니다.' });
  });
});

// Clean up legacy shared posts (임시 관리자 기능)
router.post('/cleanup-legacy-posts', (req, res) => {
  console.log('🧹 레거시 공유 게시물 정리 시작...');

  // session_id가 있는 (즉, 로그인하지 않은 사용자가 만든) 공유 게시물 삭제
  db.db ?
    // SQLite용
    db.db.run('DELETE FROM posts WHERE interpretation_id IN (SELECT id FROM dream_interpretations WHERE session_id IS NOT NULL)', function(err) {
      if (err) {
        console.error('SQLite 레거시 포스트 삭제 오류:', err);
        return res.status(500).json({ error: '정리 중 오류가 발생했습니다.' });
      }
      console.log('✅ SQLite 레거시 포스트 삭제됨:', this.changes);
      res.json({ message: `${this.changes}개의 레거시 게시물이 삭제되었습니다.` });
    }) :
    // PostgreSQL용
    db.pool.query('DELETE FROM shared_posts WHERE interpretation_id IN (SELECT id FROM interpretations WHERE session_id IS NOT NULL)', (err, result) => {
      if (err) {
        console.error('PostgreSQL 레거시 포스트 삭제 오류:', err);
        return res.status(500).json({ error: '정리 중 오류가 발생했습니다.' });
      }
      console.log('✅ PostgreSQL 레거시 포스트 삭제됨:', result.rowCount);
      res.json({ message: `${result.rowCount}개의 레거시 게시물이 삭제되었습니다.` });
    });
});

// Get recent activity (latest interpretations and posts)
router.get('/activity', (req, res) => {
  db.getAllInterpretations((err, interpretations) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '활동 내역을 불러오는 중 오류가 발생했습니다.' });
    }

    // Get latest 10 interpretations
    const recentInterpretations = interpretations
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    db.getSharedPosts((err, posts) => {
      let recentPosts = [];

      if (err) {
        console.error('getSharedPosts error in activity (continuing with empty array):', err);
        // Continue with empty array instead of failing completely
      } else {
        // Get latest 10 shared posts
        recentPosts = posts
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 10);
      }

      res.json({
        recentInterpretations,
        recentPosts
      });
    });
  });
});

module.exports = router;