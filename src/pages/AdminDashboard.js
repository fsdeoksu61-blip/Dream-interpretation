import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../utils/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [interpretations, setInterpretations] = useState([]);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.is_admin && token) {
      loadDashboardData();
    }
  }, [user, token]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [statsRes, usersRes, interpretationsRes, activityRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getInterpretations(),
        adminAPI.getActivity()
      ]);

      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setInterpretations(interpretationsRes.data.interpretations);
      setActivity(activityRes.data);
    } catch (err) {
      console.error('Admin data load error:', err);
      setError('관리자 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('정말 이 사용자를 삭제하시겠습니까?')) return;

    try {
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      alert('사용자가 삭제되었습니다.');
    } catch (err) {
      console.error('User delete error:', err);
      alert('사용자 삭제 중 오류가 발생했습니다.');
    }
  };

  const deleteInterpretation = async (interpretationId) => {
    if (!window.confirm('정말 이 해석을 삭제하시겠습니까?')) return;

    try {
      await adminAPI.deleteInterpretation(interpretationId);
      setInterpretations(interpretations.filter(i => i.id !== interpretationId));
      alert('해석이 삭제되었습니다.');
    } catch (err) {
      console.error('Interpretation delete error:', err);
      alert('해석 삭제 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  if (!user || !user.is_admin) {
    return (
      <div className="admin-error">
        <h1>접근 권한 없음</h1>
        <p>관리자만 접근할 수 있는 페이지입니다.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>관리자 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h1>오류 발생</h1>
        <p>{error}</p>
        <button onClick={loadDashboardData} className="retry-button">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>관리자 대시보드</h1>
        <p>환영합니다, {user.username}님</p>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          대시보드
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          사용자 관리
        </button>
        <button
          className={activeTab === 'interpretations' ? 'active' : ''}
          onClick={() => setActiveTab('interpretations')}
        >
          해석 관리
        </button>
        <button
          className={activeTab === 'activity' ? 'active' : ''}
          onClick={() => setActiveTab('activity')}
        >
          최근 활동
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-tab">
            <h2>시스템 통계</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>총 사용자</h3>
                <div className="stat-number">{stats?.totalUsers || 0}</div>
              </div>
              <div className="stat-card">
                <h3>총 해석</h3>
                <div className="stat-number">{stats?.totalInterpretations || 0}</div>
              </div>
              <div className="stat-card">
                <h3>공유된 해석</h3>
                <div className="stat-number">{stats?.sharedInterpretations || 0}</div>
              </div>
              <div className="stat-card">
                <h3>총 조회수</h3>
                <div className="stat-number">{stats?.totalViews || 0}</div>
              </div>
              <div className="stat-card">
                <h3>총 좋아요</h3>
                <div className="stat-number">{stats?.totalLikes || 0}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-tab">
            <h2>사용자 관리 ({users.length}명)</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>이메일</th>
                    <th>사용자명</th>
                    <th>관리자</th>
                    <th>가입일</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.email}</td>
                      <td>{user.username}</td>
                      <td>{user.is_admin ? '✓' : '✗'}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="delete-button"
                          disabled={user.is_admin}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'interpretations' && (
          <div className="interpretations-tab">
            <h2>해석 관리 ({interpretations.length}개)</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>사용자 ID</th>
                    <th>꿈 내용 (요약)</th>
                    <th>공유됨</th>
                    <th>생성일</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {interpretations.map(interpretation => (
                    <tr key={interpretation.id}>
                      <td>{interpretation.id}</td>
                      <td>{interpretation.user_id || 'Guest'}</td>
                      <td>
                        <div className="dream-content-preview">
                          {interpretation.dream_content?.substring(0, 50)}...
                        </div>
                      </td>
                      <td>{interpretation.is_shared ? '✓' : '✗'}</td>
                      <td>{formatDate(interpretation.created_at)}</td>
                      <td>
                        <button
                          onClick={() => deleteInterpretation(interpretation.id)}
                          className="delete-button"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-tab">
            <h2>최근 활동</h2>

            <div className="activity-section">
              <h3>최근 해석 ({activity?.recentInterpretations?.length || 0}개)</h3>
              <div className="activity-list">
                {activity?.recentInterpretations?.map(interpretation => (
                  <div key={interpretation.id} className="activity-item">
                    <div className="activity-info">
                      <strong>사용자 ID: {interpretation.user_id || 'Guest'}</strong>
                      <p>{interpretation.dream_content?.substring(0, 100)}...</p>
                      <small>{formatDate(interpretation.created_at)}</small>
                    </div>
                  </div>
                )) || <p>최근 해석이 없습니다.</p>}
              </div>
            </div>

            <div className="activity-section">
              <h3>최근 공유 게시물 ({activity?.recentPosts?.length || 0}개)</h3>
              <div className="activity-list">
                {activity?.recentPosts?.map(post => (
                  <div key={post.id} className="activity-item">
                    <div className="activity-info">
                      <strong>{post.title}</strong>
                      <p>조회수: {post.views} | 좋아요: {post.likes}</p>
                      <small>{formatDate(post.created_at)}</small>
                    </div>
                  </div>
                )) || <p>최근 공유 게시물이 없습니다.</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="admin-footer">
        <button onClick={loadDashboardData} className="refresh-button">
          데이터 새로고침
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;