import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
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
    status: 'active',
    pricingSchedule: []
  });

  // UI state
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(true);
  const [facilityFilter, setFacilityFilter] = useState({ sportId: '', status: '' });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
        api.get('/admin/bookings', {
          params: filters
        }),
        api.get('/admin/sports'),
        api.get('/admin/stats')
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
      const response = await api.get('/users');

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
        api.get('/facilities'),
        api.get('/sports')
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
      sportId: facility.sport?.id || facility.sportId || '',
      phone: facility.phone,
      address: facility.address,
      image: facility.image || '',
      description: facility.description || '',
      pricePerHour: facility.pricePerHour,
      status: facility.status,
      pricingSchedule: facility.pricingSchedule || []
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
        await api.put(`/facilities/${editingFacility.id}`, facilityData);
      } else {
        // Create new facility
        await api.post('/facilities', facilityData);
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
      await api.delete(`/facilities/${facilityId}`);
      fetchFacilityData();
    } catch (error) {
      alert('Có lỗi khi xóa sân bãi');
      console.error('Error deleting facility:', error);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await api.put(`/admin/bookings/${bookingId}/status`, {
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
      await api.delete(`/admin/bookings/${bookingId}`);
      fetchBookingData();
    } catch (error) {
      alert('Có lỗi khi xóa lịch đặt');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(
        `/users/${userId}/role`,
        { role: newRole }
      );
      fetchUserData();
    } catch (error) {
      alert('Có lỗi khi thay đổi vai trò người dùng');
    }
  };

  const handleDeleteUser = async (userId) => {
    // Prevent deleting yourself
    if (userId === user.id) {
      alert('Không thể xóa chính mình!');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
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

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFacilityForm(prev => ({ ...prev, image: res.data.url }));
    } catch (err) {
      alert('Upload ảnh thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Xin chào, <span className="font-semibold text-blue-600">{user?.name}</span></p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6 p-1 flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 text-sm ${activeTab === 'bookings'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            📅 Quản Lý Đặt Sân
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 text-sm ${activeTab === 'facilities'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            🏟️ Quản Lý Sân
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 text-sm ${activeTab === 'users'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            👥 Quản Lý Người Dùng
          </button>
          <button
            onClick={() => navigate('/statistics')}
            className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 text-sm text-gray-600 hover:bg-gray-100 border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:text-indigo-600"
          >
            📊 Thống Kê & Báo Cáo
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
                      <option key={sport.id} value={sport.id}>
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
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ghi Chú</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng Thái</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {booking.sport?.nameVi || booking.sport?.name}
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
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-[160px]">
                            {booking.notes ? (
                              <span className="italic text-gray-600 line-clamp-2" title={booking.notes}>{booking.notes}</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                              {getStatusText(booking.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedBooking(booking)}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                              >
                                Chi tiết
                              </button>
                              {booking.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                                  >
                                    Xác Nhận
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(booking.id, 'cancelled')}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                                  >
                                    Hủy
                                  </button>
                                </>
                              )}
                              {booking.status === 'confirmed' && (
                                <button
                                  onClick={() => handleStatusChange(booking.id, 'completed')}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                                >
                                  Hoàn Thành
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(booking.id)}
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

            {/* Booking Detail Modal */}
            {selectedBooking && (
              <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedBooking(null)}
              >
                <div
                  className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                    <div>
                      <h3 className="text-white font-bold text-lg">Chi Tiết Lịch Đặt</h3>
                      <p className="text-indigo-200 text-sm">#{String(selectedBooking.id).padStart(4, '0')}</p>
                    </div>
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="text-white hover:text-indigo-200 transition-colors text-2xl leading-none"
                    >×</button>
                  </div>

                  {/* Status badge */}
                  <div className="px-6 pt-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedBooking.status)}`}>
                      {getStatusText(selectedBooking.status)}
                    </span>
                  </div>

                  {/* Detail rows */}
                  <div className="px-6 py-4 space-y-3">
                    {[
                      { icon: '⚽', label: 'Môn thể thao', value: selectedBooking.sport?.nameVi || selectedBooking.sport?.name },
                      { icon: '🏟️', label: 'Sân', value: selectedBooking.facilityName },
                      { icon: '📍', label: 'Địa chỉ', value: selectedBooking.facilityAddress },
                      { icon: '📞', label: 'SĐT sân', value: selectedBooking.facilityPhone },
                    ].map((row, i) => row.value ? (
                      <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                        <span className="w-7 flex-shrink-0 text-base">{row.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 font-medium">{row.label}</p>
                          <p className="text-gray-800 font-semibold text-sm break-words">{row.value}</p>
                        </div>
                      </div>
                    ) : null)}

                    <div className="bg-blue-50 rounded-xl p-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-400 font-medium">📅 Ngày</p>
                        <p className="text-gray-800 font-bold">{selectedBooking.date ? new Date(selectedBooking.date).toLocaleDateString('vi-VN') : '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">⏰ Giờ</p>
                        <p className="text-gray-800 font-bold">{(selectedBooking.startTime || '').substring(0, 5)} – {(selectedBooking.endTime || '').substring(0, 5)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">⏱️ Thời lượng</p>
                        <p className="text-gray-800 font-bold">{selectedBooking.duration ? `${selectedBooking.duration}h` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">💰 Tổng tiền</p>
                        <p className="text-blue-700 font-bold">{Number(selectedBooking.totalPrice || 0).toLocaleString('vi-VN')}đ</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Thông tin khách hàng</p>
                      <div className="flex items-center gap-2">
                        <span className="text-base">👤</span>
                        <span className="text-gray-800 font-semibold">{selectedBooking.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">📱</span>
                        <a href={`tel:${selectedBooking.customerPhone}`} className="text-blue-600 hover:underline">{selectedBooking.customerPhone}</a>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">✉️</span>
                        <a href={`mailto:${selectedBooking.customerEmail}`} className="text-blue-600 hover:underline text-sm">{selectedBooking.customerEmail}</a>
                      </div>
                    </div>

                    {selectedBooking.notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-xs text-amber-600 font-semibold mb-1">📝 Ghi chú</p>
                        <p className="text-gray-700 text-sm">{selectedBooking.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Modal Actions */}
                  <div className="px-6 pb-5 flex gap-2 flex-wrap">
                    {selectedBooking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => { handleStatusChange(selectedBooking.id, 'confirmed'); setSelectedBooking(null); }}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
                        >✅ Xác Nhận</button>
                        <button
                          onClick={() => { handleStatusChange(selectedBooking.id, 'cancelled'); setSelectedBooking(null); }}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
                        >❌ Hủy</button>
                      </>
                    )}
                    {selectedBooking.status === 'confirmed' && (
                      <button
                        onClick={() => { handleStatusChange(selectedBooking.id, 'completed'); setSelectedBooking(null); }}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
                      >🏁 Hoàn Thành</button>
                    )}
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-sm font-semibold transition-colors"
                    >Đóng</button>
                  </div>
                </div>
              </div>
            )}
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
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
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
                              onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'user' : 'admin')}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${u.role === 'admin'
                                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                : 'bg-purple-500 hover:bg-purple-600 text-white'
                                }`}
                            >
                              {u.role === 'admin' ? 'Đổi thành User' : 'Đổi thành Admin'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={u.id === user.id}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${u.id === user.id
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
              <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <h2 className="text-xl font-bold text-gray-900">Danh Sách Sân ({facilities.filter(f => {
                  if (facilityFilter.sportId && String(f.sport?.id || f.sportId) !== facilityFilter.sportId) return false;
                  if (facilityFilter.status && f.status !== facilityFilter.status) return false;
                  return true;
                }).length})</h2>
                <div className="flex items-center gap-3">
                  <select
                    value={facilityFilter.sportId}
                    onChange={(e) => setFacilityFilter(prev => ({ ...prev, sportId: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tất cả môn</option>
                    {sports.map(s => (
                      <option key={s.id} value={s.id}>{s.nameVi || s.name}</option>
                    ))}
                  </select>
                  <select
                    value={facilityFilter.status}
                    onChange={(e) => setFacilityFilter(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Ngừng hoạt động</option>
                  </select>
                  <button
                    onClick={handleAddFacility}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md flex items-center gap-2 whitespace-nowrap"
                  >
                    <span>+</span>
                    <span>Thêm Sân Mới</span>
                  </button>
                </div>
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
                    {facilities.filter(f => {
                      if (facilityFilter.sportId && String(f.sport?.id || f.sportId) !== facilityFilter.sportId) return false;
                      if (facilityFilter.status && f.status !== facilityFilter.status) return false;
                      return true;
                    }).map((facility) => (
                      <tr key={facility.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {facility.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="flex items-center gap-2">
                            <span>{facility.sport?.emoji || '⚽'}</span>
                            <span>{facility.sport?.nameVi || facility.sport?.name}</span>
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
                              onClick={() => handleDeleteFacility(facility.id)}
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
                          <option key={sport.id} value={sport.id}>
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
                        Hình Ảnh Sân
                      </label>

                      {/* Preview */}
                      {facilityForm.image && (
                        <div className="relative mb-3 rounded-xl overflow-hidden border border-gray-200 w-full h-40">
                          <img
                            src={facilityForm.image}
                            alt="preview"
                            className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                          <button
                            type="button"
                            onClick={() => setFacilityForm(prev => ({ ...prev, image: '' }))}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-lg"
                            title="Xóa ảnh"
                          >×</button>
                        </div>
                      )}

                      {/* Upload button */}
                      <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploadingImage ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                        }`}>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingImage}
                          onChange={e => handleImageUpload(e.target.files[0])}
                        />
                        {uploadingImage ? (
                          <>
                            <svg className="animate-spin w-8 h-8 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span className="text-blue-600 text-sm font-medium">Đang tải lên...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-gray-500 text-sm font-medium">
                              {facilityForm.image ? 'Click để đổi ảnh' : 'Click để tải ảnh lên'}
                            </span>
                            <span className="text-gray-400 text-xs mt-1">JPG, PNG, WEBP — tối đa 5MB</span>
                          </>
                        )}
                      </label>
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

                    {/* Pricing Schedule */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          💰 Bảng Giá Theo Khung Giờ
                        </label>
                        <button
                          type="button"
                          onClick={() => setFacilityForm(prev => ({
                            ...prev,
                            pricingSchedule: [...(prev.pricingSchedule || []), { startTime: '06:00', endTime: '12:00', price: '' }]
                          }))}
                          className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-lg font-medium border border-blue-200 transition-colors"
                        >+ Thêm khung giờ</button>
                      </div>

                      {(facilityForm.pricingSchedule || []).length === 0 ? (
                        <p className="text-gray-400 text-xs italic py-2">Chưa có khung giờ nào. Nếu không thêm, giá mặc định = Giá/Giờ ở trên.</p>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs text-gray-500 font-semibold px-1">
                            <span>Từ giờ</span><span>Đến giờ</span><span>Giá (đ/giờ)</span><span></span>
                          </div>
                          {(facilityForm.pricingSchedule || []).map((tier, idx) => (
                            <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                              <input
                                type="time"
                                value={tier.startTime}
                                onChange={e => {
                                  const s = [...facilityForm.pricingSchedule];
                                  s[idx] = { ...s[idx], startTime: e.target.value };
                                  setFacilityForm(prev => ({ ...prev, pricingSchedule: s }));
                                }}
                                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              />
                              <input
                                type="time"
                                value={tier.endTime}
                                onChange={e => {
                                  const s = [...facilityForm.pricingSchedule];
                                  s[idx] = { ...s[idx], endTime: e.target.value };
                                  setFacilityForm(prev => ({ ...prev, pricingSchedule: s }));
                                }}
                                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              />
                              <input
                                type="number"
                                value={tier.price}
                                onChange={e => {
                                  const s = [...facilityForm.pricingSchedule];
                                  s[idx] = { ...s[idx], price: e.target.value };
                                  setFacilityForm(prev => ({ ...prev, pricingSchedule: s }));
                                }}
                                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="100000"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const s = facilityForm.pricingSchedule.filter((_, i) => i !== idx);
                                  setFacilityForm(prev => ({ ...prev, pricingSchedule: s }));
                                }}
                                className="text-red-400 hover:text-red-600 text-lg leading-none px-1"
                                title="Xóa"
                              >×</button>
                            </div>
                          ))}
                        </div>
                      )}
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


