const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

class PostgreSQLDatabase {
  constructor() {
    // Railway PostgreSQL 연결
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    this.initializeTables();
  }

  async initializeTables() {
    const client = await this.pool.connect();
    try {
      // Users 테이블
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          is_admin BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Interpretations 테이블
      await client.query(`
        CREATE TABLE IF NOT EXISTS interpretations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          session_id VARCHAR(255),
          dream_content TEXT NOT NULL,
          interpretation TEXT NOT NULL,
          is_shared BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Shared_posts 테이블
      await client.query(`
        CREATE TABLE IF NOT EXISTS shared_posts (
          id SERIAL PRIMARY KEY,
          interpretation_id INTEGER REFERENCES interpretations(id),
          title VARCHAR(200) NOT NULL,
          views INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Comments 테이블
      await client.query(`
        CREATE TABLE IF NOT EXISTS comments (
          id SERIAL PRIMARY KEY,
          post_id INTEGER REFERENCES shared_posts(id),
          user_id INTEGER REFERENCES users(id),
          session_id VARCHAR(255),
          username VARCHAR(50) NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Likes 테이블
      await client.query(`
        CREATE TABLE IF NOT EXISTS likes (
          id SERIAL PRIMARY KEY,
          post_id INTEGER REFERENCES shared_posts(id),
          user_id INTEGER REFERENCES users(id),
          session_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(post_id, user_id, session_id)
        )
      `);

      console.log('✅ PostgreSQL 테이블 초기화 완료');

      // 관리자 계정 생성
      await this.createDefaultAdmin();

    } catch (error) {
      console.error('❌ PostgreSQL 테이블 초기화 실패:', error);
    } finally {
      client.release();
    }
  }

  async createDefaultAdmin() {
    const client = await this.pool.connect();
    try {
      const adminEmail = 'admin@dreamai.co.kr';
      const adminUsername = 'admin';
      const adminPassword = 'password123';

      // 관리자 계정 존재 확인
      const existingAdmin = await client.query(
        'SELECT * FROM users WHERE email = $1 OR username = $2',
        [adminEmail, adminUsername]
      );

      if (existingAdmin.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await client.query(
          'INSERT INTO users (username, email, password, is_admin) VALUES ($1, $2, $3, $4)',
          [adminUsername, adminEmail, hashedPassword, true]
        );
        console.log('✅ PostgreSQL 관리자 계정 생성 완료');
      } else {
        console.log('ℹ️ PostgreSQL 관리자 계정이 이미 존재합니다');
      }
    } catch (error) {
      console.error('❌ PostgreSQL 관리자 계정 생성 실패:', error);
    } finally {
      client.release();
    }
  }

  // 사용자 생성
  createUser(username, email, hashedPassword, callback) {
    this.pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
      [username, email, hashedPassword],
      (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result.rows[0].id);
        }
      }
    );
  }

  // 사용자 조회 (이메일)
  getUserByEmail(email, callback) {
    this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
      (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result.rows[0]);
        }
      }
    );
  }

  // 사용자 조회 (사용자명)
  getUserByUsername(username, callback) {
    this.pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username],
      (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result.rows[0]);
        }
      }
    );
  }

  // 사용자 조회 (ID)
  getUserById(id, callback) {
    this.pool.query(
      'SELECT id, username, email, is_admin FROM users WHERE id = $1',
      [id],
      (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result.rows[0]);
        }
      }
    );
  }

  // 해석 생성
  createInterpretation(data, callback) {
    this.pool.query(
      'INSERT INTO interpretations (user_id, session_id, dream_content, interpretation, is_shared) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [data.user_id, data.session_id, data.dream_content, data.interpretation, data.is_shared],
      (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result.rows[0].id);
        }
      }
    );
  }

  // 사용자별 해석 조회
  getUserInterpretations(userId, sessionId, callback) {
    let query, params;

    if (userId) {
      query = 'SELECT * FROM interpretations WHERE user_id = $1 ORDER BY created_at DESC';
      params = [userId];
    } else {
      query = 'SELECT * FROM interpretations WHERE session_id = $1 ORDER BY created_at DESC';
      params = [sessionId];
    }

    this.pool.query(query, params, (err, result) => {
      if (err) {
        callback(err);
      } else {
        callback(null, result.rows);
      }
    });
  }

  // 해석 조회 (ID)
  getInterpretationById(id, callback) {
    this.pool.query(
      'SELECT * FROM interpretations WHERE id = $1',
      [id],
      (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result.rows[0]);
        }
      }
    );
  }

  // 공유 게시물 생성
  createSharedPost(interpretationId, title, callback) {
    const client = this.pool.connect();
    client.then(c => {
      c.query('BEGIN')
        .then(() => c.query(
          'UPDATE interpretations SET is_shared = TRUE WHERE id = $1',
          [interpretationId]
        ))
        .then(() => c.query(
          'INSERT INTO shared_posts (interpretation_id, title) VALUES ($1, $2) RETURNING id',
          [interpretationId, title]
        ))
        .then(result => {
          c.query('COMMIT');
          callback(null, result.rows[0].id);
        })
        .catch(err => {
          c.query('ROLLBACK');
          callback(err);
        })
        .finally(() => c.release());
    }).catch(callback);
  }

  // 공유 게시물 목록 조회
  getSharedPosts(callback) {
    const query = `
      SELECT
        sp.id,
        sp.title,
        sp.views,
        sp.likes,
        sp.created_at,
        i.dream_content,
        i.interpretation,
        u.username
      FROM shared_posts sp
      JOIN interpretations i ON sp.interpretation_id = i.id
      LEFT JOIN users u ON i.user_id = u.id
      ORDER BY sp.created_at DESC
    `;

    this.pool.query(query, (err, result) => {
      if (err) {
        callback(err);
      } else {
        callback(null, result.rows);
      }
    });
  }

  // 공유 게시물 조회 (ID)
  getSharedPostById(id, callback) {
    const query = `
      SELECT
        sp.id,
        sp.title,
        sp.views,
        sp.likes,
        sp.created_at,
        i.dream_content,
        i.interpretation,
        u.username
      FROM shared_posts sp
      JOIN interpretations i ON sp.interpretation_id = i.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE sp.id = $1
    `;

    this.pool.query(query, [id], (err, result) => {
      if (err) {
        callback(err);
      } else {
        callback(null, result.rows[0]);
      }
    });
  }

  // 게시물 조회수 증가
  incrementPostViews(postId, callback) {
    this.pool.query(
      'UPDATE shared_posts SET views = views + 1 WHERE id = $1',
      [postId],
      callback
    );
  }

  // 댓글 생성
  createComment(postId, userId, sessionId, username, content, callback) {
    this.pool.query(
      'INSERT INTO comments (post_id, user_id, session_id, username, content) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [postId, userId, sessionId, username, content],
      (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result.rows[0].id);
        }
      }
    );
  }

  // 게시물 댓글 조회
  getPostComments(postId, callback) {
    this.pool.query(
      'SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC',
      [postId],
      (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result.rows);
        }
      }
    );
  }

  // 좋아요 토글
  toggleLike(postId, userId, sessionId, callback) {
    const client = this.pool.connect();
    client.then(c => {
      // 기존 좋아요 확인
      let checkQuery, checkParams;
      if (userId) {
        checkQuery = 'SELECT * FROM likes WHERE post_id = $1 AND user_id = $2';
        checkParams = [postId, userId];
      } else {
        checkQuery = 'SELECT * FROM likes WHERE post_id = $1 AND session_id = $2';
        checkParams = [postId, sessionId];
      }

      c.query(checkQuery, checkParams)
        .then(result => {
          if (result.rows.length > 0) {
            // 좋아요 취소
            let deleteQuery, deleteParams;
            if (userId) {
              deleteQuery = 'DELETE FROM likes WHERE post_id = $1 AND user_id = $2';
              deleteParams = [postId, userId];
            } else {
              deleteQuery = 'DELETE FROM likes WHERE post_id = $1 AND session_id = $2';
              deleteParams = [postId, sessionId];
            }

            return c.query(deleteQuery, deleteParams)
              .then(() => c.query('UPDATE shared_posts SET likes = likes - 1 WHERE id = $1', [postId]));
          } else {
            // 좋아요 추가
            return c.query(
              'INSERT INTO likes (post_id, user_id, session_id) VALUES ($1, $2, $3)',
              [postId, userId, sessionId]
            ).then(() => c.query('UPDATE shared_posts SET likes = likes + 1 WHERE id = $1', [postId]));
          }
        })
        .then(() => callback(null))
        .catch(callback)
        .finally(() => c.release());
    }).catch(callback);
  }

  // 모든 사용자 조회 (관리자용)
  getAllUsers(callback) {
    this.pool.query(
      'SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC',
      (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result.rows);
        }
      }
    );
  }

  // 사용자 삭제 (관리자용)
  deleteUser(id, callback) {
    this.pool.query(
      'DELETE FROM users WHERE id = $1',
      [id],
      callback
    );
  }
}

module.exports = PostgreSQLDatabase;