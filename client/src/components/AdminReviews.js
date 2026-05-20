import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../api';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterFacility, setFilterFacility] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reviews/all');
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      fetchReviews();
    } catch (err) {
      alert('Lỗi khi xóa: ' + (err.response?.data?.message || err.message));
    }
  };

  // Get unique facilities for filter
  const facilities = [...new Set(reviews.map(r => r.facility?.name).filter(Boolean))];

  // Filter logic
  const filteredReviews = reviews.filter(r => {
    const matchesSearch = (r.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.comment || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.facility?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = filterRating === 'all' || r.rating === parseInt(filterRating);
    const matchesFacility = filterFacility === 'all' || r.facility?.name === filterFacility;
    return matchesSearch && matchesRating && matchesFacility;
  });

  // Stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percent: totalReviews > 0 ? Math.round((reviews.filter(r => r.rating === star).length / totalReviews) * 100) : 0
  }));

  const renderStars = (rating, size = 'text-sm') => {
    return (
      <span className={`${size} flex items-center gap-0.5`}>
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={star <= rating ? 'text-amber-400' : 'text-gray-200'}>★</span>
        ))}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-2 min-h-[500px]">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-gray-100 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Quản lý đánh giá</h2>
          <p className="text-gray-500 text-sm mt-1">Xem và quản lý các đánh giá của người dùng về sân bãi</p>
        </div>
        <button
          onClick={fetchReviews}
          className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          Làm mới
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase">Tổng đánh giá</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalReviews}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase">Điểm trung bình</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-bold text-amber-500">{avgRating}</span>
            <span className="text-amber-400 text-xl">★</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase">5 sao</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-bold text-green-600">{ratingDistribution[0].count}</span>
            <span className="text-xs text-gray-400">({ratingDistribution[0].percent}%)</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase">1-2 sao</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-bold text-red-500">
              {ratingDistribution[3].count + ratingDistribution[4].count}
            </span>
            <span className="text-xs text-gray-400">
              ({ratingDistribution[3].percent + ratingDistribution[4].percent}%)
            </span>
          </div>
        </div>
      </div>

      {/* RATING DISTRIBUTION BAR */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-6 flex-wrap">
          {ratingDistribution.map(({ star, count, percent }) => (
            <div key={star} className="flex items-center gap-2 min-w-[140px]">
              <span className="text-sm font-semibold text-gray-600 w-5">{star}</span>
              <span className="text-amber-400 text-sm">★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                <div
                  className="bg-amber-400 h-2 rounded-full transition-all"
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 w-12 text-right">{count} ({percent}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-white">
        <div className="relative flex-1">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo tên người dùng, nội dung, sân..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white min-w-[120px] focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tất cả sao</option>
            <option value="5">⭐ 5 sao</option>
            <option value="4">⭐ 4 sao</option>
            <option value="3">⭐ 3 sao</option>
            <option value="2">⭐ 2 sao</option>
            <option value="1">⭐ 1 sao</option>
          </select>
          <select
            value={filterFacility}
            onChange={(e) => setFilterFacility(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white min-w-[140px] focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tất cả sân</option>
            {facilities.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase font-semibold text-gray-500 bg-white">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Người đánh giá</th>
              <th className="px-6 py-4">Sân bãi</th>
              <th className="px-6 py-4 text-center">Đánh giá</th>
              <th className="px-6 py-4">Nội dung</th>
              <th className="px-6 py-4">Ngày đánh giá</th>
              <th className="px-6 py-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr><td colSpan="7" className="text-center py-10 text-gray-500">Đang tải dữ liệu...</td></tr>
            ) : filteredReviews.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-12 text-gray-500">
                <span className="text-4xl block mb-2">📝</span>
                Không có đánh giá nào
              </td></tr>
            ) : (
              filteredReviews.map((review) => (
                <tr key={review.id} className="hover:bg-amber-50/30 transition-colors group bg-white">
                  <td className="px-6 py-4 text-gray-400 font-mono text-xs">#{review.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                        {(review.user?.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{review.user?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-400">{review.user?.email || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-800 flex items-center gap-1.5">
                      🏟️ {review.facility?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      {renderStars(review.rating)}
                      <span className="text-xs text-gray-400 mt-0.5">{review.rating}/5</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-[280px]">
                    {review.comment ? (
                      <p className="text-gray-600 line-clamp-2 cursor-pointer hover:text-gray-900 transition-colors"
                        onClick={() => setSelectedReview(review)}
                        title="Click để xem chi tiết"
                      >
                        "{review.comment}"
                      </p>
                    ) : (
                      <span className="text-gray-300 italic">Không có nội dung</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {review.createdAt ? format(new Date(review.createdAt), 'HH:mm dd/MM/yyyy') : '—'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedReview(review)}
                        className="text-gray-400 hover:text-blue-500 transition-colors p-1.5 rounded-lg hover:bg-blue-50"
                        title="Xem chi tiết"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        title="Xóa đánh giá"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-gray-50/50 rounded-b-xl">
        <div>Hiển thị <span className="font-semibold text-gray-900">{filteredReviews.length}</span> / {totalReviews} đánh giá</div>
      </div>

      {/* DETAIL MODAL */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
              <h3 className="text-lg font-bold text-gray-900">Chi tiết đánh giá #{selectedReview.id}</h3>
              <button onClick={() => setSelectedReview(null)} className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 rounded-full p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
                  {(selectedReview.user?.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{selectedReview.user?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{selectedReview.user?.email}</p>
                </div>
              </div>

              {/* Facility */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Sân bãi</p>
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  🏟️ {selectedReview.facility?.name || 'N/A'}
                </p>
              </div>

              {/* Rating */}
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Đánh giá</p>
                <div className="flex items-center justify-center gap-1 text-2xl">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} className={star <= selectedReview.rating ? 'text-amber-400' : 'text-gray-200'}>★</span>
                  ))}
                </div>
                <p className="text-2xl font-bold text-amber-600 mt-1">{selectedReview.rating}/5</p>
              </div>

              {/* Comment */}
              {selectedReview.comment && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Nội dung đánh giá</p>
                  <div className="bg-gray-50 rounded-xl p-4 text-gray-700 leading-relaxed italic">
                    "{selectedReview.comment}"
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="text-sm text-gray-400 text-right">
                Đánh giá lúc: {selectedReview.createdAt ? format(new Date(selectedReview.createdAt), 'HH:mm dd/MM/yyyy') : '—'}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between rounded-b-2xl">
              <button
                onClick={() => { handleDelete(selectedReview.id); setSelectedReview(null); }}
                className="px-5 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors"
              >
                🗑️ Xóa đánh giá
              </button>
              <button
                onClick={() => setSelectedReview(null)}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-semibold transition-colors shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
