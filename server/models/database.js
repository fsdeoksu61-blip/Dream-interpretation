const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

class Database {
  constructor() {
    // Railway 프로덕션 환경에서는 데이터 지속성을 위해 PostgreSQL 우선 사용
    if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
      console.log('🔄 PostgreSQL 데이터베이스로 연결 중... (프로덕션 환경)');
      try {
        this.initPostgreSQL();
      } catch (error) {
        console.error('❌ PostgreSQL 연결 실패:', error);
        console.log('🔄 SQLite로 fallback...');
        this.initSQLite();
      }
    } else {
      console.log('🔄 SQLite 데이터베이스로 연결 중...');
      this.initSQLite();
    }
  }

  initPostgreSQL() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    console.log('✅ PostgreSQL 연결 완료');
    this.initPostgreSQLTables().catch(error => {
      console.error('❌ PostgreSQL 테이블 초기화 실패:', error);
      throw error;
    });
  }

  async initPostgreSQLTables() {
    const client = await this.pool.connect();
    try {
      console.log('🔄 PostgreSQL 테이블 생성 중...');

      // Users 테이블
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          username VARCHAR(50) NOT NULL,
          is_admin BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Sessions 테이블 (게스트 사용자용)
      await client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id VARCHAR(255) PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP
        )
      `);

      // Dream interpretations 테이블
      await client.query(`
        CREATE TABLE IF NOT EXISTS dream_interpretations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          session_id VARCHAR(255) REFERENCES sessions(id),
          dream_content TEXT NOT NULL,
          interpretation TEXT NOT NULL,
          is_shared BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Shared posts 테이블
      await client.query(`
        CREATE TABLE IF NOT EXISTS shared_posts (
          id SERIAL PRIMARY KEY,
          interpretation_id INTEGER REFERENCES dream_interpretations(id),
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
          session_id VARCHAR(255) REFERENCES sessions(id),
          username VARCHAR(50) NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Post likes 테이블
      await client.query(`
        CREATE TABLE IF NOT EXISTS post_likes (
          id SERIAL PRIMARY KEY,
          post_id INTEGER REFERENCES shared_posts(id),
          user_id INTEGER REFERENCES users(id),
          session_id VARCHAR(255) REFERENCES sessions(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(post_id, user_id),
          UNIQUE(post_id, session_id)
        )
      `);

      console.log('✅ PostgreSQL 테이블 생성 완료');
      await this.createDefaultAdmin();

    } catch (error) {
      console.error('❌ PostgreSQL 테이블 생성 실패:', error);
    } finally {
      client.release();
    }
  }

  async createDefaultAdmin() {
    const client = await this.pool.connect();
    try {
      const adminEmail = 'admin@dreamai.co.kr';
      const adminPassword = 'password123';

      // 관리자 계정 존재 확인
      const existingAdmin = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [adminEmail]
      );

      if (existingAdmin.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        await client.query(
          'INSERT INTO users (email, password, username, is_admin) VALUES ($1, $2, $3, $4)',
          [adminEmail, hashedPassword, 'Administrator', true]
        );
        console.log('✅ PostgreSQL 관리자 계정 생성 완료: admin@dreamai.co.kr');
      } else {
        console.log('✅ PostgreSQL 관리자 계정이 이미 존재합니다: admin@dreamai.co.kr');
      }
    } catch (error) {
      console.error('❌ PostgreSQL 관리자 계정 생성 실패:', error);
    } finally {
      client.release();
    }
  }

  initSQLite() {
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const os = require('os');

    // Railway에서는 임시 디렉토리를 사용하거나 메모리 DB 사용
    let dbPath;
    if (process.env.NODE_ENV === 'production' && process.env.RAILWAY_ENVIRONMENT) {
      // Railway 환경에서는 메모리 데이터베이스 사용
      dbPath = ':memory:';
      console.log('🔄 메모리 SQLite 데이터베이스 사용 (Railway 환경)');
    } else {
      // 로컬 개발 환경에서는 파일 데이터베이스 사용
      dbPath = path.join(__dirname, '../database.db');
      console.log('🔄 파일 SQLite 데이터베이스 사용 (개발 환경)');
    }

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ SQLite 연결 오류:', err);
        throw err;
      } else {
        console.log('✅ SQLite 연결 성공:', dbPath);
      }
    });

    this.db.serialize(() => {
      this.db.run("PRAGMA encoding = 'UTF-8';");
      this.db.run("PRAGMA journal_mode = WAL;");
    });

    this.initSQLiteTables();
  }

  initSQLiteTables() {
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

      // Sessions table
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
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Posts table for shared dreams
      this.db.run(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          interpretation_id INTEGER,
          title TEXT,
          likes INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (interpretation_id) REFERENCES dream_interpretations (id)
        )
      `);

      // Comments table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER,
          content TEXT NOT NULL,
          username TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts (id)
        )
      `);

      // Community posts table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS community_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          views INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      console.log('✅ SQLite 테이블 생성 완료');
    });

    this.createDefaultAdminSQLite();
  }

  createDefaultAdminSQLite() {
    const adminEmail = 'admin@dreamai.co.kr';
    const adminPassword = 'password123';

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

  // PostgreSQL과 SQLite 통합 메서드들
  createUser(email, hashedPassword, username, callback) {
    if (this.pool) {
      // PostgreSQL
      this.pool.query(
        'INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING id',
        [email, hashedPassword, username],
        (err, result) => {
          if (err) {
            callback(err);
          } else {
            callback(null, result.rows[0].id);
          }
        }
      );
    } else {
      // SQLite
      this.db.run(
        'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
        [email, hashedPassword, username],
        function(err) {
          callback(err, this ? this.lastID : null);
        }
      );
    }
  }

  getUserByEmail(email, callback) {
    if (this.pool) {
      // PostgreSQL
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
    } else {
      // SQLite
      this.db.get('SELECT * FROM users WHERE email = ?', [email], callback);
    }
  }

  getUserById(id, callback) {
    if (this.pool) {
      // PostgreSQL
      this.pool.query(
        'SELECT * FROM users WHERE id = $1',
        [id],
        (err, result) => {
          if (err) {
            callback(err);
          } else {
            callback(null, result.rows[0]);
          }
        }
      );
    } else {
      // SQLite
      this.db.get('SELECT * FROM users WHERE id = ?', [id], callback);
    }
  }

  createInterpretation(data, callback) {
    console.log('🔄 Creating interpretation:', {
      hasPool: !!this.pool,
      hasDb: !!this.db,
      userId: data.user_id,
      sessionId: data.session_id,
      contentLength: data.dream_content?.length
    });

    if (this.pool) {
      // PostgreSQL
      this.pool.query(
        'INSERT INTO dream_interpretations (user_id, session_id, dream_content, interpretation, is_shared) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [data.user_id, data.session_id, data.dream_content, data.interpretation, data.is_shared || false],
        (err, result) => {
          if (err) {
            console.error('❌ PostgreSQL insert error:', err);
            callback(err);
          } else {
            console.log('✅ PostgreSQL insert success:', result.rows[0].id);
            callback(null, result.rows[0].id);
          }
        }
      );
    } else if (this.db) {
      // SQLite
      this.db.run(
        'INSERT INTO dream_interpretations (user_id, session_id, dream_content, interpretation, is_shared) VALUES (?, ?, ?, ?, ?)',
        [data.user_id, data.session_id, data.dream_content, data.interpretation, data.is_shared || false],
        function(err) {
          if (err) {
            console.error('❌ SQLite insert error:', err);
            callback(err);
          } else {
            console.log('✅ SQLite insert success:', this.lastID);
            callback(null, this.lastID);
          }
        }
      );
    } else {
      console.error('❌ No database connection available');
      callback(new Error('데이터베이스 연결이 없습니다.'));
    }
  }

  createSession(sessionId, callback) {
    console.log('🔄 Creating session:', sessionId);

    if (this.pool) {
      // PostgreSQL
      this.pool.query(
        'INSERT INTO sessions (id, expires_at) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
        [sessionId, new Date(Date.now() + 24 * 60 * 60 * 1000)], // 24 hours from now
        (err) => {
          if (err) {
            console.error('❌ PostgreSQL session insert error:', err);
            callback(err);
          } else {
            console.log('✅ PostgreSQL session created');
            callback(null);
          }
        }
      );
    } else if (this.db) {
      // SQLite
      this.db.run(
        'INSERT OR IGNORE INTO sessions (id, expires_at) VALUES (?, ?)',
        [sessionId, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()],
        (err) => {
          if (err) {
            console.error('❌ SQLite session insert error:', err);
            callback(err);
          } else {
            console.log('✅ SQLite session created');
            callback(null);
          }
        }
      );
    } else {
      console.error('❌ No database connection available for session');
      callback(new Error('데이터베이스 연결이 없습니다.'));
    }
  }

  getUserInterpretations(userId, sessionId, callback) {
    if (this.pool) {
      // PostgreSQL
      let query, params;
      if (userId) {
        query = 'SELECT * FROM dream_interpretations WHERE user_id = $1 ORDER BY created_at DESC';
        params = [userId];
      } else {
        query = 'SELECT * FROM dream_interpretations WHERE session_id = $1 ORDER BY created_at DESC';
        params = [sessionId];
      }

      this.pool.query(query, params, (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result.rows);
        }
      });
    } else {
      // SQLite
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
  }

  getInterpretationById(id, callback) {
    if (this.pool) {
      // PostgreSQL
      this.pool.query(
        'SELECT * FROM dream_interpretations WHERE id = $1',
        [id],
        (err, result) => {
          if (err) {
            callback(err);
          } else {
            callback(null, result.rows[0]);
          }
        }
      );
    } else {
      // SQLite
      this.db.get('SELECT * FROM dream_interpretations WHERE id = ?', [id], callback);
    }
  }

  createSharedPost(interpretationId, title, callback) {
    if (this.pool) {
      // PostgreSQL - 트랜잭션 사용
      this.pool.connect((err, client, done) => {
        if (err) return callback(err);

        client.query('BEGIN', (err) => {
          if (err) {
            done();
            return callback(err);
          }

          client.query(
            'UPDATE dream_interpretations SET is_shared = TRUE WHERE id = $1',
            [interpretationId],
            (err) => {
              if (err) {
                client.query('ROLLBACK', () => done());
                return callback(err);
              }

              client.query(
                'INSERT INTO shared_posts (interpretation_id, title) VALUES ($1, $2) RETURNING id',
                [interpretationId, title],
                (err, result) => {
                  if (err) {
                    client.query('ROLLBACK', () => done());
                    return callback(err);
                  }

                  client.query('COMMIT', (err) => {
                    done();
                    if (err) return callback(err);
                    callback(null, result.rows[0].id);
                  });
                }
              );
            }
          );
        });
      });
    } else {
      // SQLite
      this.db.run('UPDATE dream_interpretations SET is_shared = TRUE WHERE id = ?', [interpretationId]);
      this.db.run(
        'INSERT INTO shared_posts (interpretation_id, title) VALUES (?, ?)',
        [interpretationId, title],
        function(err) {
          callback(err, this ? this.lastID : null);
        }
      );
    }
  }

  getSharedPosts(callback) {
    console.log('🔄 Getting shared posts for admin');

    if (this.pool) {
      // PostgreSQL - shared_posts 테이블 사용
      const query = `
        SELECT sp.*, di.dream_content, di.interpretation, di.created_at as interpretation_date,
               u.username as author_username, di.session_id, di.user_id
        FROM shared_posts sp
        JOIN dream_interpretations di ON sp.interpretation_id = di.id
        LEFT JOIN users u ON di.user_id = u.id
        ORDER BY sp.created_at DESC
      `;

      this.pool.query(query, (err, result) => {
        if (err) {
          console.error('❌ PostgreSQL getSharedPosts error:', err);
          return callback(err);
        }

        const processedPosts = result.rows.map(post => {
          if (!post.author_username && post.session_id) {
            const shortSessionId = post.session_id.slice(-6);
            post.author_username = `게스트${shortSessionId}`;
          }
          return post;
        });

        console.log('✅ PostgreSQL getSharedPosts success:', processedPosts.length);
        callback(null, processedPosts);
      });
    } else if (this.db) {
      // SQLite - posts 테이블 사용
      const query = `
        SELECT p.*, di.dream_content, di.interpretation, di.created_at as interpretation_date,
               u.username as author_username, di.session_id, di.user_id
        FROM posts p
        JOIN dream_interpretations di ON p.interpretation_id = di.id
        LEFT JOIN users u ON di.user_id = u.id
        ORDER BY p.created_at DESC
      `;

      this.db.all(query, (err, posts) => {
        if (err) {
          console.error('❌ SQLite getSharedPosts error:', err);
          return callback(err);
        }

        const processedPosts = posts.map(post => {
          if (!post.author_username && post.session_id) {
            const shortSessionId = post.session_id.slice(-6);
            post.author_username = `게스트${shortSessionId}`;
          }
          return post;
        });

        console.log('✅ SQLite getSharedPosts success:', processedPosts.length);
        callback(null, processedPosts);
      });
    } else {
      console.error('❌ No database connection for getSharedPosts');
      callback(new Error('데이터베이스 연결이 없습니다.'));
    }
  }

  getSharedPostById(id, callback) {
    const query = `
      SELECT sp.*, di.dream_content, di.interpretation, di.created_at as interpretation_date,
             u.username as author_username, di.session_id, di.user_id
      FROM shared_posts sp
      JOIN dream_interpretations di ON sp.interpretation_id = di.id
      LEFT JOIN users u ON di.user_id = u.id
      WHERE sp.id = ${this.pool ? '$1' : '?'}
    `;

    if (this.pool) {
      // PostgreSQL
      this.pool.query(query, [id], (err, result) => {
        if (err) return callback(err);

        const post = result.rows[0];
        if (post && !post.author_username && post.session_id) {
          const shortSessionId = post.session_id.slice(-6);
          post.author_username = `게스트${shortSessionId}`;
        }

        callback(null, post);
      });
    } else {
      // SQLite
      this.db.get(query, [id], (err, post) => {
        if (err) return callback(err);

        if (post && !post.author_username && post.session_id) {
          const shortSessionId = post.session_id.slice(-6);
          post.author_username = `게스트${shortSessionId}`;
        }

        callback(null, post);
      });
    }
  }

  incrementPostViews(postId, callback) {
    const query = `UPDATE shared_posts SET views = views + 1 WHERE id = ${this.pool ? '$1' : '?'}`;

    if (this.pool) {
      this.pool.query(query, [postId], callback);
    } else {
      this.db.run(query, [postId], callback);
    }
  }

  createComment(postId, userId, sessionId, username, content, callback) {
    const query = `
      INSERT INTO comments (post_id, user_id, session_id, username, content)
      VALUES (${this.pool ? '$1, $2, $3, $4, $5' : '?, ?, ?, ?, ?'})
      ${this.pool ? 'RETURNING id' : ''}
    `;

    if (this.pool) {
      this.pool.query(query, [postId, userId, sessionId, username, content], (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result.rows[0].id);
        }
      });
    } else {
      this.db.run(query, [postId, userId, sessionId, username, content], function(err) {
        callback(err, this ? this.lastID : null);
      });
    }
  }

  getPostComments(postId, callback) {
    const query = `
      SELECT c.*, u.username as user_username
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ${this.pool ? '$1' : '?'}
      ORDER BY c.created_at ASC
    `;

    if (this.pool) {
      this.pool.query(query, [postId], (err, result) => {
        callback(err, result ? result.rows : null);
      });
    } else {
      this.db.all(query, [postId], callback);
    }
  }

  toggleLike(postId, userId, sessionId, callback) {
    const checkQuery = userId
      ? `SELECT * FROM post_likes WHERE post_id = ${this.pool ? '$1' : '?'} AND user_id = ${this.pool ? '$2' : '?'}`
      : `SELECT * FROM post_likes WHERE post_id = ${this.pool ? '$1' : '?'} AND session_id = ${this.pool ? '$2' : '?'}`;
    const checkParams = userId ? [postId, userId] : [postId, sessionId];

    if (this.pool) {
      // PostgreSQL
      this.pool.query(checkQuery, checkParams, (err, result) => {
        if (err) return callback(err);

        if (result.rows.length > 0) {
          // Unlike
          const deleteQuery = userId
            ? 'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2'
            : 'DELETE FROM post_likes WHERE post_id = $1 AND session_id = $2';

          this.pool.query(deleteQuery, checkParams, (err) => {
            if (err) return callback(err);
            this.pool.query('UPDATE shared_posts SET likes = likes - 1 WHERE id = $1', [postId], callback);
          });
        } else {
          // Like
          this.pool.query(
            'INSERT INTO post_likes (post_id, user_id, session_id) VALUES ($1, $2, $3)',
            [postId, userId, sessionId],
            (err) => {
              if (err) return callback(err);
              this.pool.query('UPDATE shared_posts SET likes = likes + 1 WHERE id = $1', [postId], callback);
            }
          );
        }
      });
    } else {
      // SQLite
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
  }

  getAllUsers(callback) {
    const query = 'SELECT id, email, username, is_admin, created_at FROM users ORDER BY created_at DESC';

    if (this.pool) {
      this.pool.query(query, (err, result) => {
        callback(err, result ? result.rows : null);
      });
    } else {
      this.db.all(query, callback);
    }
  }

  deleteUser(id, callback) {
    const query = `DELETE FROM users WHERE id = ${this.pool ? '$1' : '?'}`;

    if (this.pool) {
      this.pool.query(query, [id], callback);
    } else {
      this.db.run(query, [id], callback);
    }
  }

  getAllInterpretations(callback) {
    console.log('🔄 Getting all interpretations for admin');

    if (this.pool) {
      // PostgreSQL
      this.pool.query(
        'SELECT * FROM dream_interpretations ORDER BY created_at DESC',
        [],
        (err, result) => {
          if (err) {
            console.error('❌ PostgreSQL getAllInterpretations error:', err);
            callback(err);
          } else {
            console.log('✅ PostgreSQL getAllInterpretations success:', result.rows.length);
            callback(null, result.rows);
          }
        }
      );
    } else if (this.db) {
      // SQLite
      this.db.all(
        'SELECT * FROM dream_interpretations ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) {
            console.error('❌ SQLite getAllInterpretations error:', err);
            callback(err);
          } else {
            console.log('✅ SQLite getAllInterpretations success:', rows.length);
            callback(null, rows);
          }
        }
      );
    } else {
      console.error('❌ No database connection for getAllInterpretations');
      callback(new Error('데이터베이스 연결이 없습니다.'));
    }
  }

  deleteInterpretation(id, callback) {
    console.log('🔄 Deleting interpretation:', id);

    if (this.pool) {
      // PostgreSQL
      this.pool.query(
        'DELETE FROM dream_interpretations WHERE id = $1',
        [id],
        (err, result) => {
          if (err) {
            console.error('❌ PostgreSQL deleteInterpretation error:', err);
            callback(err);
          } else {
            console.log('✅ PostgreSQL deleteInterpretation success');
            callback(null);
          }
        }
      );
    } else if (this.db) {
      // SQLite
      this.db.run(
        'DELETE FROM dream_interpretations WHERE id = ?',
        [id],
        (err) => {
          if (err) {
            console.error('❌ SQLite deleteInterpretation error:', err);
            callback(err);
          } else {
            console.log('✅ SQLite deleteInterpretation success');
            callback(null);
          }
        }
      );
    } else {
      console.error('❌ No database connection for deleteInterpretation');
      callback(new Error('데이터베이스 연결이 없습니다.'));
    }
  }

  migrateGuestData(sessionId, userId, callback) {
    console.log('🔄 Migrating guest data from session to user:', { sessionId, userId });

    if (this.pool) {
      // PostgreSQL
      this.pool.query(
        'UPDATE dream_interpretations SET user_id = $1, session_id = NULL WHERE session_id = $2',
        [userId, sessionId],
        (err, result) => {
          if (err) {
            console.error('❌ PostgreSQL migrateGuestData error:', err);
            callback(err);
          } else {
            console.log('✅ PostgreSQL migrateGuestData success:', result.rowCount);
            callback(null);
          }
        }
      );
    } else if (this.db) {
      // SQLite
      this.db.run(
        'UPDATE dream_interpretations SET user_id = ?, session_id = NULL WHERE session_id = ?',
        [userId, sessionId],
        (err) => {
          if (err) {
            console.error('❌ SQLite migrateGuestData error:', err);
            callback(err);
          } else {
            console.log('✅ SQLite migrateGuestData success');
            callback(null);
          }
        }
      );
    } else {
      console.error('❌ No database connection for migrateGuestData');
      callback(new Error('데이터베이스 연결이 없습니다.'));
    }
  }
}

module.exports = new Database();