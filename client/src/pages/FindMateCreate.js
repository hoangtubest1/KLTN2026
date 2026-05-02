import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const FindMateCreate = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    
    const [sports, setSports] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        sportId: '',
        facilityId: '',
        location: '',
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        maxPlayers: 10,
        skillLevel: 'any',
        contactPhone: user?.phone || ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sportsRes, facilsRes] = await Promise.all([
                    api.get('/sports'),
                    api.get('/facilities')
                ]);
                setSports(sportsRes.data);
                setFacilities(facilsRes.data);
                if (sportsRes.data.length > 0) {
                    setFormData(prev => ({ ...prev, sportId: sportsRes.data[0].id }));
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
        
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFormData(prev => ({ ...prev, date: tomorrow.toISOString().split('T')[0] }));
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Chuẩn bị dữ liệu gửi đi (nếu có facilityId thì xóa location và ngược lại)
            const payload = { ...formData };
            if (payload.facilityId) {
                payload.location = '';
            } else {
                delete payload.facilityId;
            }

            const res = await api.post('/findmate', payload);
            alert('Tạo bài đăng thành công! Vui lòng chờ admin duyệt bài của bạn.');
            navigate(isAuthenticated && user?.role === 'admin' ? `/find-mate/${res.data.id}` : '/find-mate');
        } catch (error) {
            alert(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const filteredFacilities = formData.sportId 
        ? facilities.filter(f => String(f.sportId) === String(formData.sportId))
        : facilities;

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                <Link to="/find-mate" className="inline-flex items-center text-indigo-600 font-semibold mb-6 hover:underline">
                    &larr; Quay lại danh sách
                </Link>

                <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-8 text-white text-center">
                        <div className="text-4xl mb-2">🤝</div>
                        <h1 className="text-2xl font-bold">Tạo bài tìm người chơi</h1>
                        <p className="text-white/80 text-sm mt-2">Chia sẻ thông tin để mọi người cùng tham gia</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {/* Section 1: Thông tin cơ bản */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">1. Thông tin chung</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Môn thể thao *</label>
                                    <select 
                                        name="sportId" 
                                        value={formData.sportId} 
                                        onChange={handleChange} 
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                    >
                                        {sports.map(s => <option key={s.id} value={s.id}>{s.nameVi}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tiêu đề ngắn gọn *</label>
                                    <input 
                                        type="text" 
                                        name="title" 
                                        value={formData.title} 
                                        onChange={handleChange} 
                                        required 
                                        placeholder="VD: Cần 2 slot đá banh sân Thống Nhất..."
                                        maxLength={200}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Thời gian & Địa điểm */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 mt-8">2. Thời gian & Địa điểm</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày chơi *</label>
                                    <input 
                                        type="date" 
                                        name="date" 
                                        value={formData.date} 
                                        onChange={handleChange} 
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Từ giờ *</label>
                                    <input 
                                        type="time" 
                                        name="startTime" 
                                        value={formData.startTime} 
                                        onChange={handleChange} 
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Đến giờ *</label>
                                    <input 
                                        type="time" 
                                        name="endTime" 
                                        value={formData.endTime} 
                                        onChange={handleChange} 
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Địa điểm chơi</label>
                                    <p className="text-xs text-slate-500 mb-2">Chọn sân có sẵn trên hệ thống hoặc tự nhập địa chỉ mới.</p>
                                    <select 
                                        name="facilityId" 
                                        value={formData.facilityId} 
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 mb-3 text-sm"
                                    >
                                        <option value="">-- Tự nhập địa chỉ khác --</option>
                                        {filteredFacilities.map(f => <option key={f.id} value={f.id}>{f.name} - {f.address}</option>)}
                                    </select>

                                    {!formData.facilityId && (
                                        <input 
                                            type="text" 
                                            name="location" 
                                            value={formData.location} 
                                            onChange={handleChange} 
                                            placeholder="Nhập địa chỉ, tên sân..."
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Người chơi & Liên hệ */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 mt-8">3. Yêu cầu & Chi tiết</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Số người dự kiến *</label>
                                    <input 
                                        type="number" 
                                        name="maxPlayers" 
                                        value={formData.maxPlayers} 
                                        onChange={handleChange} 
                                        required min="2" max="50"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Trình độ mong muốn</label>
                                    <select 
                                        name="skillLevel" 
                                        value={formData.skillLevel} 
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 text-sm"
                                    >
                                        <option value="any">Mọi trình độ đều được</option>
                                        <option value="beginner">Người mới (Beginner)</option>
                                        <option value="intermediate">Trung bình/Khá (Intermediate)</option>
                                        <option value="advanced">Giỏi/Cao thủ (Advanced)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Số ĐT liên hệ (Tùy chọn)</label>
                                <input 
                                    type="tel" 
                                    name="contactPhone" 
                                    value={formData.contactPhone} 
                                    onChange={handleChange} 
                                    placeholder="Có thể để người khác gọi trực tiếp cho bạn"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả thêm (Tùy chọn)</label>
                                <textarea 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={handleChange} 
                                    placeholder="Ví dụ: Cần 2 bạn bắt gôn, ưu tiên cao to. Tiền sân chia đều..."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none h-28 resize-none text-sm"
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Đang xử lý...' : '📤 Xác nhận đăng bài'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default FindMateCreate;
