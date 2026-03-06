import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../api';
import { format } from 'date-fns';
import './Admin.css';

const Admin = () => {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'users'
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchBookings();
      fetchUsers();
    }
  }, [isAuthenticated, user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings');
      setBookings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
      setUsersLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsersLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, {
        role: newRole
      });
      fetchUsers(); // Refresh users list

      // If updating own role, refresh user context
      if (userId === user?.id) {
        window.location.reload(); // Reload to update auth context
      } else {
        alert('Cập nhật quyền thành công!');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Có lỗi xảy ra khi cập nhật quyền');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa user này?')) {
      return;
    }
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers(); // Refresh users list
      alert('Xóa user thành công!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa user');
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, {
        status: newStatus
      });
      fetchBookings(); // Refresh list
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch đặt này?')) {
      return;
    }
    try {
      await api.delete(`/bookings/${bookingId}`);
      fetchBookings(); // Refresh list
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Có lỗi xảy ra khi xóa lịch đặt');
    }
  };

  // Allow access if authenticated - can set admin role directly on page
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If user is not admin but wants to access, allow them to set their own role
  // This allows setting admin permission directly on the page without database access

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = userSearchTerm === '' ||
      u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.phone.includes(userSearchTerm);
    return matchesSearch;
  });

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    const matchesSearch = searchTerm === '' ||
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerPhone.includes(searchTerm) ||
      booking.sport?.nameVi?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = filterDate === '' ||
      format(new Date(booking.date), 'yyyy-MM-dd') === filterDate;

    return matchesStatus && matchesSearch && matchesDate;
  });

  // Statistics
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    totalRevenue: bookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      case 'completed':
        return 'status-completed';
      default:
        return '';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Đã Xác Nhận';
      case 'pending':
        return 'Chờ Xác Nhận';
      case 'cancelled':
        return 'Đã Hủy';
      case 'completed':
        return 'Hoàn Thành';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1>Trang Quản Trị</h1>
          <p className="admin-subtitle">Quản lý lịch đặt sân và người dùng</p>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            📅 Quản Lý Đặt Sân
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Quản Lý Người Dùng
          </button>
        </div>

        {activeTab === 'bookings' && (
          <>
            {/* Statistics Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>{stats.total}</h3>
                  <p>Tổng Lịch Đặt</p>
                </div>
              </div>
              <div className="stat-card pending">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>{stats.pending}</h3>
                  <p>Chờ Xác Nhận</p>
                </div>
              </div>
              <div className="stat-card confirmed">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>{stats.confirmed}</h3>
                  <p>Đã Xác Nhận</p>
                </div>
              </div>
              <div className="stat-card completed">
                <div className="stat-icon">🎉</div>
                <div className="stat-info">
                  <h3>{stats.completed}</h3>
                  <p>Hoàn Thành</p>
                </div>
              </div>
              <div className="stat-card revenue">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <h3>{stats.totalRevenue.toLocaleString('vi-VN')}đ</h3>
                  <p>Tổng Doanh Thu</p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="admin-filters">
              <div className="filter-group">
                <label>Lọc theo trạng thái:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tất cả</option>
                  <option value="pending">Chờ Xác Nhận</option>
                  <option value="confirmed">Đã Xác Nhận</option>
                  <option value="completed">Hoàn Thành</option>
                  <option value="cancelled">Đã Hủy</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Lọc theo ngày:</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group search-group">
                <label>Tìm kiếm:</label>
                <input
                  type="text"
                  placeholder="Tên, email, SĐT, môn thể thao..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="filter-input search-input"
                />
              </div>

              <button
                onClick={() => {
                  setFilterStatus('all');
                  setSearchTerm('');
                  setFilterDate('');
                }}
                className="reset-filters-btn"
              >
                Xóa Bộ Lọc
              </button>
            </div>

            {/* Bookings Table */}
            <div className="bookings-table-container">
              <h2>Danh Sách Lịch Đặt ({filteredBookings.length})</h2>
              {filteredBookings.length === 0 ? (
                <div className="no-bookings">
                  <p>Không có lịch đặt nào.</p>
                </div>
              ) : (
                <div className="bookings-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Môn Thể Thao</th>
                        <th>Sân</th>
                        <th>Khách Hàng</th>
                        <th>Liên Hệ</th>
                        <th>Ngày & Giờ</th>
                        <th>Thời Lượng</th>
                        <th>Tổng Tiền</th>
                        <th>Trạng Thái</th>
                        <th>Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td>
                            <div className="sport-cell">
                              <span className="sport-icon-small">
                                {booking.sport?.name === 'football' ? '⚽' :
                                  booking.sport?.name === 'badminton' ? '🏸' :
                                    booking.sport?.name === 'pickleball' ? '🏓' :
                                      booking.sport?.name === 'tennis' ? '🎾' :
                                        booking.sport?.name === 'basketball' ? '🏀' :
                                          booking.sport?.name === 'volleyball' ? '🏐' : '🏃'}
                              </span>
                              <span>{booking.sport?.nameVi || booking.sport?.name}</span>
                            </div>
                          </td>
                          <td>{booking.facilityName}</td>
                          <td>
                            <div className="customer-cell">
                              <strong>{booking.customerName}</strong>
                              {booking.notes && (
                                <span className="notes-badge" title={booking.notes}>📝</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="contact-cell">
                              <div>{booking.customerPhone}</div>
                              <div className="email-text">{booking.customerEmail}</div>
                            </div>
                          </td>
                          <td>
                            <div className="datetime-cell">
                              <div>{format(new Date(booking.date), 'dd/MM/yyyy')}</div>
                              <div className="time-text">{booking.startTime} - {booking.endTime}</div>
                            </div>
                          </td>
                          <td>{booking.duration} giờ</td>
                          <td className="price-cell">{booking.totalPrice?.toLocaleString('vi-VN')}đ</td>
                          <td>
                            <select
                              value={booking.status}
                              onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                              className={`status-select ${getStatusColor(booking.status)}`}
                            >
                              <option value="pending">Chờ Xác Nhận</option>
                              <option value="confirmed">Đã Xác Nhận</option>
                              <option value="completed">Hoàn Thành</option>
                              <option value="cancelled">Đã Hủy</option>
                            </select>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => deleteBooking(booking.id)}
                                className="delete-btn"
                                title="Xóa"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="users-management">
            <div className="users-header">
              <h2>Quản Lý Người Dùng ({filteredUsers.length})</h2>
              <div className="user-search">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, email, SĐT..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="user-search-input"
                />
              </div>
            </div>

            {usersLoading ? (
              <div className="loading">Đang tải...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="no-users">
                <p>Không có user nào.</p>
              </div>
            ) : (
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th>Email</th>
                      <th>Số Điện Thoại</th>
                      <th>Quyền</th>
                      <th>Ngày Đăng Ký</th>
                      <th>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.name}</strong>
                          {u.id === user?.id && (
                            <span className="current-user-badge"> (Bạn)</span>
                          )}
                        </td>
                        <td>{u.email}</td>
                        <td>{u.phone}</td>
                        <td>
                          <select
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                            className={`role-select ${u.role === 'admin' ? 'admin-role' : 'user-role'}`}
                            disabled={u.id === user?.id}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>{format(new Date(u.createdAt), 'dd/MM/yyyy')}</td>
                        <td>
                          {u.id !== user?.id && (
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="delete-user-btn"
                              title="Xóa user"
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

