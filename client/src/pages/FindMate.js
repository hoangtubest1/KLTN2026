import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { useAuth } from '../context/AuthContext';

const FindMate = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        sportId: '',
        date: '',
        status: 'open',
        search: '',
        upcoming: 'true'
    });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        } else {
            fetchSports();
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        fetchPosts();
    }, [filters]);

    const fetchSports = async () => {
        try {
            const res = await api.get('/sports');
            setSports(res.data);
        } catch (error) {
            console.error('Error fetching sports:', error);
        }
    };

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
            const res = await api.get(`/findmate?${params.toString()}`);
            setPosts(res.data.posts);
        } catch (error) {
            console.error('Error fetching findmate posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'open':
                return { label: 'Đang Tuyển', style: 'bg-indigo-100 text-indigo-700' };
            case 'full':
                return { label: 'Đã Đủ Người', style: 'bg-green-100 text-green-700' };
            case 'closed':
                return { label: 'Đã Đóng', style: 'bg-gray-100 text-gray-700' };
            case 'expired':
                return { label: 'Hết Hạn', style: 'bg-red-100 text-red-700' };
            default:
                return { label: status, style: 'bg-gray-100 text-gray-700' };
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 py-16 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Tìm Bạn Chơi Thể Thao</h1>
                    <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
                        Tham gia các trận đấu, kết nối với những người đam mê thể thao gần bạn. Không lo thiếu người chơi.
                    </p>
                    <Link
                        to={isAuthenticated ? "/find-mate/create" : "/login"}
                        className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:-translate-y-1"
                    >
                        + Tạo Bài Của Bạn
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                {/* Search & Filter Bar */}
                <div className="bg-white rounded-2xl shadow-lg p-4 mb-8">
                    <form className="flex flex-col md:flex-row gap-4" onSubmit={(e) => { e.preventDefault(); fetchPosts(); }}>
                        <div className="flex-1 relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Tìm theo tiêu đề, khu vực..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <select
                            name="sportId"
                            value={filters.sportId}
                            onChange={handleFilterChange}
                            className="w-full md:w-48 px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-700 bg-white"
                        >
                            <option value="">Tất cả các môn</option>
                            {sports.map(sport => (
                                <option key={sport.id} value={sport.id}>{sport.emoji} {sport.nameVi}</option>
                            ))}
                        </select>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full md:w-40 px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-700 bg-white"
                        >
                            <option value="open">Đang tuyển</option>
                            <option value="">Tất cả</option>
                        </select>
                        <input
                            type="date"
                            name="date"
                            value={filters.date}
                            onChange={handleFilterChange}
                            className="w-full md:w-44 px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-700 text-sm"
                        />
                    </form>
                </div>

                {/* Posts List */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có bài đăng nào</h3>
                        <p className="text-gray-500 mb-6">Thử thay đổi bộ lọc hoặc trở thành người đầu tiên tạo bài!</p>
                        <Link to={isAuthenticated ? "/find-mate/create" : "/login"} className="text-indigo-600 font-semibold hover:underline">
                            Tạo bài ngay →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map(post => {
                            const progPct = Math.min(100, Math.round((post.currentPlayers / post.maxPlayers) * 100));
                            const status = getStatusStyles(post.status);
                            const displayDate = new Date(post.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });

                            return (
                                <Link
                                    to={`/find-mate/${post.id}`}
                                    key={post.id}
                                    className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col overflow-hidden group"
                                >
                                    {/* Card Header (Sport bg) */}
                                    <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{post.sport?.emoji || '⚽'}</span>
                                                <span className="font-semibold text-gray-600 text-sm">{post.sport?.nameVi || 'Thể thao'}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-md ${status.style}`}>
                                                {status.label}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                            {post.title}
                                        </h3>

                                        <div className="space-y-1.5 mb-4 text-sm text-gray-600 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400 w-4">📍</span>
                                                <span className="truncate">{post.location || post.facility?.name || 'Chưa xác định địa điểm'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400 w-4">🕒</span>
                                                <span>{displayDate} • {post.startTime.substring(0, 5)} - {post.endTime.substring(0, 5)}</span>
                                            </div>
                                        </div>

                                        {/* Progress */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                                                <span>👥 {post.currentPlayers}/{post.maxPlayers} người</span>
                                                <span className="text-indigo-600">{progPct}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${progPct}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                                    {post.author?.name ? post.author.name.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                                                    {post.author?.name}
                                                </span>
                                            </div>
                                            <button className="text-indigo-600 font-semibold text-sm hover:underline">
                                                Xem chi tiết
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
            {/* FAB for Mobile */}
            <Link
                to={isAuthenticated ? "/find-mate/create" : "/login"}
                className="fixed bottom-24 right-4 md:hidden w-14 h-14 bg-amber-500 rounded-full shadow-lg flex items-center justify-center text-white text-2xl z-40"
            >
                +
            </Link>
        </div>
    );
};

export default FindMate;
