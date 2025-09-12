import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();

  if (!user || !user.is_admin) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>접근 권한 없음</h1>
        <p>관리자만 접근할 수 있는 페이지입니다.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>관리자 대시보드</h1>
      <p>관리자 기능들이 여기에 구현될 예정입니다.</p>
      <div style={{ marginTop: '30px' }}>
        <p>현재 로그인된 관리자: {user.username}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;