import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OwnerRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== 'owner' || user?.ownerStatus !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Truy cập bị từ chối</h2>
          <p className="text-gray-500 mb-4">
            {user?.role === 'owner' && user?.ownerStatus === 'pending'
              ? 'Tài khoản chủ sân của bạn đang chờ admin duyệt.'
              : user?.role === 'owner' && user?.ownerStatus === 'rejected'
                ? 'Tài khoản chủ sân của bạn đã bị từ chối.'
                : 'Bạn cần đăng ký tài khoản chủ sân để truy cập trang này.'}
          </p>
          <a href="/" className="text-blue-600 hover:underline font-medium">← Về trang chủ</a>
        </div>
      </div>
    );
  }

  return children;
};

export default OwnerRoute;
