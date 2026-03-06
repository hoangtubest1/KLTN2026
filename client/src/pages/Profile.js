import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Link } from 'react-router-dom';

const Profile = () => {
    const { user, logout, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('info');
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handleInfoChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleUpdateInfo = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await api.put('/auth/profile', {
                name: formData.name,
                phone: formData.phone,
            });
            setMessage({ type: 'success', text: res.data.message });
            // Sync updated user data to AuthContext so Navbar etc. reflect changes
            if (res.data.user) updateUser(res.data.user);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Cập nhật thất bại' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
            return;
        }
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await api.put('/auth/profile', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setMessage({ type: 'success', text: res.data.message });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Đổi mật khẩu thất bại' });
        } finally {
            setLoading(false);
        }
    };

    const getRoleLabel = (role) => {
        if (role === 'admin') return { label: 'Quản trị viên', color: 'bg-red-100 text-red-700' };
        return { label: 'Người dùng', color: 'bg-blue-100 text-blue-700' };
    };

    const roleInfo = getRoleLabel(user?.role);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-10 px-4">
            <div className="max-w-4xl mx-auto">

                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
                    <div className="h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
                    <div className="px-6 pb-6 -mt-12 flex flex-col sm:flex-row items-start sm:items-end gap-4">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg border-4 border-white flex-shrink-0">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 pb-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleInfo.color}`}>
                                    {roleInfo.label}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm">{user?.email}</p>
                            <p className="text-gray-500 text-sm">{user?.phone}</p>
                        </div>
                        <div className="flex gap-2 pb-1">
                            <Link
                                to="/bookings"
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200"
                            >
                                📅 Lịch đặt của tôi
                            </Link>
                            <button
                                onClick={logout}
                                className="border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                    <div className="border-b border-gray-100">
                        <div className="flex">
                            {[
                                { id: 'info', label: '👤 Thông tin cá nhân' },
                                { id: 'password', label: '🔒 Đổi mật khẩu' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id); setMessage({ type: '', text: '' }); }}
                                    className={`px-6 py-4 text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Alert message */}
                        {message.text && (
                            <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${message.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
                            </div>
                        )}

                        {/* Tab: Thông tin cá nhân */}
                        {activeTab === 'info' && (
                            <form onSubmit={handleUpdateInfo} className="space-y-5 max-w-md">
                                <h2 className="text-lg font-bold text-gray-800 mb-4">Cập nhật thông tin</h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInfoChange}
                                        placeholder="Nhập họ và tên"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInfoChange}
                                        placeholder="Nhập số điện thoại"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Vai trò</label>
                                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${roleInfo.color}`}>
                                        {roleInfo.label}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-60 text-sm"
                                >
                                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </form>
                        )}

                        {/* Tab: Đổi mật khẩu */}
                        {activeTab === 'password' && (
                            <form onSubmit={handleUpdatePassword} className="space-y-5 max-w-md">
                                <h2 className="text-lg font-bold text-gray-800 mb-4">Đổi mật khẩu</h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Nhập mật khẩu hiện tại"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Ít nhất 6 ký tự"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Nhập lại mật khẩu mới"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-60 text-sm"
                                >
                                    {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Profile;
