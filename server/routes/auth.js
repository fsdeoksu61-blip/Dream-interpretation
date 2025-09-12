const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../models/database');
const { authenticateToken, getSessionId } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/email');

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

// Password reset request
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
        return res.json({ message: '비밀번호 재설정 이메일을 전송했습니다.' });
      }

      // Generate secure random token (32 bytes = 256 bits)
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Hash the token for storage
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      // Set expiration time (20 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 20);

      // Store token in database
      db.createPasswordResetToken(user.id, tokenHash, expiresAt.toISOString(), async (err, tokenId) => {
        if (err) {
          console.error('Error creating password reset token:', err);
          return res.status(500).json({ error: '토큰 생성 중 오류가 발생했습니다.' });
        }

        // Send email with reset link
        const emailResult = await sendPasswordResetEmail(email, resetToken);

        if (!emailResult.success) {
          console.error('Failed to send password reset email:', emailResult.error);
          return res.status(500).json({ error: '이메일 전송 중 오류가 발생했습니다.' });
        }

        res.json({ 
          message: '비밀번호 재설정 링크가 이메일로 전송되었습니다. (20분간 유효)' 
        });
      });
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

module.exports = router;