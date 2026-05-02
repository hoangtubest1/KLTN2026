import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { resolveMediaUrl } from '../utils/mediaUrl';

const FindMateDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joinMessage, setJoinMessage] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    useEffect(() => {
        fetchPost();
    }, [id]);

    const fetchPost = async () => {
        try {
            const res = await api.get(`/findmate/${id}`);
            setPost(res.data);
        } catch (error) {
            console.error('Lỗi khi tải bài đăng:', error);
            if (error.response?.status === 404) {
                navigate('/find-mate');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) return navigate('/login');
        setIsJoining(true);
        try {
            await api.post(`/findmate/${id}/join`, { message: joinMessage });
            alert('Đã gửi yêu cầu tham gia thành công. Vui lòng chờ người đăng duyệt.');
            setShowJoinModal(false);
            fetchPost(); // Reload data
        } catch (error) {
            alert(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setIsJoining(false);
        }
    };

    const handleLeave = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy đăng ký tham gia kèo này?')) return;
        try {
            await api.delete(`/findmate/${id}/join`);
            alert('Đã hủy tham gia.');
            fetchPost();
        } catch (error) {
            alert(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleAction = async (joinId, status) => {
        try {
            await api.put(`/findmate/${id}/join/${joinId}`, { status });
            fetchPost();
        } catch (error) {
            alert(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center p-4"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    }

    if (!post) return null;

    const isOwner = user?.id === post.userId;
    const myJoin = isAuthenticated ? post.joins?.find(j => j.userId === user?.id) : null;
    const progPct = Math.min(100, Math.round((post.currentPlayers / post.maxPlayers) * 100));
    const displayDate = new Date(post.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

    let statusStyle = 'bg-gray-100 text-gray-700';
    let statusLabel = post.status;
    if (post.status === 'open') { statusStyle = 'bg-indigo-100 text-indigo-700'; statusLabel = 'Đang Tuyển'; }
    if (post.status === 'full') { statusStyle = 'bg-green-100 text-green-700'; statusLabel = 'Đã Đủ Người'; }
    if (post.status === 'closed') { statusStyle = 'bg-gray-100 text-gray-700'; statusLabel = 'Đã Đóng'; }
    if (post.status === 'expired') { statusStyle = 'bg-red-100 text-red-700'; statusLabel = 'Hết Hạn'; }

    // Avatar màu gradient cho user
    const avatarColor = (name) => {
        const colors = ['from-blue-400 to-indigo-500', 'from-emerald-400 to-green-500', 'from-amber-400 to-orange-500', 'from-pink-400 to-rose-500'];
        const idx = name ? name.charCodeAt(0) % colors.length : 0;
        return colors[idx];
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                <Link to="/find-mate" className="inline-flex items-center text-indigo-600 font-semibold mb-6 hover:underline">
                    &larr; Xem các bài khác
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Main Info) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="h-3 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                            <div className="p-6 md:p-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg">
                                        <span className="text-xl">{post.sport?.emoji || '⚽'}</span>
                                        <span className="font-semibold text-gray-700">{post.sport?.nameVi}</span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusStyle}`}>
                                        {statusLabel}
                                    </span>
                                </div>

                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 leading-snug">
                                    {post.title}
                                </h1>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-slate-700 mb-8">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0 text-xl">📅</div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Thời gian</p>
                                            <p className="font-medium text-gray-900">{displayDate}</p>
                                            <p className="text-indigo-600 font-semibold">{post.startTime.substring(0, 5)} - {post.endTime.substring(0, 5)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0 text-xl">📍</div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Địa điểm</p>
                                            {post.facility ? (
                                                <Link to={`/facility/${post.facility.id}`} className="font-medium text-indigo-600 hover:underline">
                                                    {post.facility.name} ↗
                                                </Link>
                                            ) : (
                                                <p className="font-medium text-gray-900">{post.location || 'Chưa xác định'}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0 text-xl">🏆</div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Trình độ</p>
                                            <p className="font-medium text-gray-900">
                                                {post.skillLevel === 'any' ? 'Mọi trình độ' : 
                                                 post.skillLevel === 'beginner' ? 'Người mới chơi' :
                                                 post.skillLevel === 'intermediate' ? 'Bán chuyên/Trung bình' : 'Khá/Giỏi'}
                                            </p>
                                        </div>
                                    </div>

                                    {(isOwner || myJoin?.status === 'accepted') && post.contactPhone && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0 text-xl">📞</div>
                                            <div>
                                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Điện thoại LH</p>
                                                <p className="font-medium text-gray-900">{post.contactPhone}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-slate-100 my-6"></div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Mô tả chi tiết</h3>
                                    <div className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                                        {post.description || <span className="italic text-slate-400">Không có mô tả thêm.</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Members List */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Thành viên tham gia</h3>
                            <p className="text-sm text-slate-500 mb-6">Mọi người cùng chơi hôm nay</p>

                            <div className="space-y-4">
                                {/* Author */}
                                <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${avatarColor(post.author?.name)} shadow-sm`}>
                                            {post.author?.name ? post.author.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{post.author?.name} <span className="text-indigo-600 text-xs ml-1 bg-indigo-100 px-2 py-0.5 rounded-full">Trưởng nhóm</span></p>
                                            <p className="text-sm text-slate-500">Đã tham gia</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Participants */}
                                {post.joins?.filter(j => j.status === 'accepted' || isOwner).map(join => (
                                    <div key={join.id} className="flex justify-between items-center p-4 rounded-2xl bg-white border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${avatarColor(join.user?.name)} opacity-90`}>
                                                {join.user?.name ? join.user.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{join.user?.name} 
                                                    {join.status === 'pending' && <span className="text-amber-600 text-xs ml-2 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Chờ duyệt</span>}
                                                </p>
                                                {isOwner && join.message && join.status === 'pending' && (
                                                    <p className="text-xs text-slate-500 italic mt-1 bg-slate-50 p-2 rounded">"{join.message}"</p>
                                                )}
                                                {isOwner && join.status === 'accepted' && (
                                                    <p className="text-xs text-slate-500 font-mono mt-0.5">📞 {join.user?.phone}</p>
                                                )}
                                            </div>
                                        </div>
                                        {/* Admin actions */}
                                        {isOwner && join.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAction(join.id, 'accepted')} className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-colors" title="Duyệt">✓</button>
                                                <button onClick={() => handleAction(join.id, 'rejected')} className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors" title="Từ chối">✕</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Join Action) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 sticky top-24">
                            <h3 className="font-bold text-gray-900 mb-6 text-center text-lg">Thông tin tham gia</h3>
                            
                            {/* Progress info */}
                            <div className="mb-8">
                                <div className="flex justify-between items-baseline mb-2">
                                    <span className="text-3xl font-black text-indigo-600">{post.currentPlayers}</span>
                                    <span className="text-slate-500 font-medium">/ {post.maxPlayers} người</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                                    <div 
                                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700" 
                                        style={{ width: `${progPct}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-center text-slate-500">
                                    {post.currentPlayers >= post.maxPlayers ? 'Đã đủ thành viên' : `Còn thiếu ${post.maxPlayers - post.currentPlayers} người`}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            {isOwner ? (
                                <Link to="/my-find-mate" className="block w-full py-3.5 px-4 bg-indigo-50 text-indigo-700 font-bold text-center rounded-xl hover:bg-indigo-100 transition-colors">
                                    Quản lý bài đăng của bạn
                                </Link>
                            ) : myJoin ? (
                                <div className="space-y-3">
                                    <div className={`p-4 rounded-xl text-center border font-medium ${
                                        myJoin.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                        myJoin.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'
                                    }`}>
                                        {myJoin.status === 'accepted' && '🎉 Chủ bài đã duyệt bạn!'}
                                        {myJoin.status === 'pending' && '⏳ Đang chờ chủ bài duyệt...'}
                                        {myJoin.status === 'rejected' && '❌ Yêu cầu tham gia bị từ chối'}
                                    </div>
                                    <button 
                                        onClick={handleLeave}
                                        className="block w-full py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold text-center rounded-xl hover:bg-slate-50 transition-colors"
                                    >
                                        Hủy đăng ký
                                    </button>
                                </div>
                            ) : post.status === 'open' ? (
                                <button 
                                    onClick={() => isAuthenticated ? setShowJoinModal(true) : navigate('/login')}
                                    className="block w-full py-4 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-center rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all"
                                >
                                    Đăng ký tham gia ngay
                                </button>
                            ) : (
                                <button disabled className="block w-full py-4 px-4 bg-slate-100 text-slate-400 font-bold text-center rounded-xl cursor-not-allowed">
                                    {statusLabel}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Join Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-white">
                            <h3 className="text-xl font-bold">Xác nhận tham gia</h3>
                            <p className="text-white/80 text-sm mt-1">Gửi lời nhắn cho trưởng nhóm</p>
                        </div>
                        <form onSubmit={handleJoin} className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Lời chào / Giới thiệu bản thân (Tùy chọn)
                                </label>
                                <textarea
                                    value={joinMessage}
                                    onChange={(e) => setJoinMessage(e.target.value)}
                                    placeholder="Ví dụ: Chào bạn, mình chơi cũng khá, cho mình tham gia nhé..."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none resize-none h-24"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setShowJoinModal(false)}
                                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isJoining}
                                    className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors shadow-md disabled:opacity-70"
                                >
                                    {isJoining ? 'Đang gửi...' : 'Gửi yêu cầu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FindMateDetail;
