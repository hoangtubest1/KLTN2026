import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { resolveMediaUrl } from '../utils/mediaUrl';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ sportId: '', search: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchData();
  }, [isAuthenticated, navigate]);

  const fetchData = async (targetPage = 1) => {
    try {
      const [teamsRes, sportsRes] = await Promise.all([
        api.get(`/teams?page=${targetPage}&limit=12`),
        api.get('/sports')
      ]);
      setTeams(teamsRes.data?.teams || []);
      setTotalPages(teamsRes.data?.totalPages || 1);
      setTotal(teamsRes.data?.total || 0);
      setPage(targetPage);
      setSports(sportsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', targetPage);
      params.append('limit', '12');
      if (filter.sportId) params.append('sportId', filter.sportId);
      if (filter.search) params.append('search', filter.search);
      const res = await api.get(`/teams?${params}`);
      setTeams(res.data?.teams || []);
      setTotalPages(res.data?.totalPages || 1);
      setTotal(res.data?.total || 0);
      setPage(targetPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    if (filter.sportId || filter.search) {
      handleSearch(p);
    } else {
      setLoading(true);
      fetchData(p);
    }
  };

  const getTeamImage = (team) => {
    if (team.image) return resolveMediaUrl(team.image);
    // Fallback gradient colors based on sport
    return null;
  };

  const getSportGradient = (sportId) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
      'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    ];
    return gradients[(sportId || 0) % gradients.length];
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid #e0e0e0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: 16, color: '#6b7280', fontWeight: 500 }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 50%, #f8faff 100%)' }}>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 40%, #1a6b4a 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.08,
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 16px', position: 'relative' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-0.02em' }}>
              ⚽ Đội Nhóm Thể Thao
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
              Tạo đội, tìm đồng đội và chinh phục mọi giải đấu cùng nhau!
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px 60px' }}>
        {/* Actions Bar */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
          alignItems: 'center', gap: 12, marginBottom: 24,
          background: '#fff', borderRadius: 16, padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 16 }}>🔍</span>
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Tìm kiếm theo tên..."
                style={{
                  width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10,
                  border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Sport filter */}
            <select
              value={filter.sportId}
              onChange={(e) => { setFilter(f => ({ ...f, sportId: e.target.value })); }}
              style={{
                padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb',
                fontSize: 14, fontWeight: 500, background: '#fff', outline: 'none',
                cursor: 'pointer', minWidth: 150
              }}
            >
              <option value="">🏆 Tất cả môn</option>
              {sports.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.nameVi || s.name}</option>)}
            </select>

            <button
              onClick={() => handleSearch()}
              style={{
                padding: '10px 20px', borderRadius: 10,
                background: 'linear-gradient(135deg, #1e3a5f, #2d5a87)',
                color: '#fff', fontSize: 14, fontWeight: 600, border: 'none',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(30,58,95,0.3)'
              }}
              onMouseOver={e => e.target.style.transform = 'translateY(-1px)'}
              onMouseOut={e => e.target.style.transform = 'translateY(0)'}
            >
              Lọc
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate('/my-teams')}
              style={{
                padding: '10px 18px', borderRadius: 10, border: '1.5px solid #e5e7eb',
                background: '#fff', fontSize: 14, fontWeight: 600, color: '#374151',
                cursor: 'pointer', transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={e => { e.target.style.background = '#f9fafb'; e.target.style.borderColor = '#d1d5db'; }}
              onMouseOut={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#e5e7eb'; }}
            >
              📋 Đội của tôi
            </button>
            <button
              onClick={() => navigate('/teams/create')}
              style={{
                padding: '10px 22px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #1a6b4a, #22c55e)',
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 2px 10px rgba(34,197,94,0.35)',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={e => e.target.style.transform = 'translateY(-1px)'}
              onMouseOut={e => e.target.style.transform = 'translateY(0)'}
            >
              ➕ Tạo đội
            </button>
          </div>
        </div>

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            background: '#fff', borderRadius: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6'
          }}>
            <span style={{ fontSize: 64, display: 'block', marginBottom: 16 }}>🏟️</span>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Chưa có đội nào</h3>
            <p style={{ color: '#9ca3af', marginBottom: 24 }}>Hãy trở thành người đầu tiên tạo đội!</p>
            <button
              onClick={() => navigate('/teams/create')}
              style={{
                padding: '12px 28px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #1a6b4a, #22c55e)',
                color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer'
              }}
            >
              Tạo đội ngay
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 20
          }}>
            {teams.map(team => {
              const teamImg = getTeamImage(team);
              const memberPct = Math.min(100, Math.round((team.currentMembers / team.maxMembers) * 100));
              const createdDate = new Date(team.createdAt).toLocaleDateString('vi-VN');

              return (
                <div
                  key={team.id}
                  onClick={() => navigate(`/teams/${team.id}`)}
                  style={{
                    background: '#fff', borderRadius: 16, overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer', transition: 'all 0.3s ease',
                    display: 'flex', flexDirection: 'column'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
                  }}
                >
                  {/* Team Image / Gradient */}
                  <div style={{
                    height: 160, position: 'relative',
                    background: teamImg ? `url(${teamImg}) center/cover` : getSportGradient(team.sportId),
                    display: 'flex', alignItems: 'flex-end'
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)'
                    }} />
                    <div style={{ position: 'relative', padding: '12px 16px', width: '100%', boxSizing: 'border-box' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                          color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px',
                          borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4
                        }}>
                          {team.sport?.emoji || '⚽'} {team.sport?.nameVi || team.sport?.name}
                        </span>
                        <span style={{
                          background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                          color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 10px',
                          borderRadius: 8
                        }}>
                          📅 {createdDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{
                      fontSize: 17, fontWeight: 700, color: '#111827',
                      marginBottom: 6, lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                    }}>
                      {team.name}
                    </h3>

                    {team.slogan && (
                      <p style={{
                        fontSize: 13, color: '#6b7280', fontStyle: 'italic',
                        marginBottom: 12, lineHeight: 1.4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        "{team.slogan}"
                      </p>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, fontSize: 13, color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>👑</span>
                        <span style={{ fontWeight: 600, color: '#374151' }}>Đội trưởng:</span>
                        <span>{team.captain?.name || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>👥</span>
                        <span style={{ fontWeight: 600, color: '#374151' }}>Thành viên:</span>
                        <span>{team.currentMembers} / {team.maxMembers}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginTop: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 4 }}>
                        <span>{memberPct}% đã đầy</span>
                        <span>{team.maxMembers - team.currentMembers} chỗ trống</span>
                      </div>
                      <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 3,
                          background: memberPct >= 90 ? 'linear-gradient(90deg, #ef4444, #f97316)' :
                                     memberPct >= 60 ? 'linear-gradient(90deg, #f59e0b, #eab308)' :
                                     'linear-gradient(90deg, #22c55e, #10b981)',
                          width: `${memberPct}%`,
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>

                    {/* Action button */}
                    <button
                      style={{
                        marginTop: 14, width: '100%', padding: '10px 0',
                        borderRadius: 10, border: '2px solid #1a6b4a',
                        background: 'transparent', color: '#1a6b4a',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={e => { e.target.style.background = '#1a6b4a'; e.target.style.color = '#fff'; }}
                      onMouseOut={e => { e.target.style.background = 'transparent'; e.target.style.color = '#1a6b4a'; }}
                      onClick={(e) => { e.stopPropagation(); navigate(`/teams/${team.id}`); }}
                    >
                      Vào Team
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32 }}>
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
                background: '#fff', fontSize: 13, fontWeight: 500, color: '#6b7280',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.4 : 1
              }}
            >
              ← Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`dot-${idx}`} style={{ padding: '0 6px', color: '#9ca3af' }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    style={{
                      width: 36, height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: p === page ? 'none' : '1px solid #e5e7eb',
                      background: p === page ? 'linear-gradient(135deg, #1e3a5f, #2d5a87)' : '#fff',
                      color: p === page ? '#fff' : '#6b7280',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
                background: '#fff', fontSize: 13, fontWeight: 500, color: '#6b7280',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages ? 0.4 : 1
              }}
            >
              Sau →
            </button>
            <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>{total} đội</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Teams;
