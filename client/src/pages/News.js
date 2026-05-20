import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { resolveMediaUrl } from '../utils/mediaUrl';

const News = () => {
  const [news, setNews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNews();
    window.scrollTo(0, 0);
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/news');
      setNews(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách tin tức:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredNews = news.filter(item => {
    const titleMatch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const summaryMatch = item.summary?.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || summaryMatch;
  });

  if (loading) {
    return (
      <div className="news-loading-container">
        <div className="news-spinner"></div>
        <p>Đang tải tin tức & sự kiện...</p>
        <style>{`
          .news-loading-container {
            min-height: 80vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            color: #6b7280;
            font-size: 15px;
          }
          .news-spinner {
            width: 44px;
            height: 44px;
            border: 3px solid #e5e7eb;
            border-top-color: #22b84c;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="news-page-wrapper">
      {/* Hero Banner */}
      <div className="news-hero-banner">
        <div className="news-hero-overlay"></div>
        <div className="news-hero-content">
          <h1>Tin Tức & Sự Kiện</h1>
          <p>Cập nhật những giải đấu, tin tức thể thao và ưu đãi mới nhất từ hệ thống Tìm Sân</p>
        </div>
      </div>

      <div className="news-body-container">
        {/* Search & Filter bar */}
        <div className="news-search-bar-container">
          <div className="news-search-wrapper">
            <svg className="news-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="news-search-input"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="news-clear-btn" aria-label="Clear search">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* News Grid */}
        {filteredNews.length === 0 ? (
          <div className="news-empty-state">
            <span className="empty-icon">📰</span>
            <h3>Không tìm thấy bài viết</h3>
            <p>Vui lòng thử lại với từ khóa khác.</p>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="reset-search-btn">
                Xem tất cả bài viết
              </button>
            )}
          </div>
        ) : (
          <div className="news-grid-layout">
            {filteredNews.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/news/${item.id}`)}
                className="news-card-item"
              >
                {/* Image container */}
                <div className="news-card-image-box">
                  {item.image ? (
                    <img
                      src={resolveMediaUrl(item.image)}
                      alt={item.title}
                      className="news-card-img"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://via.placeholder.com/400x250/22b84c/FFFFFF?text=Tin+t%E1%BB%A9c';
                      }}
                    />
                  ) : (
                    <div className="news-card-placeholder">
                      <span>📰</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="news-card-details">
                  <span className="news-card-date">
                    📅 {formatDate(item.publishedAt)}
                  </span>
                  <h3 className="news-card-title">{item.title}</h3>
                  {item.summary && <p className="news-card-summary">{item.summary}</p>}
                  <div className="news-card-footer">
                    <span className="read-more-link">
                      Đọc thêm <span>→</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .news-page-wrapper {
          min-height: 100vh;
          background: #f8faff;
          padding-bottom: 80px;
        }

        .news-hero-banner {
          position: relative;
          height: 220px;
          background: linear-gradient(135deg, #1e3a5f 0%, #22b84c 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          text-align: center;
        }

        .news-hero-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.25);
        }

        .news-hero-content {
          position: relative;
          z-index: 2;
          max-width: 800px;
          padding: 0 20px;
        }

        .news-hero-content h1 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .news-hero-content p {
          font-size: 15px;
          opacity: 0.9;
          font-weight: 500;
        }

        @media (max-width: 600px) {
          .news-hero-banner { height: 180px; }
          .news-hero-content h1 { font-size: 24px; }
          .news-hero-content p { font-size: 13px; }
        }

        .news-body-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 20px 0;
        }

        .news-search-bar-container {
          margin-bottom: 32px;
          display: flex;
          justify-content: center;
        }

        .news-search-wrapper {
          position: relative;
          width: 100%;
          max-width: 500px;
        }

        .news-search-icon {
          position: absolute;
          left: 16px;
          top: 1/2;
          transform: translateY(35%);
          width: 20px;
          height: 20px;
          color: #9ca3af;
          pointer-events: none;
        }

        .news-search-input {
          width: 100%;
          padding: 12px 48px 12px 48px;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          background: #fff;
          font-size: 14px;
          outline: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          transition: all 0.2s;
        }

        .news-search-input:focus {
          border-color: #22b84c;
          box-shadow: 0 4px 12px rgba(34,184,76,0.1);
        }

        .news-clear-btn {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 14px;
          padding: 4px;
        }

        .news-clear-btn:hover {
          color: #4b5563;
        }

        .news-grid-layout {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        @media (max-width: 380px) {
          .news-grid-layout {
            grid-template-columns: 1fr;
          }
        }

        .news-card-item {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
        }

        .news-card-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08);
          border-color: #bbf7d0;
        }

        .news-card-image-box {
          height: 200px;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          overflow: hidden;
          position: relative;
        }

        .news-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .news-card-item:hover .news-card-img {
          transform: scale(1.05);
        }

        .news-card-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 50px;
          opacity: 0.35;
        }

        .news-card-details {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .news-card-date {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .news-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.4;
          margin: 0 0 10px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s;
        }

        .news-card-item:hover .news-card-title {
          color: #22b84c;
        }

        .news-card-summary {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0 0 16px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .news-card-footer {
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid #f3f4f6;
        }

        .read-more-link {
          font-size: 13px;
          font-weight: 700;
          color: #22b84c;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .read-more-link span {
          transition: transform 0.2s;
        }

        .news-card-item:hover .read-more-link span {
          transform: translateX(4px);
        }

        .news-empty-state {
          text-align: center;
          padding: 60px 20px;
          background: #fff;
          border-radius: 16px;
          border: 1px dashed #d1d5db;
        }

        .news-empty-state .empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }

        .news-empty-state h3 {
          font-size: 18px;
          color: #374151;
          margin: 0 0 8px;
          font-weight: 700;
        }

        .news-empty-state p {
          color: #6b7280;
          font-size: 14px;
          margin: 0 0 16px;
        }

        .reset-search-btn {
          background: #22b84c;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .reset-search-btn:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default News;
