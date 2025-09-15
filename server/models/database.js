const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    // Railway PostgreSQL 설정 상태 확인
    if (process.env.DATABASE_URL) {
      console.log('🔍 DATABASE_URL found - Railway PostgreSQL is configured');
      console.log('📊 Currently using SQLite for stability');
    } else {
      console.log('📝 DATABASE_URL not found - Railway PostgreSQL not configured');
    }

    this.db = new sqlite3.Database(path.join(__dirname, '../database.db'));
    
    // UTF-8 인코딩 강제 설정
    this.db.serialize(() => {
      this.db.run("PRAGMA encoding = 'UTF-8';");
      this.db.run("PRAGMA journal_mode = WAL;");
    });
    
    this.init();
  }

  init() {
    this.db.serialize(() => {
      // Users table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE,
          password TEXT,
          username TEXT,
          is_admin BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Sessions table for guest users
      this.db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME
        )
      `);

      // Dream interpretations table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS dream_interpretations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          session_id TEXT,
          dream_content TEXT NOT NULL,
          interpretation TEXT NOT NULL,
          is_shared BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (session_id) REFERENCES sessions (id)
        )
      `);

      // Shared posts table (게시판용)
      this.db.run(`
        CREATE TABLE IF NOT EXISTS shared_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          interpretation_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          views INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (interpretation_id) REFERENCES dream_interpretations (id)
        )
      `);

      // Comments table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id INTEGER,
          session_id TEXT,
          username TEXT,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES shared_posts (id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (session_id) REFERENCES sessions (id)
        )
      `);

      // Community posts table (일반 게시판)
      this.db.run(`
        CREATE TABLE IF NOT EXISTS community_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          session_id TEXT,
          username TEXT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          is_announcement BOOLEAN DEFAULT FALSE,
          views INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (session_id) REFERENCES sessions (id)
        )
      `);

      // Community comments table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS community_comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id INTEGER,
          session_id TEXT,
          username TEXT,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES community_posts (id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (session_id) REFERENCES sessions (id)
        )
      `);

      // Community post likes table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS community_post_likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id INTEGER,
          session_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES community_posts (id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (session_id) REFERENCES sessions (id),
          UNIQUE(post_id, user_id),
          UNIQUE(post_id, session_id)
        )
      `);

      // Likes table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS post_likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id INTEGER,
          session_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES shared_posts (id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (session_id) REFERENCES sessions (id),
          UNIQUE(post_id, user_id),
          UNIQUE(post_id, session_id)
        )
      `);

      // Password reset tokens table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at DATETIME NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Create default admin user
      this.createDefaultAdmin();
      
      // Add announcement column to existing community_posts table if not exists
      this.db.run(`
        ALTER TABLE community_posts ADD COLUMN is_announcement BOOLEAN DEFAULT FALSE
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding is_announcement column:', err);
        }
      });
    });
  }

  createDefaultAdmin() {
    const bcrypt = require('bcryptjs');
    const adminEmail = 'admin@dreamai.co.kr';
    const adminPassword = 'password123';

    // Create admin@dreamai.co.kr account if it doesn't exist
    this.db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, row) => {
      if (!row) {
        const hashedPassword = bcrypt.hashSync(adminPassword, 12);
        this.db.run(
          'INSERT INTO users (email, password, username, is_admin) VALUES (?, ?, ?, ?)',
          [adminEmail, hashedPassword, 'Administrator', 1],
          (err) => {
            if (err) {
              console.error('Error creating admin user:', err);
            } else {
              console.log('✅ Default admin user created: admin@dreamai.co.kr');
            }
          }
        );
      } else {
        console.log('✅ Admin user already exists: admin@dreamai.co.kr');
      }
    });
  }

  // User methods
  createUser(email, hashedPassword, username, callback) {
    this.db.run(
      'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
      [email, hashedPassword, username],
      function(err) {
        callback(err, this ? this.lastID : null);
      }
    );
  }

  getUserByEmail(email, callback) {
    this.db.get('SELECT * FROM users WHERE email = ?', [email], callback);
  }

  getUserById(id, callback) {
    this.db.get('SELECT * FROM users WHERE id = ?', [id], callback);
  }

  updateUserPassword(email, hashedPassword, callback) {
    this.db.run(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, email],
      function(err) {
        callback(err, this ? this.changes : 0);
      }
    );
  }

  // Session methods
  createSession(sessionId, callback) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry
    
    this.db.run(
      'INSERT INTO sessions (id, expires_at) VALUES (?, ?)',
      [sessionId, expiresAt.toISOString()],
      callback
    );
  }

  getSession(sessionId, callback) {
    this.db.get('SELECT * FROM sessions WHERE id = ?', [sessionId], callback);
  }

  // Dream interpretation methods
  createInterpretation(data, callback) {
    this.db.run(
      'INSERT INTO dream_interpretations (user_id, session_id, dream_content, interpretation, is_shared) VALUES (?, ?, ?, ?, ?)',
      [data.user_id, data.session_id, data.dream_content, data.interpretation, data.is_shared || false],
      function(err) {
        callback(err, this ? this.lastID : null);
      }
    );
  }

  getUserInterpretations(userId, sessionId, callback) {
    let query, params;
    
    if (userId) {
      query = 'SELECT * FROM dream_interpretations WHERE user_id = ? ORDER BY created_at DESC';
      params = [userId];
    } else {
      query = 'SELECT * FROM dream_interpretations WHERE session_id = ? ORDER BY created_at DESC';
      params = [sessionId];
    }
    
    this.db.all(query, params, callback);
  }

  getInterpretationById(id, callback) {
    this.db.get('SELECT * FROM dream_interpretations WHERE id = ?', [id], callback);
  }

  // Shared posts methods
  createSharedPost(interpretationId, title, callback) {
    // First, mark the interpretation as shared
    this.db.run('UPDATE dream_interpretations SET is_shared = TRUE WHERE id = ?', [interpretationId]);
    
    // Create the shared post
    this.db.run(
      'INSERT INTO shared_posts (interpretation_id, title) VALUES (?, ?)',
      [interpretationId, title],
      function(err) {
        callback(err, this ? this.lastID : null);
      }
    );
  }

  getSharedPosts(callback) {
    const query = `
      SELECT sp.*, di.dream_content, di.interpretation, di.created_at as interpretation_date,
             u.username as author_username, di.session_id, di.user_id
      FROM shared_posts sp
      JOIN dream_interpretations di ON sp.interpretation_id = di.id
      LEFT JOIN users u ON di.user_id = u.id
      ORDER BY sp.created_at DESC
    `;
    this.db.all(query, (err, posts) => {
      if (err) return callback(err);

      // 게스트 사용자를 위한 표시명 생성
      const processedPosts = posts.map(post => {
        if (!post.author_username && post.session_id) {
          // 세션 ID의 마지막 6자리를 사용해서 게스트 구분
          const shortSessionId = post.session_id.slice(-6);
          post.author_username = `게스트${shortSessionId}`;
        }
        return post;
      });

      callback(null, processedPosts);
    });
  }

  getSharedPostById(id, callback) {
    const query = `
      SELECT sp.*, di.dream_content, di.interpretation, di.created_at as interpretation_date,
             u.username as author_username, di.session_id, di.user_id
      FROM shared_posts sp
      JOIN dream_interpretations di ON sp.interpretation_id = di.id
      LEFT JOIN users u ON di.user_id = u.id
      WHERE sp.id = ?
    `;
    this.db.get(query, [id], (err, post) => {
      if (err) return callback(err);

      if (post && !post.author_username && post.session_id) {
        // 세션 ID의 마지막 6자리를 사용해서 게스트 구분
        const shortSessionId = post.session_id.slice(-6);
        post.author_username = `게스트${shortSessionId}`;
      }

      callback(null, post);
    });
  }

  incrementPostViews(postId, callback) {
    this.db.run('UPDATE shared_posts SET views = views + 1 WHERE id = ?', [postId], callback);
  }

  // Comments methods
  createComment(postId, userId, sessionId, username, content, callback) {
    this.db.run(
      'INSERT INTO comments (post_id, user_id, session_id, username, content) VALUES (?, ?, ?, ?, ?)',
      [postId, userId, sessionId, username, content],
      function(err) {
        callback(err, this ? this.lastID : null);
      }
    );
  }

  getPostComments(postId, callback) {
    const query = `
      SELECT c.*, u.username as user_username
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `;
    this.db.all(query, [postId], callback);
  }

  // Likes methods
  toggleLike(postId, userId, sessionId, callback) {
    const checkQuery = userId 
      ? 'SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?'
      : 'SELECT * FROM post_likes WHERE post_id = ? AND session_id = ?';
    const checkParams = userId ? [postId, userId] : [postId, sessionId];
    
    this.db.get(checkQuery, checkParams, (err, row) => {
      if (err) return callback(err);
      
      if (row) {
        // Unlike
        const deleteQuery = userId 
          ? 'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?'
          : 'DELETE FROM post_likes WHERE post_id = ? AND session_id = ?';
        
        this.db.run(deleteQuery, checkParams, (err) => {
          if (err) return callback(err);
          this.db.run('UPDATE shared_posts SET likes = likes - 1 WHERE id = ?', [postId], callback);
        });
      } else {
        // Like
        this.db.run(
          'INSERT INTO post_likes (post_id, user_id, session_id) VALUES (?, ?, ?)',
          [postId, userId, sessionId],
          (err) => {
            if (err) return callback(err);
            this.db.run('UPDATE shared_posts SET likes = likes + 1 WHERE id = ?', [postId], callback);
          }
        );
      }
    });
  }

  // Admin methods
  getAllUsers(callback) {
    this.db.all('SELECT id, email, username, is_admin, created_at FROM users ORDER BY created_at DESC', callback);
  }

  getAllInterpretations(callback) {
    const query = `
      SELECT di.*, u.username, u.email
      FROM dream_interpretations di
      LEFT JOIN users u ON di.user_id = u.id
      ORDER BY di.created_at DESC
    `;
    this.db.all(query, callback);
  }

  deleteInterpretation(id, callback) {
    this.db.run('DELETE FROM dream_interpretations WHERE id = ?', [id], callback);
  }

  deleteUser(id, callback) {
    this.db.run('DELETE FROM users WHERE id = ?', [id], callback);
  }

  // Community posts methods
  createCommunityPost(userId, sessionId, username, title, content, isAnnouncement = false, callback) {
    this.db.run(
      'INSERT INTO community_posts (user_id, session_id, username, title, content, is_announcement) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, sessionId, username, title, content, isAnnouncement],
      function(err) {
        callback(err, this ? this.lastID : null);
      }
    );
  }

  getCommunityPosts(options = {}, callback) {
    const { search, sortBy = 'latest', page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT cp.*, u.username as author_username,
             COUNT(cc.id) as comment_count
      FROM community_posts cp
      LEFT JOIN users u ON cp.user_id = u.id
      LEFT JOIN community_comments cc ON cp.id = cc.post_id
    `;
    
    let whereClause = '';
    let params = [];
    
    if (search) {
      whereClause = 'WHERE (cp.title LIKE ? OR cp.content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += whereClause + ' GROUP BY cp.id';
    
    // Add sorting (announcements always first)
    switch (sortBy) {
      case 'popular':
        query += ' ORDER BY cp.is_announcement DESC, cp.likes DESC, cp.created_at DESC';
        break;
      case 'views':
        query += ' ORDER BY cp.is_announcement DESC, cp.views DESC, cp.created_at DESC';
        break;
      case 'comments':
        query += ' ORDER BY cp.is_announcement DESC, comment_count DESC, cp.created_at DESC';
        break;
      case 'latest':
      default:
        query += ' ORDER BY cp.is_announcement DESC, cp.created_at DESC';
        break;
    }
    
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    this.db.all(query, params, callback);
  }

  // For backward compatibility
  getAllCommunityPosts(callback) {
    this.getCommunityPosts({}, callback);
  }

  // Get count of community posts (can filter by announcement status)
  getCommunityPostCount(isAnnouncement, callback) {
    let query = 'SELECT COUNT(*) as count FROM community_posts';
    let params = [];
    
    if (isAnnouncement !== undefined) {
      query += ' WHERE is_announcement = ?';
      params.push(isAnnouncement ? 1 : 0);
    }
    
    this.db.get(query, params, (err, row) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, row.count);
      }
    });
  }

  getCommunityPostById(id, callback) {
    this.db.get('SELECT * FROM community_posts WHERE id = ?', [id], callback);
  }

  updateCommunityPost(id, title, content, isAnnouncement, callback) {
    this.db.run(
      'UPDATE community_posts SET title = ?, content = ?, is_announcement = ? WHERE id = ?',
      [title, content, isAnnouncement ? 1 : 0, id],
      callback
    );
  }

  deleteCommunityPost(id, callback) {
    // Delete post likes first
    this.db.run('DELETE FROM community_post_likes WHERE post_id = ?', [id], (err) => {
      if (err) return callback(err);
      
      // Delete comments
      this.db.run('DELETE FROM community_comments WHERE post_id = ?', [id], (err) => {
        if (err) return callback(err);
        
        // Delete post
        this.db.run('DELETE FROM community_posts WHERE id = ?', [id], callback);
      });
    });
  }

  incrementCommunityPostViews(postId, callback) {
    this.db.run('UPDATE community_posts SET views = views + 1 WHERE id = ?', [postId], callback);
  }

  // Community comments methods
  createCommunityComment(postId, userId, sessionId, username, content, callback) {
    this.db.run(
      'INSERT INTO community_comments (post_id, user_id, session_id, username, content) VALUES (?, ?, ?, ?, ?)',
      [postId, userId, sessionId, username, content],
      function(err) {
        callback(err, this ? this.lastID : null);
      }
    );
  }

  getCommunityPostComments(postId, callback) {
    const query = `
      SELECT cc.*, u.username as user_username
      FROM community_comments cc
      LEFT JOIN users u ON cc.user_id = u.id
      WHERE cc.post_id = ?
      ORDER BY cc.created_at ASC
    `;
    this.db.all(query, [postId], callback);
  }

  // Community likes methods
  toggleCommunityLike(postId, userId, sessionId, callback) {
    const checkQuery = userId 
      ? 'SELECT * FROM community_post_likes WHERE post_id = ? AND user_id = ?'
      : 'SELECT * FROM community_post_likes WHERE post_id = ? AND session_id = ?';
    const checkParams = userId ? [postId, userId] : [postId, sessionId];
    
    this.db.get(checkQuery, checkParams, (err, row) => {
      if (err) return callback(err);
      
      if (row) {
        // Unlike
        const deleteQuery = userId 
          ? 'DELETE FROM community_post_likes WHERE post_id = ? AND user_id = ?'
          : 'DELETE FROM community_post_likes WHERE post_id = ? AND session_id = ?';
        
        this.db.run(deleteQuery, checkParams, (err) => {
          if (err) return callback(err);
          this.db.run('UPDATE community_posts SET likes = likes - 1 WHERE id = ?', [postId], callback);
        });
      } else {
        // Like
        this.db.run(
          'INSERT INTO community_post_likes (post_id, user_id, session_id) VALUES (?, ?, ?)',
          [postId, userId, sessionId],
          (err) => {
            if (err) return callback(err);
            this.db.run('UPDATE community_posts SET likes = likes + 1 WHERE id = ?', [postId], callback);
          }
        );
      }
    });
  }

  // Migration for guest users when they register
  migrateGuestData(sessionId, userId, callback) {
    this.db.run(
      'UPDATE dream_interpretations SET user_id = ?, session_id = NULL WHERE session_id = ?',
      [userId, sessionId],
      callback
    );
  }

  // Password reset token methods
  createPasswordResetToken(userId, tokenHash, expiresAt, callback) {
    // First, remove any existing tokens for this user
    this.db.run('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId], (err) => {
      if (err) return callback(err);
      
      // Create new token
      this.db.run(
        'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
        [userId, tokenHash, expiresAt],
        function(err) {
          callback(err, this ? this.lastID : null);
        }
      );
    });
  }

  getPasswordResetToken(tokenHash, callback) {
    const query = `
      SELECT prt.*, u.email, u.id as user_id
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token_hash = ? AND prt.used = FALSE AND prt.expires_at > datetime('now')
    `;
    this.db.get(query, [tokenHash], callback);
  }

  markTokenAsUsed(tokenHash, callback) {
    this.db.run(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token_hash = ?',
      [tokenHash],
      callback
    );
  }

  cleanupExpiredTokens(callback) {
    this.db.run(
      'DELETE FROM password_reset_tokens WHERE expires_at <= datetime(\'now\') OR used = TRUE',
      callback
    );
  }
}

module.exports = new Database();