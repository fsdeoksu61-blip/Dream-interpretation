const express = require('express');
const db = require('../models/database');
const { authenticateOptional, getSessionId } = require('../middleware/auth');

const router = express.Router();

// Get all community posts with search and sorting
router.get('/', (req, res) => {
  const { search, sortBy, page, limit } = req.query;
  
  const options = {
    search: search ? decodeURIComponent(search) : undefined,
    sortBy: sortBy || 'latest',
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20
  };

  db.getCommunityPosts(options, (err, posts) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '게시물을 불러오는 중 오류가 발생했습니다.' });
    }

    // 전체 일반글 개수 조회 (공지글 제외)
    db.getCommunityPostCount(false, (countErr, totalNormalPosts) => {
      if (countErr) {
        console.error('Database error getting count:', countErr);
        totalNormalPosts = 0;
      }

      // 각 글에 display_number 추가
      const postsWithNumbers = posts.map((post, index) => {
        let displayNumber;
        if (post.is_announcement) {
          displayNumber = post.id;
        } else {
          // 전체 일반글 중에서의 순번 계산
          const normalPostsBeforeThis = posts.slice(0, index).filter(p => !p.is_announcement).length;
          displayNumber = totalNormalPosts - normalPostsBeforeThis - (options.page - 1) * options.limit;
        }
        
        return {
          ...post,
          display_number: displayNumber
        };
      });

      // HTTP 응답 전송 전 최종 확인
      console.log('📤 HTTP 응답으로 전송하는 데이터 (첫 번째 게시물):');
      if (postsWithNumbers && postsWithNumbers.length > 0) {
        const firstPost = postsWithNumbers[0];
        console.log('   제목 (JSON.stringify):', JSON.stringify(firstPost.title));
        console.log('   제목 (직접):', firstPost.title);
        console.log('   제목 길이:', firstPost.title ? firstPost.title.length : 0);
      }
      
      res.json({ 
        posts: postsWithNumbers, 
        pagination: { 
          page: options.page, 
          limit: options.limit,
          totalNormalPosts 
        } 
      });
    });
  });
});

// Get specific community post
router.get('/:id', authenticateOptional, getSessionId, (req, res) => {
  const postId = req.params.id;

  db.getCommunityPostById(postId, (err, post) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '게시물을 불러오는 중 오류가 발생했습니다.' });
    }

    if (!post) {
      return res.status(404).json({ error: '게시물을 찾을 수 없습니다.' });
    }

    console.log('📖 Retrieved community post:', {
      id: post.id,
      title: `"${post.title}"`,
      content: `"${post.content}"`,
      username: post.username
    });

    // Increment views
    db.incrementCommunityPostViews(postId, (err) => {
      if (err) {
        console.error('Error incrementing views:', err);
      }
    });

    // Get comments
    db.getCommunityPostComments(postId, (err, comments) => {
      if (err) {
        console.error('Error getting comments:', err);
        comments = [];
      }

      res.json({ 
        post: {
          ...post,
          views: post.views + 1
        },
        comments 
      });
    });
  });
});

// Create new community post
router.post('/', authenticateOptional, getSessionId, (req, res) => {
  const { title, content, username, isAnnouncement } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: '제목을 입력해주세요.' });
  }

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: '내용을 입력해주세요.' });
  }

  if (title.length > 100) {
    return res.status(400).json({ error: '제목은 100자 이내로 작성해주세요.' });
  }

  if (content.length > 2000) {
    return res.status(400).json({ error: '내용은 2000자 이내로 작성해주세요.' });
  }

  const userId = req.user ? req.user.id : null;
  const sessionId = req.user ? null : req.sessionId;
  const displayName = req.user ? req.user.username : (username || '익명');

  // Only admin users can create announcements
  const canCreateAnnouncement = req.user && req.user.is_admin;
  const finalIsAnnouncement = isAnnouncement && canCreateAnnouncement;

  console.log('📝 Creating community post with data:', {
    userId,
    sessionId,
    displayName,
    title: `"${title}"`,
    content: `"${content}"`,
    finalIsAnnouncement
  });

  db.createCommunityPost(userId, sessionId, displayName, title, content, finalIsAnnouncement, (err, postId) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '게시물 작성 중 오류가 발생했습니다.' });
    }

    console.log('✅ Community post created successfully with ID:', postId);

    res.status(201).json({
      message: '게시물이 작성되었습니다.',
      postId
    });
  });
});

// Add comment to community post
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

  db.createCommunityComment(postId, userId, sessionId, displayName, content, (err, commentId) => {
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

// Toggle like on community post
router.post('/:id/like', authenticateOptional, getSessionId, (req, res) => {
  const postId = req.params.id;
  const userId = req.user ? req.user.id : null;
  const sessionId = req.user ? null : req.sessionId;

  db.toggleCommunityLike(postId, userId, sessionId, (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '좋아요 처리 중 오류가 발생했습니다.' });
    }

    res.json({ message: '좋아요가 처리되었습니다.' });
  });
});

// Update community post
router.put('/:id', authenticateOptional, getSessionId, (req, res) => {
  const postId = req.params.id;
  const { title, content, isAnnouncement } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: '제목을 입력해주세요.' });
  }

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: '내용을 입력해주세요.' });
  }

  // First check if post exists and verify ownership
  db.getCommunityPostById(postId, (err, post) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '게시물을 불러오는 중 오류가 발생했습니다.' });
    }

    if (!post) {
      return res.status(404).json({ error: '게시물을 찾을 수 없습니다.' });
    }

    // Check ownership
    const userId = req.user ? req.user.id : null;
    const sessionId = req.user ? null : req.sessionId;

    if ((userId && post.user_id !== userId) || (sessionId && post.session_id !== sessionId)) {
      return res.status(403).json({ error: '수정 권한이 없습니다.' });
    }

    // Only admin users can modify announcement status
    const canModifyAnnouncement = req.user && req.user.is_admin;
    const finalIsAnnouncement = isAnnouncement !== undefined && canModifyAnnouncement ? isAnnouncement : post.is_announcement;

    console.log('📝 Updating community post:', {
      postId,
      title,
      content,
      isAnnouncement,
      canModifyAnnouncement,
      finalIsAnnouncement,
      originalAnnouncement: post.is_announcement
    });

    db.updateCommunityPost(postId, title, content, finalIsAnnouncement, (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: '게시물 수정 중 오류가 발생했습니다.' });
      }

      console.log('✅ Community post updated successfully');
      res.json({ message: '게시물이 수정되었습니다.' });
    });
  });
});

// Delete community post
router.delete('/:id', authenticateOptional, getSessionId, (req, res) => {
  const postId = req.params.id;

  // First check if post exists and verify ownership
  db.getCommunityPostById(postId, (err, post) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '게시물을 불러오는 중 오류가 발생했습니다.' });
    }

    if (!post) {
      return res.status(404).json({ error: '게시물을 찾을 수 없습니다.' });
    }

    // Check ownership
    const userId = req.user ? req.user.id : null;
    const sessionId = req.user ? null : req.sessionId;

    if ((userId && post.user_id !== userId) || (sessionId && post.session_id !== sessionId)) {
      return res.status(403).json({ error: '삭제 권한이 없습니다.' });
    }

    db.deleteCommunityPost(postId, (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: '게시물 삭제 중 오류가 발생했습니다.' });
      }

      res.json({ message: '게시물이 삭제되었습니다.' });
    });
  });
});

// Get community post comments
router.get('/:id/comments', (req, res) => {
  const postId = req.params.id;

  db.getCommunityPostComments(postId, (err, comments) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: '댓글을 불러오는 중 오류가 발생했습니다.' });
    }

    res.json({ comments });
  });
});

module.exports = router;