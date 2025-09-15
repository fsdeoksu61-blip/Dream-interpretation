const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../models/database');
const { authenticateToken, getSessionId } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', getSessionId, async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    // Check if user already exists
    db.getUserByEmail(email, async (err, existingUser) => {
      if (err) {
        console.error('Error checking existing user:', err);
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
      }

      if (existingUser) {
        return res.status(400).json({ error: '이미 존재하는 이메일입니다.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      db.createUser(email, hashedPassword, username, (err, userId) => {
        if (err) {
          console.error('Error creating user:', err);
          return res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
        }

        // Migrate guest data if session exists
        if (req.sessionId) {
          db.migrateGuestData(req.sessionId, userId, (err) => {
            if (err) {
              console.error('Error migrating guest data:', err);
            }
          });
        }

        // Create JWT token
        const token = jwt.sign(
          { id: userId, email, username, is_admin: false },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.status(201).json({
          message: '회원가입이 완료되었습니다.',
          token,
          user: { id: userId, email, username, is_admin: false }
        });
      });
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
    }

    // Find user
    db.getUserByEmail(email, async (err, user) => {
      if (err) {
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
      }

      if (!user) {
        return res.status(400).json({ error: '존재하지 않는 사용자입니다.' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: '비밀번호가 올바르지 않습니다.' });
      }

      // Create JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username, is_admin: user.is_admin },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: '로그인이 완료되었습니다.',
        token,
        user: { 
          id: user.id, 
          email: user.email, 
          username: user.username, 
          is_admin: user.is_admin 
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Verify token
router.post('/verify', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: '토큰이 필요합니다.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }

    res.json({ 
      valid: true, 
      user: decoded 
    });
  });
});

// Password reset request - Generate temporary password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: '이메일을 입력해주세요.' });
    }

    // Check if user exists
    db.getUserByEmail(email, async (err, user) => {
      if (err) {
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
      }

      if (!user) {
        // 보안을 위해 사용자가 존재하지 않아도 성공 메시지 반환
        return res.json({
          message: '해당 이메일이 등록되어 있다면 임시 비밀번호가 생성되었습니다.'
        });
      }

      // Generate temporary password (8 characters: letters + numbers)
      const tempPassword = crypto.randomBytes(4).toString('hex').toUpperCase();

      try {
        // Hash temporary password
        const hashedTempPassword = await bcrypt.hash(tempPassword, 12);

        // Update user's password to temporary password
        db.updateUserPassword(user.email, hashedTempPassword, (err, changes) => {
          if (err) {
            console.error('Error updating temporary password:', err);
            return res.status(500).json({ error: '임시 비밀번호 생성 중 오류가 발생했습니다.' });
          }

          if (changes === 0) {
            return res.status(400).json({ error: '임시 비밀번호 생성에 실패했습니다.' });
          }

          // Return temporary password to user
          res.json({
            message: '임시 비밀번호가 생성되었습니다.',
            tempPassword: tempPassword,
            notice: '보안을 위해 로그인 후 비밀번호를 변경해주세요.'
          });
        });
      } catch (hashError) {
        console.error('Error hashing temporary password:', hashError);
        res.status(500).json({ error: '임시 비밀번호 처리 중 오류가 발생했습니다.' });
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: '토큰과 새 비밀번호를 입력해주세요.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: '비밀번호는 최소 6자 이상이어야 합니다.' });
    }

    // Hash the received token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Verify token and get user
    db.getPasswordResetToken(tokenHash, async (err, tokenData) => {
      if (err) {
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
      }

      if (!tokenData) {
        return res.status(400).json({ error: '유효하지 않거나 만료된 토큰입니다.' });
      }

      try {
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update user's password
        db.updateUserPassword(tokenData.email, hashedPassword, (err, changes) => {
          if (err) {
            return res.status(500).json({ error: '비밀번호 업데이트 중 오류가 발생했습니다.' });
          }

          if (changes === 0) {
            return res.status(400).json({ error: '비밀번호 업데이트에 실패했습니다.' });
          }

          // Mark token as used
          db.markTokenAsUsed(tokenHash, (err) => {
            if (err) {
              console.error('Error marking token as used:', err);
            }

            // Clean up expired tokens
            db.cleanupExpiredTokens(() => {});

            res.json({ 
              message: '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.' 
            });
          });
        });
      } catch (hashError) {
        console.error('Error hashing password:', hashError);
        res.status(500).json({ error: '비밀번호 처리 중 오류가 발생했습니다.' });
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// Change password (for logged in users)
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: '새 비밀번호는 최소 6자 이상이어야 합니다.' });
    }

    // Get user by email
    db.getUserByEmail(req.user.email, async (err, user) => {
      if (err) {
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
      }

      if (!user) {
        return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      }

      try {
        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ error: '현재 비밀번호가 올바르지 않습니다.' });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        db.updateUserPassword(user.email, hashedNewPassword, (err, changes) => {
          if (err) {
            console.error('Error updating password:', err);
            return res.status(500).json({ error: '비밀번호 변경 중 오류가 발생했습니다.' });
          }

          if (changes === 0) {
            return res.status(400).json({ error: '비밀번호 변경에 실패했습니다.' });
          }

          res.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
        });
      } catch (hashError) {
        console.error('Error processing password:', hashError);
        res.status(500).json({ error: '비밀번호 처리 중 오류가 발생했습니다.' });
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// Make user admin (temporary endpoint for setup)
router.post('/make-admin', async (req, res) => {
  try {
    const { email, secretKey } = req.body;

    // Secret key for security (you can change this)
    if (secretKey !== 'ADMIN_SETUP_SECRET_2024') {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    if (!email) {
      return res.status(400).json({ error: '이메일을 입력해주세요.' });
    }

    // Find user and make admin
    db.getUserByEmail(email, (err, user) => {
      if (err) {
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
      }

      if (!user) {
        return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      }

      if (user.is_admin) {
        return res.status(400).json({ error: '이미 관리자입니다.' });
      }

      // Update user to admin
      db.db.run(
        'UPDATE users SET is_admin = TRUE WHERE email = ?',
        [email],
        function(err) {
          if (err) {
            console.error('Error making user admin:', err);
            return res.status(500).json({ error: '관리자 권한 부여 중 오류가 발생했습니다.' });
          }

          if (this.changes === 0) {
            return res.status(400).json({ error: '관리자 권한 부여에 실패했습니다.' });
          }

          res.json({ message: '관리자 권한이 성공적으로 부여되었습니다.' });
        }
      );
    });
  } catch (error) {
    console.error('Make admin error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// Database connection check (for debugging)
router.get('/db-status', (req, res) => {
  const dbType = process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite';
  const isProduction = process.env.NODE_ENV === 'production';

  // Test shared posts count
  db.getSharedPosts((err, posts) => {
    const sharedPostsCount = err ? 0 : posts.length;
    const sharedPostsError = err ? err.message : null;

    res.json({
      database_type: dbType,
      environment: process.env.NODE_ENV || 'development',
      is_production: isProduction,
      database_url_exists: !!process.env.DATABASE_URL,
      shared_posts_count: sharedPostsCount,
      shared_posts_error: sharedPostsError,
      message: `현재 ${dbType} 데이터베이스를 사용 중입니다. 공유 게시물: ${sharedPostsCount}개`
    });
  });
});

// Cleanup legacy posts (GET 방식으로도 접근 가능)
router.get('/cleanup-legacy', (req, res) => {
  // 관리자만 접근 가능하도록 간단한 체크
  const { secret } = req.query;
  if (secret !== 'cleanup2024') {
    return res.status(403).json({ error: '권한이 없습니다.' });
  }

  console.log('🧹 레거시 공유 게시물 정리 시작...');

  // 먼저 현재 공유 게시물 조회
  db.getSharedPosts((err, posts) => {
    if (err) {
      console.error('공유 게시물 조회 오류:', err);
      return res.status(500).json({
        error: '공유 게시물 조회 중 오류가 발생했습니다.',
        details: err.message
      });
    }

    console.log('현재 공유 게시물:', posts.length + '개');
    const legacyPosts = posts.filter(post => post.session_id && !post.user_id);
    console.log('레거시 게시물:', legacyPosts.length + '개');

    if (legacyPosts.length === 0) {
      return res.json({ message: '삭제할 레거시 게시물이 없습니다.' });
    }

    // PostgreSQL 방식으로 삭제
    if (db.pool) {
      const legacyIds = legacyPosts.map(post => post.interpretation_id);
      console.log('삭제할 interpretation_id:', legacyIds);

      db.pool.query(
        'DELETE FROM shared_posts WHERE interpretation_id = ANY($1)',
        [legacyIds],
        (err, result) => {
          if (err) {
            console.error('PostgreSQL 레거시 포스트 삭제 오류:', err);
            return res.status(500).json({
              error: '삭제 중 오류가 발생했습니다.',
              details: err.message
            });
          }
          console.log('✅ PostgreSQL 레거시 포스트 삭제됨:', result.rowCount);
          res.json({ message: `${result.rowCount}개의 레거시 게시물이 삭제되었습니다.` });
        }
      );
    } else {
      return res.status(500).json({ error: 'PostgreSQL 연결이 없습니다.' });
    }
  });
});

module.exports = router;