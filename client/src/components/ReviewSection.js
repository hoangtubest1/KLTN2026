import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const StarRating = ({ rating, onRate, interactive = false, size = 'md' }) => {
    const [hovered, setHovered] = useState(0);
    const sizeClass = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={!interactive}
                    onClick={() => interactive && onRate && onRate(star)}
                    onMouseEnter={() => interactive && setHovered(star)}
                    onMouseLeave={() => interactive && setHovered(0)}
                    className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
                >
                    <svg
                        className={`${sizeClass} ${star <= (hovered || rating) ? 'text-yellow-400' : 'text-gray-300'
                            } transition-colors`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
            ))}
        </div>
    );
};

const ReviewSection = ({ facilityId }) => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [hasCompletedBooking, setHasCompletedBooking] = useState(false);

    const [form, setForm] = useState({ rating: 0, comment: '' });
    const [editForm, setEditForm] = useState({ rating: 0, comment: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const myReview = reviews.find(r => r.userId === user?.id);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/reviews/facility/${facilityId}`);
            setReviews(res.data.reviews);
            setAvgRating(res.data.avgRating);
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkCompletedBooking = async () => {
        if (!user) return;
        try {
            const res = await api.get(`/bookings?customerEmail=${encodeURIComponent(user.email)}&facilityId=${facilityId}&status=completed`);
            const bookings = Array.isArray(res.data) ? res.data : [];
            setHasCompletedBooking(bookings.some(b => b.status === 'completed'));
        } catch {
            setHasCompletedBooking(false);
        }
    };

    useEffect(() => {
        if (facilityId) {
            fetchReviews();
            checkCompletedBooking();
        }
    }, [facilityId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.rating === 0) { setError('Vui lòng chọn số sao'); return; }

        try {
            setSubmitting(true);
            await api.post('/reviews', {
                facilityId, rating: form.rating, comment: form.comment
            });

            setSuccess('Đã gửi đánh giá thành công!');
            setForm({ rating: 0, comment: '' });
            fetchReviews();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async (id) => {
        setError('');
        try {
            await api.put(`/reviews/${id}`, editForm);
            setEditingId(null);
            fetchReviews();
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
        try {
            await api.delete(`/reviews/${id}`);
            fetchReviews();
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const startEdit = (review) => {
        setEditingId(review.id);
        setEditForm({ rating: review.rating, comment: review.comment || '' });
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const getInitials = (name) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

    return (
        <div className="mb-10">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    Đánh giá & Nhận xét
                </h2>
                {avgRating && (
                    <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-xl">
                        <div className="text-3xl font-bold text-yellow-500">{avgRating}</div>
                        <div>
                            <StarRating rating={Math.round(avgRating)} size="md" />
                            <p className="text-xs text-gray-500 mt-0.5">{reviews.length} đánh giá</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Write Review Form */}
            {user ? (
                !myReview ? (
                    hasCompletedBooking ? (
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-6 mb-6">
                            <h3 className="font-semibold text-gray-800 mb-4">Viết đánh giá của bạn</h3>
                            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg mb-3 text-sm">{error}</div>}
                            {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-2 rounded-lg mb-3 text-sm">{success}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Chọn số sao</label>
                                    <StarRating rating={form.rating} onRate={(r) => setForm(f => ({ ...f, rating: r }))} interactive size="lg" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Bình luận (tuỳ chọn)</label>
                                    <textarea
                                        value={form.comment}
                                        onChange={(e) => setForm(f => ({ ...f, comment: e.target.value }))}
                                        placeholder="Chia sẻ trải nghiệm của bạn về sân này..."
                                        rows={3}
                                        maxLength={1000}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                                    />
                                    <p className="text-xs text-gray-400 text-right mt-1">{form.comment.length}/1000</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : null}
                                    {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 text-center">
                            <p className="text-gray-600 font-medium">Bạn chỉ có thể đánh giá sân sau khi hoàn thành buổi đặt sân tại đây</p>
                        </div>
                    )
                ) : null
            ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 text-center">
                    <p className="text-gray-600">
                        <a href="/login" className="text-blue-600 font-semibold hover:underline">Đăng nhập</a>
                        {' '}để viết đánh giá
                    </p>
                </div>
            )}

            {error && !myReview && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>}

            {/* Reviews List */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl">
                    <div className="text-4xl mb-2">💬</div>
                    <p className="text-gray-500">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className={`bg-white border-2 ${review.userId === user?.id ? 'border-blue-100' : 'border-gray-100'} rounded-xl p-5`}>
                            {editingId === review.id ? (
                                /* Edit Mode */
                                <div>
                                    <div className="mb-3">
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">Số sao</label>
                                        <StarRating rating={editForm.rating} onRate={(r) => setEditForm(f => ({ ...f, rating: r }))} interactive size="lg" />
                                    </div>
                                    <textarea
                                        value={editForm.comment}
                                        onChange={(e) => setEditForm(f => ({ ...f, comment: e.target.value }))}
                                        rows={2}
                                        maxLength={1000}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-3"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(review.id)} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700">Lưu</button>
                                        <button onClick={() => setEditingId(null)} className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-200">Huỷ</button>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <div>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar */}
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                {getInitials(review.user?.name)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-gray-900 text-sm">{review.user?.name || 'Người dùng'}</p>
                                                    {review.userId === user?.id && (
                                                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Bạn</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StarRating rating={review.rating} />
                                            {review.userId === user?.id && (
                                                <div className="flex gap-1 ml-2">
                                                    <button onClick={() => startEdit(review)} className="text-gray-400 hover:text-blue-600 transition-colors p-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button onClick={() => handleDelete(review.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {review.comment && (
                                        <p className="text-gray-700 text-sm ml-13 leading-relaxed">{review.comment}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReviewSection;
