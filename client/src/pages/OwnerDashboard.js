import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import OwnerAISupport from '../components/OwnerAISupport';
import OwnerWeather from '../components/OwnerWeather';
import OwnerPrediction from '../components/OwnerPrediction';

// Helper: convert relative image path to full URL
const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
};

// Helper to extract Google Maps embed src from iframe or URL
const extractMapSrc = (input) => {
  if (!input) return '';
  // If it's an iframe, extract src attribute
  const srcMatch = input.match(/src="([^"]+)"/);
  if (srcMatch) return srcMatch[1];
  // If it's already a URL
  if (input.startsWith('https://www.google.com/maps')) return input;
  return '';
};

// Helper to extract lat/lng from Google Maps embed URL
const extractLatLngFromEmbed = (embedUrl) => {
  if (!embedUrl) return { lat: null, lng: null };
  // Try !2d (lng) and !3d (lat) format from embed URL
  const lngMatch = embedUrl.match(/!2d([\d.\-]+)/);
  const latMatch = embedUrl.match(/!3d([\d.\-]+)/);
  if (latMatch && lngMatch) {
    return { lat: parseFloat(latMatch[1]), lng: parseFloat(lngMatch[1]) };
  }
  // Try @lat,lng format
  const atMatch = embedUrl.match(/@([\d.\-]+),([\d.\-]+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }
  return { lat: null, lng: null };
};

const tabs = [
  { id: 'overview', label: 'Tổng quan', icon: '📊' },
  { id: 'facilities', label: 'Quản lý sân', icon: '🏟️' },
  { id: 'bookings', label: 'Lịch đặt sân', icon: '📅' },
  { id: 'reviews', label: 'Bình luận', icon: '⭐' },
  { id: 'stats', label: 'Thống kê', icon: '📈' },
  { id: 'weather', label: 'Thời tiết', icon: '🌤️' },
  { id: 'prediction', label: 'Dự báo', icon: '📈' },
  { id: 'ai-support', label: 'AI Hỗ Trợ', icon: '🤖' },
];

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editFacility, setEditFacility] = useState(null);
  const [facilityForm, setFacilityForm] = useState({ 
    name: '', 
    sportId: '', 
    phone: '', 
    address: '', 
    image: '', 
    description: '', 
    courtCount: 1, 
    pricePerHour: 0, 
    status: 'active',
    mapEmbed: '',
    latitude: null,
    longitude: null,
    pricingSchedule: []
  });
  const [statsFilter, setStatsFilter] = useState('month');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFacilityImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/upload/owner-doc', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFacilityForm(p => ({ ...p, image: res.data.url || res.data.path }));
    } catch (err) {
      alert('Lỗi upload ảnh: ' + (err.response?.data?.message || err.message));
      setImagePreview('');
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchDashboard = useCallback(async () => {
    try {
      const [dashRes, sportsRes] = await Promise.all([
        api.get('/owner/dashboard'),
        api.get('/sports')
      ]);
      setDashboard(dashRes.data);
      setFacilities(dashRes.data.facilities || []);
      setSports(sportsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const fetchBookings = async () => {
    try { const r = await api.get('/owner/bookings'); setBookings(r.data); } catch (e) { console.error(e); }
  };
  const fetchReviews = async () => {
    try { const r = await api.get('/owner/reviews'); setReviews(r.data); } catch (e) { console.error(e); }
  };
  const fetchStats = async () => {
    try { const r = await api.get(`/owner/stats?period=${statsFilter}`); setStats(r.data); } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (tab === 'bookings') fetchBookings();
    if (tab === 'reviews') fetchReviews();
    if (tab === 'stats') fetchStats();
  // eslint-disable-next-line
  }, [tab, statsFilter]);

  const handleFacilitySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editFacility) {
        await api.put(`/owner/facilities/${editFacility.id}`, facilityForm);
      } else {
        await api.post('/owner/facilities', facilityForm);
      }
      setShowForm(false); setEditFacility(null);
      setFacilityForm({ 
        name: '', 
        sportId: '', 
        phone: '', 
        address: '', 
        image: '', 
        description: '', 
        courtCount: 1, 
        pricePerHour: 0, 
        status: 'active',
        mapEmbed: '',
        latitude: null,
        longitude: null,
        pricingSchedule: []
      });
      fetchDashboard();
    } catch (err) { alert(err.response?.data?.message || 'Lỗi'); }
  };

  const deleteFacility = async (id) => {
    if (!window.confirm('Xóa sân này?')) return;
    try { await api.delete(`/owner/facilities/${id}`); fetchDashboard(); } catch (e) { alert('Lỗi xóa sân'); }
  };

  const updateBookingStatus = async (id, status) => {
    try { await api.put(`/owner/bookings/${id}`, { status }); fetchBookings(); } catch (e) { alert('Lỗi cập nhật'); }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Xóa bình luận này?')) return;
    try { await api.delete(`/owner/reviews/${id}`); fetchReviews(); } catch (e) { alert('Lỗi xóa'); }
  };

  const exportExcel = async () => {
    try {
      const r = await api.get('/owner/stats/export');
      const data = r.data;
      if (!data.length) return alert('Không có dữ liệu');
      const headers = Object.keys(data[0]);
      const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
      link.download = `thongke_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (e) { alert('Lỗi xuất dữ liệu'); }
  };

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n || 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">🏟️ Quản lý Chủ Sân</h1>
            <p className="text-sm text-gray-500">Xin chào, {user?.name}</p>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Đã duyệt ✓</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* OVERVIEW */}
        {tab === 'overview' && dashboard && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Tổng sân', value: dashboard.facilities?.length || 0, icon: '🏟️', color: 'blue' },
                { label: 'Booking hôm nay', value: dashboard.todayBookings?.length || 0, icon: '📅', color: 'green' },
                { label: 'Đánh giá TB', value: dashboard.avgRating?.average || '0.0', icon: '⭐', color: 'yellow' },
                { label: 'Tổng đánh giá', value: dashboard.avgRating?.count || 0, icon: '💬', color: 'purple' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Today bookings */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">📅 Booking hôm nay</h3>
              {(dashboard.todayBookings?.length || 0) === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">Chưa có booking nào hôm nay</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50"><th className="px-3 py-2 text-left">Sân</th><th className="px-3 py-2 text-left">Khách</th><th className="px-3 py-2 text-left">Giờ</th><th className="px-3 py-2 text-left">Trạng thái</th></tr></thead>
                    <tbody>
                      {dashboard.todayBookings.map(b => (
                        <tr key={b.id} className="border-t"><td className="px-3 py-2">{b.facilityName}</td><td className="px-3 py-2">{b.customerName}</td><td className="px-3 py-2">{b.startTime}-{b.endTime}</td>
                          <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{b.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent reviews */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">⭐ Đánh giá gần đây</h3>
              {(dashboard.recentReviews?.length || 0) === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">Chưa có đánh giá</p>
              ) : (
                <div className="space-y-3">
                  {dashboard.recentReviews.map(r => (
                    <div key={r.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">👤</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm"><span className="font-semibold">{r.user?.name}</span><span className="text-yellow-500">{'⭐'.repeat(r.rating)}</span></div>
                        <p className="text-sm text-gray-600 mt-0.5">{r.comment}</p>
                        <p className="text-xs text-gray-400 mt-1">{r.facility?.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FACILITIES */}
        {tab === 'facilities' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Danh sách sân ({facilities.length})</h2>
              <button onClick={() => { setShowForm(true); setEditFacility(null); setImagePreview(''); setFacilityForm({ name: '', sportId: sports[0]?.id || '', phone: '', address: '', image: '', description: '', courtCount: 1, pricePerHour: 0, status: 'active', mapEmbed: '', latitude: null, longitude: null, pricingSchedule: [] }); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">+ Thêm sân</button>
            </div>

            {showForm && (
              <form onSubmit={handleFacilitySubmit} className="bg-white rounded-xl p-5 shadow-sm mb-6 space-y-4">
                <h3 className="font-bold">{editFacility ? 'Sửa sân' : 'Thêm sân mới'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tên sân *</label>
                    <input type="text" placeholder="Nhập tên sân..." value={facilityForm.name} onChange={e => setFacilityForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Môn thể thao *</label>
                    <select value={facilityForm.sportId} onChange={e => setFacilityForm(p => ({ ...p, sportId: e.target.value }))} required className="w-full px-3 py-2 border rounded-lg">
                      <option value="">Chọn môn thể thao</option>
                      {sports.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.nameVi}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại *</label>
                    <input type="text" placeholder="Số điện thoại liên hệ..." value={facilityForm.phone} onChange={e => setFacilityForm(p => ({ ...p, phone: e.target.value }))} required className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ sân *</label>
                    <input type="text" placeholder="Địa chỉ cụ thể..." value={facilityForm.address} onChange={e => setFacilityForm(p => ({ ...p, address: e.target.value }))} required className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Số lượng sân *</label>
                    <input type="number" placeholder="Số sân (ví dụ: 1)" value={facilityForm.courtCount} onChange={e => setFacilityForm(p => ({ ...p, courtCount: parseInt(e.target.value) || 1 }))} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Giá mặc định/giờ (VNĐ) *</label>
                    <input type="number" placeholder="Giá mặc định mỗi giờ (ví dụ: 100000)" value={facilityForm.pricePerHour} onChange={e => setFacilityForm(p => ({ ...p, pricePerHour: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh sân</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors">
                      {imagePreview ? (
                        <div className="relative inline-block">
                          <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg object-contain" />
                          {uploadingImage && <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}
                          <button type="button" onClick={() => { setImagePreview(''); setFacilityForm(p => ({ ...p, image: '' })); }} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs">✕</button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <div className="text-gray-400 mb-1">📷 Click để upload ảnh sân</div>
                          <input type="file" accept="image/*" onChange={handleFacilityImageUpload} className="hidden" />
                          <span className="text-xs text-gray-400">(JPG, PNG, WebP - tối đa 5MB)</span>
                        </label>
                      )}
                    </div>
                  </div>
                  <textarea placeholder="Mô tả" value={facilityForm.description} onChange={e => setFacilityForm(p => ({ ...p, description: e.target.value }))} className="px-3 py-2 border rounded-lg sm:col-span-2" rows={2} />

                  {/* Google Maps Embed */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      🗺️ Nhúng Bản Đồ Google Maps
                    </label>
                    <p className="text-[11px] text-gray-400">
                      Vào Google Maps → Tìm sân → Chia sẻ → Nhúng bản đồ → Sao chép HTML rồi dán vào đây
                    </p>
                    <textarea
                      value={facilityForm.mapEmbed || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const src = extractMapSrc(val);
                        const coords = extractLatLngFromEmbed(src || val);
                        setFacilityForm(prev => ({
                          ...prev,
                          mapEmbed: val,
                          ...(coords.lat && coords.lng ? { latitude: coords.lat, longitude: coords.lng } : {})
                        }));
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                      rows="2"
                      placeholder='Dán mã <iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe> vào đây'
                    />
                    {/* Map Preview */}
                    {extractMapSrc(facilityForm.mapEmbed) && (
                      <div className="rounded-xl overflow-hidden border border-gray-200">
                        <iframe
                          src={extractMapSrc(facilityForm.mapEmbed)}
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Google Maps"
                        />
                      </div>
                    )}
                    {facilityForm.latitude && facilityForm.longitude && (
                      <p className="text-xs text-green-600">✅ Đã nhận diện tọa độ: {facilityForm.latitude.toFixed(6)}, {facilityForm.longitude.toFixed(6)}</p>
                    )}
                  </div>

                  {/* Pricing Schedule */}
                  <div className="sm:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
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
                      <p className="text-gray-400 text-xs italic py-1">Chưa có khung giờ nào. Nếu không thêm, giá mặc định = Giá/Giờ ở trên.</p>
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
                              className="px-2 py-1 border rounded-lg text-sm"
                            />
                            <input
                              type="time"
                              value={tier.endTime}
                              onChange={e => {
                                const s = [...facilityForm.pricingSchedule];
                                s[idx] = { ...s[idx], endTime: e.target.value };
                                setFacilityForm(prev => ({ ...prev, pricingSchedule: s }));
                              }}
                              className="px-2 py-1 border rounded-lg text-sm"
                            />
                            <input
                              type="number"
                              value={tier.price}
                              onChange={e => {
                                const s = [...facilityForm.pricingSchedule];
                                s[idx] = { ...s[idx], price: e.target.value };
                                setFacilityForm(prev => ({ ...prev, pricingSchedule: s }));
                              }}
                              className="px-2 py-1 border rounded-lg text-sm"
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
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">{editFacility ? 'Cập nhật' : 'Tạo sân'}</button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Hủy</button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facilities.map(f => (
                <div key={f.id} className={`bg-white rounded-xl shadow-sm border p-4 ${!f.isApproved ? 'border-l-4 border-l-amber-400' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900">{f.name}</h3>
                    <div className="flex gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${f.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {f.isApproved ? '✅ Đã duyệt' : '⏳ Chờ duyệt'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${f.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>{f.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}</span>
                    </div>
                  </div>
                  {!f.isApproved && (
                    <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-700">⚠️ Sân chưa được admin duyệt. Khách hàng chưa thể nhìn thấy sân này trên hệ thống.</p>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mb-1">📍 {f.address}</p>
                  <p className="text-sm text-gray-500 mb-1">📞 {f.phone}</p>
                  <p className="text-sm text-gray-500 mb-2">{f.sport?.emoji} {f.sport?.nameVi} • {fmt(f.pricePerHour)}đ/h</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditFacility(f); setFacilityForm({ name: f.name, sportId: f.sportId, phone: f.phone, address: f.address, image: f.image, description: f.description, courtCount: f.courtCount, pricePerHour: f.pricePerHour, status: f.status, mapEmbed: f.mapEmbed || '', latitude: f.latitude || null, longitude: f.longitude || null, pricingSchedule: f.pricingSchedule || [] }); setImagePreview(f.image ? getImageUrl(f.image) : ''); setShowForm(true); }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100">✏️ Sửa</button>
                    <button onClick={() => deleteFacility(f.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100">🗑️ Xóa</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOOKINGS */}
        {tab === 'bookings' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="font-bold">📅 Lịch đặt sân ({bookings.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left">Ngày</th><th className="px-3 py-2 text-left">Sân</th><th className="px-3 py-2 text-left">Khách</th><th className="px-3 py-2 text-left">SĐT</th>
                  <th className="px-3 py-2 text-left">Giờ</th><th className="px-3 py-2 text-right">Giá</th><th className="px-3 py-2 text-center">Trạng thái</th><th className="px-3 py-2 text-center">Thao tác</th>
                </tr></thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">{b.date}</td><td className="px-3 py-2">{b.facilityName}</td><td className="px-3 py-2">{b.customerName}</td><td className="px-3 py-2">{b.customerPhone}</td>
                      <td className="px-3 py-2">{b.startTime}-{b.endTime}</td><td className="px-3 py-2 text-right">{fmt(b.totalPrice)}đ</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : b.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>{b.status}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {b.status === 'pending' && (
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="px-2 py-1 bg-green-500 text-white rounded text-xs">Duyệt</button>
                            <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="px-2 py-1 bg-red-500 text-white rounded text-xs">Hủy</button>
                          </div>
                        )}
                        {b.status === 'confirmed' && (
                          <button onClick={() => updateBookingStatus(b.id, 'completed')} className="px-2 py-1 bg-blue-500 text-white rounded text-xs">Hoàn thành</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && <p className="text-center text-gray-400 py-8">Chưa có booking nào</p>}
            </div>
          </div>
        )}

        {/* REVIEWS */}
        {tab === 'reviews' && (
          <div>
            <h2 className="text-lg font-bold mb-4">⭐ Bình luận ({reviews.length})</h2>
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">👤</div>
                    <div>
                      <div className="flex items-center gap-2"><span className="font-semibold text-sm">{r.user?.name}</span><span className="text-yellow-500 text-xs">{'⭐'.repeat(r.rating)}</span></div>
                      <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                      <p className="text-xs text-gray-400 mt-1">📍 {r.facility?.name} • {new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteReview(r.id)} className="px-2 py-1 bg-red-50 text-red-500 rounded-lg text-xs hover:bg-red-100">🗑️</button>
                </div>
              ))}
              {reviews.length === 0 && <p className="text-center text-gray-400 py-8">Chưa có bình luận nào</p>}
            </div>
          </div>
        )}

        {/* STATS */}
        {tab === 'stats' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">📈 Thống kê doanh thu</h2>
              <div className="flex gap-2">
                {['week', 'month', 'year'].map(p => (
                  <button key={p} onClick={() => setStatsFilter(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statsFilter === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : 'Năm'}
                  </button>
                ))}
                <button onClick={exportExcel} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold">📥 Xuất CSV</button>
              </div>
            </div>

            {stats && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Tổng sân', value: stats.totalFacilities, color: 'blue' },
                    { label: 'Tổng booking', value: stats.totalBookings, color: 'green' },
                    { label: 'Doanh thu', value: fmt(stats.totalRevenue) + 'đ', color: 'yellow' },
                    { label: 'Hôm nay', value: fmt(stats.todayRevenue) + 'đ', color: 'purple' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 shadow-sm border">
                      <div className="text-sm text-gray-500">{s.label}</div>
                      <div className="text-xl font-bold text-gray-900 mt-1">{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Revenue chart - simple bar representation */}
                {stats.revenueByDate?.length > 0 && (
                  <div className="bg-white rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold mb-4">Doanh thu theo ngày</h3>
                    <div className="space-y-2">
                      {stats.revenueByDate.slice(-14).map((d, i) => {
                        const maxR = Math.max(...stats.revenueByDate.map(x => x.revenue));
                        const pct = maxR > 0 ? (d.revenue / maxR * 100) : 0;
                        return (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className="w-20 text-gray-500 text-xs">{d.date.slice(5)}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                            </div>
                            <span className="w-28 text-right font-medium text-xs">{fmt(d.revenue)}đ</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Revenue by facility */}
                {stats.revenueByFacility && Object.keys(stats.revenueByFacility).length > 0 && (
                  <div className="bg-white rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold mb-3">Doanh thu theo sân</h3>
                    {Object.entries(stats.revenueByFacility).map(([name, rev], i) => (
                      <div key={i} className="flex justify-between py-2 border-b last:border-0 text-sm">
                        <span>{name}</span><span className="font-semibold">{fmt(rev)}đ</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Status breakdown */}
                {stats.bookingsByStatus && (
                  <div className="bg-white rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold mb-3">Booking theo trạng thái</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {Object.entries(stats.bookingsByStatus).map(([st, cnt], i) => (
                        <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold">{cnt}</div>
                          <div className="text-xs text-gray-500">{st}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* WEATHER */}
        {tab === 'weather' && (
          <OwnerWeather />
        )}

        {/* PREDICTION */}
        {tab === 'prediction' && (
          <OwnerPrediction />
        )}

        {/* AI SUPPORT */}
        {tab === 'ai-support' && (
          <OwnerAISupport />
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
