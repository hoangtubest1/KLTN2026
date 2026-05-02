import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const MyFindMate = () => {
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'joins'
    const [posts, setPosts] = useState([]);
    const [joins, setJoins] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'posts') {
                const res = await api.get('/findmate/my/posts');
                setPosts(res.data);
            } else {
                const res = await api.get('/findmate/my/joins');
                setJoins(res.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePostStatus = async (post) => {
        const action = post.status === 'closed' ? 'reopen' : 'close';
        if (!window.confirm(`Bạn muốn ${action === 'close' ? 'đóng' : 'mở lại'} bài này?`)) return;
        try {
            await api.put(`/findmate/${post.id}/${action}`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleDeletePost = async (id) => {
        if (!window.confirm('Chắc chắn muốn xóa bài đăng này vĩnh viễn?')) return;
        try {
            await api.delete(`/findmate/${id}`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'open': return 'bg-indigo-100 text-indigo-700';
            case 'full': return 'bg-green-100 text-green-700';
            case 'closed': return 'bg-gray-200 text-gray-700';
            case 'expired': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Quản lý tìm bạn chung</h1>
                        <p className="text-slate-500 mt-2">Theo dõi các bài bạn đã đăng và những kèo đã tham gia</p>
                    </div>
                    <Link to="/find-mate/create" className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-6 rounded-full shadow-md transition-all">
                        + Tạo Bài Mới
                    </Link>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${activeTab === 'posts' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Bài viết của tôi ({posts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('joins')}
                            className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${activeTab === 'joins' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Đã đăng ký tham gia ({joins.length})
                        </button>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
                        ) : activeTab === 'posts' ? (
                            posts.length === 0 ? (
                                <div className="text-center py-20 text-slate-500">Bạn chưa có bài đăng nào.</div>
                            ) : (
                                <div className="space-y-4">
                                    {posts.map(post => {
                                        const displayDate = new Date(post.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                        return (
                                            <div key={post.id} className="border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row gap-6 md:items-center justify-between hover:border-indigo-200 transition-colors">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`text-[10px] font-bold px-2 py-1 uppercase rounded-md ${getStatusStyles(post.status)}`}>
                                                            {post.status}
                                                        </span>
                                                        {!post.isApproved && (
                                                            <span className="text-[10px] font-bold px-2 py-1 uppercase rounded-md bg-yellow-100 text-yellow-700">
                                                                Chờ duyệt
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-slate-500 font-semibold">{displayDate}</span>
                                                    </div>
                                                    <Link to={`/find-mate/${post.id}`} className="text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1 mb-1">
                                                        {post.title}
                                                    </Link>
                                                    <p className="text-sm text-slate-500">👥 Tham gia: {post.currentPlayers}/{post.maxPlayers} người</p>
                                                </div>
                                                
                                                <div className="flex gap-2 min-w-fit">
                                                    <Link to={`/find-mate/${post.id}`} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors">
                                                        Người tham gia
                                                    </Link>
                                                    {post.status !== 'expired' && (
                                                        <button 
                                                            onClick={() => handleTogglePostStatus(post)}
                                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${post.status === 'closed' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                                        >
                                                            {post.status === 'closed' ? 'Mở lại' : 'Đóng bài'}
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDeletePost(post.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors" title="Xóa">
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        ) : (
                            joins.length === 0 ? (
                                <div className="text-center py-20 text-slate-500">Bạn chưa đăng ký tham gia kèo nào.</div>
                            ) : (
                                <div className="space-y-4">
                                    {joins.map(join => {
                                        const post = join.findMate;
                                        if (!post) return null;
                                        const displayDate = new Date(post.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                        
                                        let joinStatus = 'Đang chờ duyệt';
                                        let joinColor = 'bg-amber-100 text-amber-700 border-amber-200';
                                        if (join.status === 'accepted') { joinStatus = 'Đã duyệt'; joinColor = 'bg-emerald-100 text-emerald-700 border-emerald-200'; }
                                        if (join.status === 'rejected') { joinStatus = 'Bị từ chối'; joinColor = 'bg-red-100 text-red-700 border-red-200'; }

                                        return (
                                            <div key={join.id} className="border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row gap-6 md:items-center justify-between hover:border-indigo-200 transition-colors">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${joinColor}`}>
                                                            {joinStatus}
                                                        </span>
                                                    </div>
                                                    <Link to={`/find-mate/${post.id}`} className="text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1 mb-1">
                                                        {post.title}
                                                    </Link>
                                                    <div className="flex gap-4 text-sm text-slate-500">
                                                        <span>📅 {displayDate} • {post.startTime.substring(0,5)}</span>
                                                        <span>👤 Trưởng nhóm: {post.author?.name}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex min-w-fit">
                                                    <Link to={`/find-mate/${post.id}`} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors">
                                                        Xem chi tiết bài
                                                    </Link>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyFindMate;
