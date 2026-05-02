import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const CasualGroup = () => {
  const [groups, setGroups] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ sportId: '', search: '' });
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
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
      const [groupsRes, sportsRes] = await Promise.all([
        api.get(`/casual-groups?upcoming=true&page=${targetPage}&limit=12`),
        api.get('/sports')
      ]);
      setGroups(groupsRes.data?.groups || []);
      setTotalPages(groupsRes.data?.totalPages || 1);
      setTotal(groupsRes.data?.total || 0);
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
      params.append('upcoming', 'true');
      params.append('page', targetPage);
      params.append('limit', '12');
      if (filter.sportId) params.append('sportId', filter.sportId);
      if (filter.search) params.append('search', filter.search);
      const res = await api.get(`/casual-groups?${params}`);
      setGroups(res.data?.groups || []);
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

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    setJoinError('');
    try {
      const res = await api.get(`/casual-groups/join/${roomCodeInput.trim()}`);
      if (res.data?.id) {
        navigate(`/casual-group/${res.data.id}`);
      }
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Không tìm thấy phòng');
    }
  };

  const getProgressColor = (pct) => {
    if (pct >= 90) return '#ef4444';
    if (pct >= 60) return '#f59e0b';
    return '#22b84c';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6d28d9 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">🏟️ Group Vãng Lai</h1>
            <p className="text-indigo-200 text-lg max-w-2xl mx-auto">Tạo phòng chơi, mời bạn bè bằng mã code — nhanh gọn, không cần chờ đợi</p>
          </div>

          {/* Join by Code */}
          <form onSubmit={handleJoinByCode} className="max-w-lg mx-auto mt-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1 border border-white/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="Nhập mã phòng (VD: ABCD-EFGH)"
                  maxLength={9}
                  className="flex-1 px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 font-mono text-lg tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button type="submit" className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all whitespace-nowrap">
                  Vào phòng
                </button>
              </div>
            </div>
            {joinError && <p className="text-red-300 text-sm mt-2 text-center">{joinError}</p>}
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filter.sportId}
              onChange={(e) => { setFilter(f => ({ ...f, sportId: e.target.value })); }}
              className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">🏆 Tất cả môn</option>
              {sports.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.nameVi || s.name}</option>)}
            </select>
            <input
              type="text"
              value={filter.search}
              onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="🔍 Tìm kiếm..."
              className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-48"
            />
            <button onClick={handleSearch} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Lọc
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/my-casual-groups')} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              📋 Phòng của tôi
            </button>
            <button onClick={() => navigate('/casual-group/create')} className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all">
              ➕ Tạo phòng mới
            </button>
          </div>
        </div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🏟️</span>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có phòng nào đang mở</h3>
            <p className="text-gray-400 mb-6">Hãy tạo phòng mới và mời bạn bè tham gia!</p>
            <button onClick={() => navigate('/casual-group/create')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
              Tạo phòng ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groups.map(group => {
              const progPct = Math.min(100, Math.round((group.currentPlayers / group.maxPlayers) * 100));
              const costPerPerson = group.totalCost && group.currentPlayers > 0
                ? Math.round(group.totalCost / group.currentPlayers)
                : null;
              const displayDate = new Date(group.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });

              return (
                <div
                  key={group.id}
                  onClick={() => navigate(`/casual-group/${group.id}`)}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all cursor-pointer border border-gray-100 group flex flex-col"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{group.sport?.emoji || '⚽'}</span>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg font-mono tracking-wider">
                        {group.roomCode}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 uppercase rounded ${
                      group.status === 'open' ? 'bg-green-100 text-green-700' :
                      group.status === 'full' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {group.status === 'open' ? 'Đang mở' : group.status === 'full' ? 'Đã đủ' : group.status}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {group.title}
                  </h3>

                  {/* Info */}
                  <div className="space-y-1.5 mb-4 text-xs text-gray-500">
                    <p>📍 {group.location || group.facility?.name || 'Chưa xác định'}</p>
                    <p>📅 {displayDate} • ⏰ {group.startTime?.slice(0,5)} - {group.endTime?.slice(0,5)}</p>
                    <p>👑 {group.host?.name || 'Chủ phòng'}</p>
                    {costPerPerson && <p className="text-amber-600 font-semibold">💰 ~{costPerPerson.toLocaleString('vi-VN')}đ/người</p>}
                  </div>

                  {/* Progress */}
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                      <span>👥 {group.currentPlayers}/{group.maxPlayers} người</span>
                      <span style={{ color: getProgressColor(progPct) }}>{progPct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progPct}%`, backgroundColor: getProgressColor(progPct) }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                  <span key={`dot-${idx}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                      p === page
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Sau →
            </button>
            <span className="text-xs text-gray-400 ml-2">{total} phòng</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CasualGroup;
