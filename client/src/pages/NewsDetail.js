import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';

const NewsDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchArticle();
        fetchRelated();
        window.scrollTo(0, 0);
    }, [id]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/news/${id}`);
            setArticle(res.data);
        } catch (err) {
            setError('Không tìm thấy bài viết');
        } finally {
            setLoading(false);
        }
    };

    const fetchRelated = async () => {
        try {
            const res = await api.get('/news');
            setRelated(res.data.filter(n => String(n.id) !== String(id)).slice(0, 4));
        } catch (err) { }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const renderContent = (content) => {
        if (!content) return null;
        const paragraphs = content.split('\n').filter(p => p.trim() !== '');
        return paragraphs.map((para, i) => {
            const trimmed = para.trim();
            if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(trimmed)) {
                return (
                    <div key={i} className="news-content-image">
                        <img src={trimmed} alt={`Hình ${i + 1}`} />
                    </div>
                );
            }
            const prevTrimmed = i > 0 ? paragraphs[i - 1].trim() : '';
            if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(prevTrimmed) && trimmed.length < 200) {
                return <p key={i} className="news-image-caption">{trimmed}</p>;
            }
            return <p key={i} className="news-body-para">{trimmed}</p>;
        });
    };

    if (loading) {
        return (
            <div className="news-detail-loading">
                <div className="news-loading-spinner"></div>
                <p>Đang tải bài viết...</p>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="news-detail-error">
                <div className="news-error-icon">📰</div>
                <h2>Không tìm thấy bài viết</h2>
                <p>Bài viết này có thể đã bị xóa hoặc không tồn tại.</p>
                <button onClick={() => navigate('/')} className="news-back-home-btn">Về trang chủ</button>
            </div>
        );
    }

    return (
        <div className="news-detail-page">
            <div className="news-detail-container">
                <button onClick={() => navigate(-1)} className="news-back-btn">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Quay lại tin tức
                </button>

                <div className="news-detail-layout">
                    <article className="news-article">
                        <div className="news-meta">
                            <span className="news-meta-date">
                                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
                                    <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
                                    <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
                                </svg>
                                {formatDate(article.publishedAt)}
                            </span>
                            <span className="news-meta-time">
                                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                    <polyline points="12 6 12 12 16 14" strokeWidth="2" />
                                </svg>
                                {formatTime(article.publishedAt)}
                            </span>
                        </div>

                        <h1 className="news-title">{article.title}</h1>

                        {article.summary && (
                            <p className="news-summary">{article.summary}</p>
                        )}

                        {article.image && (
                            <div className="news-hero-image">
                                <img src={article.image} alt={article.title} />
                            </div>
                        )}

                        <div className="news-body">
                            {renderContent(article.content)}
                        </div>

                        <div className="news-share-bar">
                            <span className="news-share-label">Chia sẻ:</span>
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="news-share-btn facebook"
                            >
                                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                                </svg>
                                Facebook
                            </a>
                            <button
                                className="news-share-btn copy"
                                onClick={() => { navigator.clipboard.writeText(window.location.href); }}
                            >
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                Sao chép link
                            </button>
                        </div>
                    </article>

                    {related.length > 0 && (
                        <aside className="news-sidebar">
                            <h3 className="news-sidebar-title">Bài viết liên quan</h3>
                            <div className="news-sidebar-list">
                                {related.map(item => (
                                    <Link key={item.id} to={`/news/${item.id}`} className="news-sidebar-item">
                                        {item.image && (
                                            <div className="news-sidebar-thumb">
                                                <img src={item.image} alt={item.title} />
                                            </div>
                                        )}
                                        <div className="news-sidebar-info">
                                            <p className="news-sidebar-item-title">{item.title}</p>
                                            <span className="news-sidebar-date">{formatDate(item.publishedAt)}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </aside>
                    )}
                </div>
            </div>

            <style>{`
        .news-detail-page {
          min-height: 100vh;
          background: #f9fafb;
          padding: 0 0 60px;
        }
        .news-detail-loading,
        .news-detail-error {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: #6b7280;
        }
        .news-loading-spinner {
          width: 40px; height: 40px;
          border: 3px solid #e5e7eb;
          border-top-color: #22b84c;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .news-error-icon { font-size: 48px; }
        .news-detail-error h2 { font-size: 20px; font-weight: 700; color: #111; }
        .news-back-home-btn {
          background: #22b84c; color: #fff;
          border: none; padding: 10px 24px;
          border-radius: 8px; font-weight: 600;
          cursor: pointer; margin-top: 8px;
        }
        .news-detail-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 20px 0;
        }
        .news-back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          color: #6b7280; font-size: 14px; font-weight: 500;
          padding: 0; margin-bottom: 28px;
          transition: color 0.2s;
        }
        .news-back-btn:hover { color: #22b84c; }
        .news-detail-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 36px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .news-detail-layout { grid-template-columns: 1fr; }
        }
        .news-article {
          background: #fff;
          border-radius: 16px;
          padding: 40px 44px;
          box-shadow: 0 1px 8px rgba(0,0,0,0.07);
        }
        @media (max-width: 600px) {
          .news-article { padding: 24px 18px; }
        }
        .news-meta {
          display: flex; align-items: center; gap: 20px;
          font-size: 13px; color: #9ca3af;
          margin-bottom: 18px;
          justify-content: center;
        }
        .news-meta-date, .news-meta-time {
          display: flex; align-items: center; gap: 5px;
        }
        .news-title {
          font-size: 28px;
          font-weight: 800;
          color: #111827;
          line-height: 1.35;
          text-align: center;
          margin: 0 0 18px;
        }
        @media (max-width: 600px) { .news-title { font-size: 22px; } }
        .news-summary {
          font-size: 16px;
          color: #4b5563;
          line-height: 1.7;
          font-style: italic;
          border-left: 3px solid #22b84c;
          padding-left: 16px;
          margin: 0 0 24px;
        }
        .news-hero-image {
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 28px;
        }
        .news-hero-image img {
          width: 100%;
          max-height: 480px;
          object-fit: cover;
          display: block;
        }
        .news-body { font-size: 16px; color: #374151; line-height: 1.8; }
        .news-body-para { margin-bottom: 16px; }
        .news-content-image {
          margin: 24px 0;
          border-radius: 10px;
          overflow: hidden;
        }
        .news-content-image img {
          width: 100%; max-height: 520px;
          object-fit: cover; display: block;
        }
        .news-image-caption {
          text-align: center;
          font-size: 13px;
          color: #9ca3af;
          font-style: italic;
          margin: -16px 0 24px;
        }
        .news-share-bar {
          display: flex; align-items: center; gap: 10px;
          margin-top: 36px; padding-top: 24px;
          border-top: 1px solid #f3f4f6;
          flex-wrap: wrap;
        }
        .news-share-label { font-size: 14px; font-weight: 600; color: #374151; }
        .news-share-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 8px;
          font-size: 13px; font-weight: 600;
          cursor: pointer; border: none; text-decoration: none;
          transition: opacity 0.2s;
        }
        .news-share-btn:hover { opacity: 0.85; }
        .news-share-btn.facebook { background: #1877f2; color: #fff; }
        .news-share-btn.copy { background: #f3f4f6; color: #374151; }
        .news-sidebar {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 1px 8px rgba(0,0,0,0.07);
          position: sticky;
          top: 80px;
        }
        .news-sidebar-title {
          font-size: 16px; font-weight: 700;
          color: #111827; margin: 0 0 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #22b84c;
        }
        .news-sidebar-list { display: flex; flex-direction: column; gap: 16px; }
        .news-sidebar-item {
          display: flex; gap: 12px;
          text-decoration: none; color: inherit;
          padding-bottom: 16px;
          border-bottom: 1px solid #f3f4f6;
          transition: opacity 0.2s;
        }
        .news-sidebar-item:last-child { border-bottom: none; padding-bottom: 0; }
        .news-sidebar-item:hover { opacity: 0.75; }
        .news-sidebar-thumb {
          width: 72px; height: 54px;
          border-radius: 8px; overflow: hidden; flex-shrink: 0;
        }
        .news-sidebar-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .news-sidebar-info { flex: 1; min-width: 0; }
        .news-sidebar-item-title {
          font-size: 13px; font-weight: 600; color: #111827;
          line-height: 1.4; margin: 0 0 6px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .news-sidebar-date { font-size: 12px; color: #9ca3af; }
      `}</style>
        </div>
    );
};

export default NewsDetail;
