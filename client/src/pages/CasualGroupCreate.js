import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const CasualGroupCreate = () => {
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [form, setForm] = useState({
    bookingId: '',
    title: '',
    description: '',
    maxPlayers: 10,
    contactPhone: ''
  });
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchEligibleBookings();
  }, [isAuthenticated, navigate]);

  const fetchEligibleBookings = async () => {
    try {
      setLoading(true);
      const [eligibleRes, bookingsRes] = await Promise.all([
        api.get('/casual-groups/my-eligible-bookings'),
        api.get('/bookings?status=confirmed').catch(() => ({ data: { bookings: [] } }))
      ]);
      setEligibleBookings(eligibleRes.data || []);
      // Đếm tổng số booking confirmed của user
      const bookings = bookingsRes.data?.bookings || bookingsRes.data || [];
      setTotalBookings(Array.isArray(bookings) ? bookings.length : 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));

    if (name === 'bookingId') {
      const booking = eligibleBookings.find(b => String(b.id) === value);
      setSelectedBooking(booking || null);
      if (booking && !form.title) {
        setForm(f => ({ ...f, title: `Giao lưu ${booking.sport?.nameVi || 'thể thao'} - ${booking.facilityName}` }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bookingId || !form.title) {
      alert('Vui lòng chọn lịch đặt sân và điền tiêu đề phòng');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        bookingId: parseInt(form.bookingId),
        maxPlayers: parseInt(form.maxPlayers) || 10,
        contactPhone: form.contactPhone || user?.phone || ''
      };
      const res = await api.post('/casual-groups', payload);
      navigate(`/casual-group/${res.data.id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tạo phòng');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-500 text-sm">Đang kiểm tra lịch đặt sân của bạn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button onClick={() => navigate('/casual-group')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Quay lại
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)' }}>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              🏟️ Tạo phòng mới
            </h1>
            <p className="text-sm text-gray-500 mt-1">Mã phòng sẽ được tạo tự động sau khi hoàn thành</p>
          </div>

          {eligibleBookings.length === 0 ? (
            <div className="p-10 text-center">
              <span className="text-5xl block mb-4">📅</span>
              {totalBookings > 0 ? (
                /* User có booking nhưng đã tạo phòng hết rồi */
                <>
                  <h2 className="text-lg font-bold text-gray-800 mb-2">Tất cả lịch đặt sân đã được dùng</h2>
                  <p className="text-gray-500 text-sm mb-2 max-w-md mx-auto">
                    Bạn có <strong>{totalBookings}</strong> lịch đặt sân đã xác nhận, nhưng tất cả đã được dùng để tạo phòng hoặc đã qua ngày.
                  </p>
                  <p className="text-gray-400 text-xs mb-6">
                    Hãy đặt thêm sân mới để tạo phòng Group Vãng Lai.
                  </p>
                  <button 
                    onClick={() => navigate('/')} 
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-sm transition-colors"
                  >
                    Đặt sân mới
                  </button>
                </>
              ) : (
                /* User chưa có booking nào */
                <>
                  <h2 className="text-lg font-bold text-gray-800 mb-2">Chưa có lịch đặt sân nào phù hợp</h2>
                  <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                    Bạn cần phải đặt sân thành công (đã xác nhận) rồi mới có thể tạo phòng Group Vãng Lai để rủ người khác chơi chung.
                  </p>
                  <button 
                    onClick={() => navigate('/')} 
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-sm transition-colors"
                  >
                    Đi tìm và đặt sân ngay
                  </button>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Chọn Lịch Đặt Sân */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chọn lịch đặt sân của bạn <span className="text-red-500">*</span></label>
                <select
                  name="bookingId"
                  value={form.bookingId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all bg-indigo-50/30 font-medium"
                >
                  <option value="">-- Chọn lịch đặt sân đã xác nhận --</option>
                  {eligibleBookings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.date} ({b.startTime} - {b.endTime}) • {b.facilityName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Booking Details (Read-only) */}
              {selectedBooking && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                  <div><span className="text-gray-500">Môn:</span> <span className="font-semibold text-gray-900">{selectedBooking.sport?.emoji} {selectedBooking.sport?.nameVi}</span></div>
                  <div><span className="text-gray-500">Sân:</span> <span className="font-semibold text-gray-900">{selectedBooking.facilityName}</span></div>
                  <div><span className="text-gray-500">Ngày:</span> <span className="font-semibold text-indigo-600">{new Date(selectedBooking.date).toLocaleDateString('vi-VN')}</span></div>
                  <div><span className="text-gray-500">Giờ:</span> <span className="font-semibold text-indigo-600">{selectedBooking.startTime.substring(0,5)} - {selectedBooking.endTime.substring(0,5)}</span></div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-500">Chi phí gốc:</span> <span className="font-bold text-green-600">{parseFloat(selectedBooking.totalPrice).toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              )}

              {/* Tên phòng */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên phòng <span className="text-red-500">*</span></label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="VD: Đá bóng cuối tuần - Q7"
                  required
                  minLength={3}
                  maxLength={200}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all"
                />
              </div>

              {/* Số người */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số người tối đa <span className="text-gray-400 font-normal">(bao gồm cả bạn)</span></label>
                  <input
                    type="number"
                    name="maxPlayers"
                    value={form.maxPlayers}
                    onChange={handleChange}
                    min={2}
                    max={50}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">SĐT liên hệ</label>
                  <input
                    name="contactPhone"
                    value={form.contactPhone}
                    onChange={handleChange}
                    placeholder={user?.phone || 'Nhập SĐT liên hệ'}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả thêm</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="VD: Chơi vui, mang theo nước, chia đều tiền sân..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all resize-none"
                />
              </div>

              {/* Preview cost split */}
              {selectedBooking && selectedBooking.totalPrice > 0 && form.maxPlayers > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <p className="text-sm text-amber-800">
                    💰 Tiền sân mỗi người dự kiến: <strong>{Math.round(selectedBooking.totalPrice / form.maxPlayers).toLocaleString('vi-VN')}đ</strong> (nếu đủ {form.maxPlayers} người)
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !selectedBooking}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm mt-2"
              >
                {submitting ? 'Đang tạo phòng...' : '🚀 Tạo phòng — nhận mã ngay'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CasualGroupCreate;
