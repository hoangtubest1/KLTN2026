import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const MyCasualGroups = () => {
  const [created, setCreated] = useState([]);
  const [joined, setJoined] = useState([]);
  const [activeTab, setActiveTab] = useState('created');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchMyGroups();
  }, [isAuthenticated, navigate]);

  const fetchMyGroups = async () => {
    try {
      const res = await api.get('/casual-groups/my/groups');
      setCreated(res.data?.created || []);
      setJoined(res.data?.joined || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusMap = {
    open: { label: 'Đang mở', color: 'bg-green-100 text-green-700' },
    full: { label: 'Đã đủ', color: 'bg-amber-100 text-amber-700' },
    closed: { label: 'Đã đóng', color: 'bg-gray-100 text-gray-600' },
    expired: { label: 'Hết hạn', color: 'bg-red-100 text-red-500' }
  };

  const GroupCard = ({ group }) => {
    const st = statusMap[group.status] || statusMap.expired;
    const displayDate = new Date(group.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
    const progPct = Math.min(100, Math.round((group.currentPlayers / group.maxPlayers) * 100));

    return (
      <div
        onClick={() => navigate(`/casual-group/${group.id}`)}
        className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all cursor-pointer border border-gray-100 flex flex-col"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{group.sport?.emoji || '⚽'}</span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg font-mono tracking-wider">
              {group.roomCode}
            </span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 uppercase rounded ${st.color}`}>
            {st.label}
          </span>
        </div>
        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-indigo-600 transition-colors">{group.title}</h3>
        <div className="space-y-1 mb-4 text-xs text-gray-500">
          <p>📍 {group.location || group.facility?.name || '—'}</p>
          <p>📅 {displayDate} • ⏰ {group.startTime?.slice(0,5)} - {group.endTime?.slice(0,5)}</p>
        </div>
        <div className="mt-auto">
          <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
            <span>👥 {group.currentPlayers}/{group.maxPlayers}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progPct}%` }}></div>
          </div>
        </div>
      </div>
    );
  };

  const activeGroups = activeTab === 'created' ? created : joined;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📋 Phòng của tôi</h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý phòng bạn đã tạo và phòng bạn đã tham gia</p>
          </div>
          <button onClick={() => navigate('/casual-group/create')} className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all">
            ➕ Tạo phòng mới
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 max-w-sm">
          <button
            onClick={() => setActiveTab('created')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'created' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            👑 Tôi tạo ({created.length})
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'joined' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🤝 Tôi tham gia ({joined.length})
          </button>
        </div>

        {/* Content */}
        {activeGroups.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">{activeTab === 'created' ? '📝' : '🤝'}</span>
            <h3 className="text-lg font-bold text-gray-600 mb-2">
              {activeTab === 'created' ? 'Bạn chưa tạo phòng nào' : 'Bạn chưa tham gia phòng nào'}
            </h3>
            <p className="text-gray-400 mb-4">
              {activeTab === 'created' ? 'Tạo phòng mới để mời bạn bè chơi cùng!' : 'Nhập mã phòng hoặc xem danh sách phòng đang mở'}
            </p>
            <button
              onClick={() => navigate(activeTab === 'created' ? '/casual-group/create' : '/casual-group')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              {activeTab === 'created' ? 'Tạo phòng' : 'Xem danh sách phòng'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeGroups.map(group => <GroupCard key={group.id} group={group} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCasualGroups;
