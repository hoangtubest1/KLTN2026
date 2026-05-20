import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const RegisterOwner = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    businessLicense: '', idCardFront: '', idCardBack: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [previews, setPreviews] = useState({ businessLicense: '', idCardFront: '', idCardBack: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    // Hiển thị preview ngay lập tức
    setPreviews(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/upload/owner-doc', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(prev => ({ ...prev, [field]: res.data.url || res.data.path }));
    } catch (err) {
      setError('Lỗi upload ảnh: ' + (err.response?.data?.message || err.message));
      setPreviews(prev => ({ ...prev, [field]: '' }));
    }
  };

  const clearImage = (field) => {
    setForm(prev => ({ ...prev, [field]: '' }));
    setPreviews(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.businessLicense) {
      return setError('Vui lòng upload ảnh Giấy phép kinh doanh');
    }
    if (!form.idCardFront) {
      return setError('Vui lòng upload ảnh CCCD mặt trước');
    }
    if (!form.idCardBack) {
      return setError('Vui lòng upload ảnh CCCD mặt sau');
    }

    if (!isAuthenticated) {
      // Đăng ký tài khoản mới
      if (form.password !== form.confirmPassword) {
        return setError('Mật khẩu xác nhận không khớp');
      }
      setLoading(true);
      try {
        await api.post('/auth/register-owner', {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          businessLicense: form.businessLicense,
          idCardFront: form.idCardFront,
          idCardBack: form.idCardBack
        });
        setSuccess(true);
      } catch (err) {
        setError(err.response?.data?.message || 'Đăng ký thất bại');
      } finally {
        setLoading(false);
      }
    } else {
      // Nâng cấp tài khoản hiện tại lên owner
      setLoading(true);
      try {
        await api.post('/auth/upgrade-to-owner', {
          businessLicense: form.businessLicense,
          idCardFront: form.idCardFront,
          idCardBack: form.idCardBack
        });
        setSuccess(true);
      } catch (err) {
        setError(err.response?.data?.message || 'Đăng ký thất bại');
      } finally {
        setLoading(false);
      }
    }
  };

  // Đã là chủ sân (approved)
  if (isAuthenticated && (user?.role === 'owner' || user?.ownerStatus === 'approved') && user?.ownerStatus !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bạn đã là Chủ Sân</h2>
          <p className="text-gray-500 mb-6">Tài khoản của bạn đã hoạt động với quyền Chủ Sân.</p>
          <button onClick={() => navigate('/owner-dashboard')} className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
            Đến trang quản lý chủ sân
          </button>
        </div>
      </div>
    );
  }

  // Đang chờ duyệt hồ sơ (pending)
  if (isAuthenticated && user?.ownerStatus === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hồ sơ đang chờ duyệt</h2>
          <p className="text-gray-500 mb-6">Tài khoản chủ sân của bạn đang được ban quản trị xét duyệt. Vui lòng quay lại sau.</p>
          <button onClick={() => navigate('/')} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký thành công!</h2>
          <p className="text-gray-500 mb-6">Tài khoản chủ sân của bạn đang chờ admin duyệt. Bạn sẽ được thông báo khi tài khoản được phê duyệt.</p>
          <button onClick={() => navigate(isAuthenticated ? '/' : '/login')} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            {isAuthenticated ? 'Về trang chủ' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
            🏟️ Dành cho chủ sân
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAuthenticated ? 'Đăng ký trở thành Chủ Sân' : 'Đăng ký Chủ Sân'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isAuthenticated
              ? `Xin chào ${user?.name}, bạn chỉ cần upload giấy tờ xác thực để hoàn tất đăng ký.`
              : 'Tạo tài khoản để quản lý sân bãi của bạn trên hệ thống'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-5">
          {user?.ownerStatus === 'rejected' && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl text-sm">
              <p className="font-bold">Hồ sơ trước đó bị từ chối duyệt:</p>
              <p className="mt-1 font-medium">{user?.ownerNote || 'Không có lý do chi tiết.'}</p>
              <p className="mt-2 text-xs text-red-500 font-semibold">* Vui lòng cập nhật lại tài liệu chính xác bên dưới và gửi lại yêu cầu để admin xét duyệt lại.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">{error}</div>
          )}

          {/* Thông tin cá nhân - CHỈ HIỆN KHI CHƯA ĐĂNG NHẬP */}
          {!isAuthenticated && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                Thông tin cá nhân
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" placeholder="0901234567" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
                  <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" placeholder="Ít nhất 6 ký tự" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu *</label>
                  <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" placeholder="Nhập lại mật khẩu" />
                </div>
              </div>
            </div>
          )}

          {/* Thông tin tài khoản hiện tại */}
          {isAuthenticated && (
            <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email} • {user?.phone}</p>
              </div>
            </div>
          )}

          {/* Giấy tờ */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
                {isAuthenticated ? '1' : '2'}
              </span>
              Giấy tờ xác thực
            </h3>

            {/* GPKD */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Giấy phép kinh doanh *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors">
                {previews.businessLicense ? (
                  <div className="relative">
                    <img src={previews.businessLicense} alt="GPKD" className="max-h-40 mx-auto rounded-lg object-contain" />
                    <button type="button" onClick={() => clearImage('businessLicense')} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs">✕</button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="text-gray-400 mb-1">📄 Click để upload ảnh GPKD</div>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'businessLicense')} className="hidden" />
                    <span className="text-xs text-red-500 font-medium">(Bắt buộc)</span>
                  </label>
                )}
              </div>
            </div>

            {/* CCCD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CCCD mặt trước *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors">
                  {previews.idCardFront ? (
                    <div className="relative">
                      <img src={previews.idCardFront} alt="CCCD trước" className="max-h-28 mx-auto rounded-lg object-contain" />
                      <button type="button" onClick={() => clearImage('idCardFront')} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px]">✕</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="text-gray-400 text-sm">📷 Mặt trước</div>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'idCardFront')} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CCCD mặt sau *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors">
                  {previews.idCardBack ? (
                    <div className="relative">
                      <img src={previews.idCardBack} alt="CCCD sau" className="max-h-28 mx-auto rounded-lg object-contain" />
                      <button type="button" onClick={() => clearImage('idCardBack')} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px]">✕</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="text-gray-400 text-sm">📷 Mặt sau</div>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'idCardBack')} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Đang xử lý...</>
            ) : (
              '🏟️ Đăng ký Chủ Sân'
            )}
          </button>

          {!isAuthenticated && (
            <p className="text-center text-sm text-gray-500">
              Đã có tài khoản? <Link to="/login" className="text-blue-600 hover:underline font-medium">Đăng nhập</Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default RegisterOwner;
