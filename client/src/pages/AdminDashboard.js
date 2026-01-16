import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Booking management state
  const [bookings, setBookings] = useState([]);
  const [sports, setSports] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    sportId: ''
  });

  // User management state
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    regularUsers: 0
  });

  // Facility management state
  const [facilities, setFacilities] = useState([]);
  const [facilityStats, setFacilityStats] = useState({
    totalFacilities: 0,
    activeFacilities: 0,
    inactiveFacilities: 0
  });
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [facilityForm, setFacilityForm] = useState({
    name: '',
    sportId: '',
    phone: '',
    address: '',
    image: '',
    description: '',
    pricePerHour: '',
    status: 'active'
  });

  // UI state
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    if (activeTab === 'bookings') {
      fetchBookingData();
    } else if (activeTab === 'users') {
      fetchUserData();
    } else if (activeTab === 'facilities') {
      fetchFacilityData();
    }
  }, [isAuthenticated, user, filters, activeTab]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, sportsRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/bookings', {
          params: filters
        }),
        axios.get('http://localhost:5000/api/admin/sports'),
        axios.get('http://localhost:5000/api/admin/stats')
      ]);

      setBookings(bookingsRes.data);
      setSports(sportsRes.data);
      setStats(statsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching booking data:', error);
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(response.data);

      // Calculate user statistics
      const totalUsers = response.data.length;
      const adminUsers = response.data.filter(u => u.role === 'admin').length;
      const regularUsers = totalUsers - adminUsers;

      setUserStats({ totalUsers, adminUsers, regularUsers });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const fetchFacilityData = async () => {
    try {
      setLoading(true);
      const [facilitiesRes, sportsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/facilities'),
        axios.get('http://localhost:5000/api/sports')
      ]);

      setFacilities(facilitiesRes.data);
      setSports(sportsRes.data);

      // Calculate facility statistics
      const totalFacilities = facilitiesRes.data.length;
      const activeFacilities = facilitiesRes.data.filter(f => f.status === 'active').length;
      const inactiveFacilities = totalFacilities - activeFacilities;

      setFacilityStats({ totalFacilities, activeFacilities, inactiveFacilities });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching facility data:', error);
      setLoading(false);
    }
  };

  const handleAddFacility = () => {
    setEditingFacility(null);
    setFacilityForm({
      name: '',
      sportId: '',
      phone: '',
      address: '',
      image: '',
      description: '',
      pricePerHour: '',
      status: 'active'
    });
    setShowFacilityModal(true);
  };

  const handleEditFacility = (facility) => {
    setEditingFacility(facility);
    setFacilityForm({
      name: facility.name,
      sportId: facility.sportId?._id || facility.sportId || '',
      phone: facility.phone,
      address: facility.address,
      image: facility.image || '',
      description: facility.description || '',
      pricePerHour: facility.pricePerHour,
      status: facility.status
    });
    setShowFacilityModal(true);
  };

  const handleSaveFacility = async () => {
    try {
      if (!facilityForm.name || !facilityForm.sportId || !facilityForm.phone || !facilityForm.address || !facilityForm.pricePerHour) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      // Convert pricePerHour to number
      const facilityData = {
        ...facilityForm,
        pricePerHour: Number(facilityForm.pricePerHour)
      };

      if (editingFacility) {
        // Update existing facility
        await axios.put(`http://localhost:5000/api/facilities/${editingFacility._id}`, facilityData);
      } else {
        // Create new facility
        await axios.post('http://localhost:5000/api/facilities', facilityData);
      }

      setShowFacilityModal(false);
      fetchFacilityData();
    } catch (error) {
      console.error('Error saving facility:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Có lỗi khi lưu sân bãi';
      alert(errorMessage);
    }
  };

  const handleDeleteFacility = async (facilityId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sân bãi này?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/facilities/${facilityId}`);
      fetchFacilityData();
    } catch (error) {
      alert('Có lỗi khi xóa sân bãi');
      console.error('Error deleting facility:', error);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/bookings/${bookingId}/status`, {
        status: newStatus
      });
      fetchBookingData();
    } catch (error) {
      alert('Có lỗi khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch đặt này?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/admin/bookings/${bookingId}`);
      fetchBookingData();
    } catch (error) {
      alert('Có lỗi khi xóa lịch đặt');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUserData();
    } catch (error) {
      alert('Có lỗi khi thay đổi vai trò người dùng');
    }
  };

  const handleDeleteUser = async (userId) => {
    // Prevent deleting yourself
    if (userId === user._id) {
      alert('Không thể xóa chính mình!');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUserData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi khi xóa người dùng');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Xin chào, <span className="font-semibold text-blue-600">{user?.name}</span></p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6 p-1 flex gap-2">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'bookings'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            📅 Quản Lý Đặt Sân
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'facilities'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            🏟️ Quản Lý Sân
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'users'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            👥 Quản Lý Người Dùng
          </button>
        </div>

        {/* Booking Management Tab */}
        {activeTab === 'bookings' && (
          <>
            {/* Statistics */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Tổng Đặt Lịch</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Chờ Xác Nhận</h3>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pendingBookings}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Đã Xác Nhận</h3>
                  <p className="text-3xl font-bold text-green-600">{stats.confirmedBookings}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Hoàn Thành</h3>
                  <p className="text-3xl font-bold text-indigo-600">{stats.completedBookings}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Tổng Doanh Thu</h3>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalRevenue.toLocaleString('vi-VN')}đ</p>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái:</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tất cả</option>
                    <option value="pending">Chờ Xác Nhận</option>
                    <option value="confirmed">Đã Xác Nhận</option>
                    <option value="completed">Hoàn Thành</option>
                    <option value="cancelled">Đã Hủy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày:</label>
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Môn thể thao:</label>
                  <select
                    value={filters.sportId}
                    onChange={(e) => setFilters({ ...filters, sportId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tất cả</option>
                    {sports.map((sport) => (
                      <option key={sport._id} value={sport._id}>
                        {sport.nameVi || sport.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ status: '', date: format(new Date(), 'yyyy-MM-dd'), sportId: '' })}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
                  >
                    Xóa Bộ Lọc
                  </button>
                </div>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Danh Sách Đặt Lịch ({bookings.length})</h2>
              </div>

              {bookings.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500 text-lg">Không có lịch đặt nào.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Môn Thể Thao</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sân</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Khách Hàng</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ngày</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thời Gian</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tổng Tiền</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng Thái</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {bookings.map((booking) => (
                        <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {booking.sportId?.nameVi || booking.sportId?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {booking.facilityName}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="font-medium text-gray-900">{booking.customerName}</div>
                            <div className="text-gray-500 text-xs">{booking.customerPhone} | {booking.customerEmail}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {format(new Date(booking.date), 'dd/MM/yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {booking.startTime} - {booking.endTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {booking.totalPrice?.toLocaleString('vi-VN')}đ
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                              {getStatusText(booking.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              {booking.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusChange(booking._id, 'confirmed')}
                                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                                  >
                                    Xác Nhận
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(booking._id, 'cancelled')}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                                  >
                                    Hủy
                                  </button>
                                </>
                              )}
                              {booking.status === 'confirmed' && (
                                <button
                                  onClick={() => handleStatusChange(booking._id, 'completed')}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                                >
                                  Hoàn Thành
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(booking._id)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                              >
                                Xóa
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

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <>
            {/* User Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Tổng Người Dùng</h3>
                <p className="text-3xl font-bold text-gray-900">{userStats.totalUsers}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Quản Trị Viên</h3>
                <p className="text-3xl font-bold text-purple-600">{userStats.adminUsers}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Người Dùng Thường</h3>
                <p className="text-3xl font-bold text-green-600">{userStats.regularUsers}</p>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Danh Sách Người Dùng ({users.length})</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Số Điện Thoại</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vai Trò</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ngày Đăng Ký</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{u.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {u.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {u.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                            }`}>
                            {u.role === 'admin' ? 'Quản Trị Viên' : 'Người Dùng'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {format(new Date(u.createdAt), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRoleChange(u._id, u.role === 'admin' ? 'user' : 'admin')}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${u.role === 'admin'
                                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                : 'bg-purple-500 hover:bg-purple-600 text-white'
                                }`}
                            >
                              {u.role === 'admin' ? 'Đổi thành User' : 'Đổi thành Admin'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              disabled={u._id === user._id}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${u._id === user._id
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Facility Management Tab */}
        {activeTab === 'facilities' && (
          <>
            {/* Facility Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Tổng Số Sân</h3>
                <p className="text-3xl font-bold text-gray-900">{facilityStats.totalFacilities}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Sân Hoạt Động</h3>
                <p className="text-3xl font-bold text-green-600">{facilityStats.activeFacilities}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Sân Ngừng Hoạt Động</h3>
                <p className="text-3xl font-bold text-red-600">{facilityStats.inactiveFacilities}</p>
              </div>
            </div>

            {/* Facilities Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Danh Sách Sân ({facilities.length})</h2>
                <button
                  onClick={handleAddFacility}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md flex items-center gap-2"
                >
                  <span>+</span>
                  <span>Thêm Sân Mới</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên Sân</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Môn Thể Thao</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Số Điện Thoại</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Địa Chỉ</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Giá/Giờ</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng Thái</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {facilities.map((facility) => (
                      <tr key={facility._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {facility.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="flex items-center gap-2">
                            <span>{facility.sportId?.emoji || '⚽'}</span>
                            <span>{facility.sportId?.nameVi || facility.sportId?.name}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {facility.phone}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {facility.address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {facility.pricePerHour?.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${facility.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {facility.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditFacility(facility)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteFacility(facility._id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Facility Modal */}
            {showFacilityModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">
                      {editingFacility ? 'Chỉnh Sửa Sân' : 'Thêm Sân Mới'}
                    </h3>
                    <button
                      onClick={() => setShowFacilityModal(false)}
                      className="text-white hover:text-gray-200 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tên Sân <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={facilityForm.name}
                        onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập tên sân"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Môn Thể Thao <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={facilityForm.sportId}
                        onChange={(e) => setFacilityForm({ ...facilityForm, sportId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Chọn môn thể thao</option>
                        {sports.map((sport) => (
                          <option key={sport._id} value={sport._id}>
                            {sport.emoji} {sport.nameVi || sport.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Số Điện Thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={facilityForm.phone}
                          onChange={(e) => setFacilityForm({ ...facilityForm, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0123456789"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Giá/Giờ (VNĐ) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={facilityForm.pricePerHour}
                          onChange={(e) => setFacilityForm({ ...facilityForm, pricePerHour: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="100000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Địa Chỉ <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={facilityForm.address}
                        onChange={(e) => setFacilityForm({ ...facilityForm, address: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="2"
                        placeholder="Nhập địa chỉ đầy đủ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        URL Hình Ảnh
                      </label>
                      <input
                        type="text"
                        value={facilityForm.image}
                        onChange={(e) => setFacilityForm({ ...facilityForm, image: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Mô Tả
                      </label>
                      <textarea
                        value={facilityForm.description}
                        onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                        placeholder="Mô tả về sân..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Trạng Thái
                      </label>
                      <select
                        value={facilityForm.status}
                        onChange={(e) => setFacilityForm({ ...facilityForm, status: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Ngừng hoạt động</option>
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSaveFacility}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition-all duration-300"
                      >
                        {editingFacility ? 'Cập Nhật' : 'Thêm Sân'}
                      </button>
                      <button
                        onClick={() => setShowFacilityModal(false)}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-all duration-300"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
