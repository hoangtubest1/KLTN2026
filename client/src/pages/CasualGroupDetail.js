import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api';

const CasualGroupDetail = () => {
  const { id, roomCode } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(true);
  const [sending, setSending] = useState(false);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const socketRef = useSocket();
  const socket = socketRef?.current;

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchGroup();
  }, [id, roomCode, isAuthenticated, navigate]);

  // Socket.IO: join group room + listen for messages + member updates
  useEffect(() => {
    if (!socket || !group?.id) return;
    socket.emit('join-group', { groupId: group.id });

    const handleMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    };

    // Auto-refresh danh sách thành viên khi có người join/leave/kick
    const handleMemberUpdate = () => {
      fetchGroup();
    };

    socket.on('group-message', handleMessage);
    socket.on('group-member-update', handleMemberUpdate);

    return () => {
      socket.emit('leave-group', { groupId: group.id });
      socket.off('group-message', handleMessage);
      socket.off('group-member-update', handleMemberUpdate);
    };
  }, [socket, group?.id]);

  // Fetch chat history when group is loaded and user is a member
  const fetchMessages = useCallback(async (groupId) => {
    try {
      const res = await api.get(`/casual-groups/${groupId}/messages`);
      setMessages(res.data?.messages || []);
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 200);
    } catch (_) { /* not a member or error */ }
  }, []);

  const fetchGroup = async () => {
    try {
      let res;
      if (roomCode) {
        res = await api.get(`/casual-groups/join/${roomCode}`);
      } else {
        res = await api.get(`/casual-groups/${id}`);
      }
      setGroup(res.data);
      // Fetch messages after group loads
      if (res.data?.id) fetchMessages(res.data.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tìm thấy phòng');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setShowJoinModal(false);
    setJoining(true);
    try {
      await api.post(`/casual-groups/${group.id}/join`);
      fetchGroup();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi tham gia');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Bạn chắc chắn muốn rời phòng?')) return;
    try {
      await api.delete(`/casual-groups/${group.id}/leave`);
      fetchGroup();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi rời phòng');
    }
  };

  const handleKick = async (memberId, memberName) => {
    if (!window.confirm(`Kick "${memberName}" khỏi phòng?`)) return;
    try {
      await api.delete(`/casual-groups/${group.id}/kick/${memberId}`);
      fetchGroup();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi kick');
    }
  };

  const handleClose = async () => {
    if (!window.confirm('Đóng phòng? Người khác sẽ không thể tham gia nữa.')) return;
    try {
      await api.put(`/casual-groups/${group.id}/close`);
      fetchGroup();
    } catch (err) { alert(err.response?.data?.message || 'Lỗi'); }
  };

  const handleReopen = async () => {
    try {
      await api.put(`/casual-groups/${group.id}/reopen`);
      fetchGroup();
    } catch (err) { alert(err.response?.data?.message || 'Lỗi'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Xóa phòng vĩnh viễn?')) return;
    try {
      await api.delete(`/casual-groups/${group.id}`);
      navigate('/casual-group');
    } catch (err) { alert(err.response?.data?.message || 'Lỗi'); }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(group.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    const url = `${window.location.origin}/casual-group/join/${group.roomCode}`;
    if (navigator.share) {
      navigator.share({ title: group.title, text: `Tham gia phòng: ${group.roomCode}`, url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Chat: Send message ──
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || sending) return;
    setSending(true);
    try {
      await api.post(`/casual-groups/${group.id}/messages`, { content: chatInput.trim() });
      setChatInput('');
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="text-center bg-white rounded-2xl shadow-lg p-10 max-w-md">
          <span className="text-5xl block mb-4">😕</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy phòng</h2>
          <p className="text-gray-500 mb-6">{error || 'Phòng có thể đã bị xóa hoặc hết hạn.'}</p>
          <button onClick={() => navigate('/casual-group')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const isHost = user?.id === group.userId;
  const isMember = group.members?.some(m => m.userId === user?.id);
  const canJoin = !isHost && !isMember && group.status === 'open';
  const costPerPerson = group.totalCost && group.currentPlayers > 0
    ? Math.round(group.totalCost / group.currentPlayers)
    : null;
  const displayDate = new Date(group.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const progPct = Math.min(100, Math.round((group.currentPlayers / group.maxPlayers) * 100));

  const statusMap = {
    open: { label: 'Đang mở', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    full: { label: 'Đã đủ người', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
    closed: { label: 'Đã đóng', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-500' },
    expired: { label: 'Hết hạn', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' }
  };
  const st = statusMap[group.status] || statusMap.expired;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button onClick={() => navigate('/casual-group')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Quay lại
        </button>

        {/* Room Code Hero */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 md:p-8 mb-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          </div>
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{group.sport?.emoji || '⚽'}</span>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">{group.title}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${st.color}`}>
                      <span className={`w-2 h-2 rounded-full ${st.dot} animate-pulse`}></span>
                      {st.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Code Display */}
            <div className="text-center">
              <p className="text-indigo-200 text-xs mb-1 uppercase tracking-wider font-semibold">Mã phòng</p>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/25">
                <span className="text-3xl md:text-4xl font-mono font-black tracking-[0.2em]">{group.roomCode}</span>
              </div>
              <div className="flex gap-2 mt-3 justify-center">
                <button onClick={copyRoomCode} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5">
                  {copied ? '✅ Đã sao chép' : '📋 Copy mã'}
                </button>
                <button onClick={shareLink} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5">
                  🔗 Chia sẻ
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Info + Chat */}
          <div className="md:col-span-2 space-y-5">
            {/* Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Thông tin phòng
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="text-lg">🏆</span>
                  <div>
                    <p className="text-gray-400 text-xs">Môn thể thao</p>
                    <p className="font-semibold text-gray-900">{group.sport?.nameVi || group.sport?.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="text-lg">📅</span>
                  <div>
                    <p className="text-gray-400 text-xs">Ngày chơi</p>
                    <p className="font-semibold text-gray-900">{displayDate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="text-lg">⏰</span>
                  <div>
                    <p className="text-gray-400 text-xs">Giờ chơi</p>
                    <p className="font-semibold text-gray-900">{group.startTime?.slice(0,5)} - {group.endTime?.slice(0,5)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="text-lg">📍</span>
                  <div>
                    <p className="text-gray-400 text-xs">Địa điểm</p>
                    <p className="font-semibold text-gray-900">{group.facility?.name || group.location || '—'}</p>
                    {group.facility?.address && <p className="text-gray-400 text-xs mt-0.5">{group.facility.address}</p>}
                  </div>
                </div>
                {group.contactPhone && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                    <span className="text-lg">📞</span>
                    <div>
                      <p className="text-gray-400 text-xs">Liên hệ</p>
                      <p className="font-semibold text-gray-900">{group.contactPhone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="text-lg">👑</span>
                  <div>
                    <p className="text-gray-400 text-xs">Chủ phòng</p>
                    <p className="font-semibold text-gray-900">{group.host?.name}</p>
                  </div>
                </div>
              </div>
              {group.description && (
                <div className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                  <p className="text-sm text-gray-700 leading-relaxed">{group.description}</p>
                </div>
              )}
            </div>

            {/* Cost Split Card */}
            {group.totalCost > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl shadow-sm border border-amber-100 p-6">
                <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-lg">💰</span> Chia tiền sân
                </h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{Number(group.totalCost).toLocaleString('vi-VN')}đ</p>
                    <p className="text-xs text-gray-500 mt-1">Tổng chi phí</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">÷ {group.currentPlayers}</p>
                    <p className="text-xs text-gray-500 mt-1">Số người</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">= {costPerPerson?.toLocaleString('vi-VN')}đ</p>
                    <p className="text-xs text-gray-500 mt-1">Mỗi người</p>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════ */}
            {/* CHAT BOX — chỉ hiện khi là thành viên */}
            {/* ═══════════════════════════════════ */}
            {isMember && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Chat Header */}
                <button
                  onClick={() => setChatOpen(o => !o)}
                  className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Trò chuyện
                    {messages.length > 0 && (
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{messages.length}</span>
                    )}
                  </h2>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${chatOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {chatOpen && (
                  <>
                    {/* Messages */}
                    <div ref={chatContainerRef} className="px-4 py-3 space-y-3 overflow-y-auto" style={{ maxHeight: '360px', minHeight: '200px' }}>
                      {messages.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm">
                          <span className="text-3xl block mb-2">💬</span>
                          Chưa có tin nhắn. Hãy bắt đầu trò chuyện!
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isMe = msg.userId === user?.id;
                          const isSystem = msg.type === 'system';

                          if (isSystem) {
                            return (
                              <div key={msg.id} className="text-center">
                                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{msg.content}</span>
                              </div>
                            );
                          }

                          return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] ${isMe ? 'order-2' : ''}`}>
                                {!isMe && (
                                  <p className="text-[10px] font-semibold text-gray-500 mb-0.5 ml-1">
                                    {msg.sender?.name || 'User'}
                                  </p>
                                )}
                                <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                                  isMe
                                    ? 'bg-indigo-600 text-white rounded-br-md'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                }`}>
                                  {msg.content}
                                </div>
                                <p className={`text-[10px] text-gray-400 mt-0.5 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                                  {formatTime(msg.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        maxLength={500}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || sending}
                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Gửi
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: Members + Actions */}
          <div className="space-y-5">
            {/* Members */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <span>👥</span> Thành viên
                </h2>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {group.currentPlayers}/{group.maxPlayers}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progPct}%` }}></div>
              </div>

              <div className="space-y-2">
                {group.members?.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: member.isHost ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        {member.user?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                          {member.user?.name}
                          {member.isHost && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">👑 Host</span>}
                        </p>
                        <p className="text-xs text-gray-400">{member.user?.phone || member.user?.email}</p>
                      </div>
                    </div>
                    {isHost && !member.isHost && (
                      <button
                        onClick={() => handleKick(member.id, member.user?.name)}
                        className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                        title="Kick"
                      >✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {canJoin && (
                <button
                  onClick={() => setShowJoinModal(true)}
                  disabled={joining}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm"
                >
                  {joining ? 'Đang tham gia...' : '🎮 Tham gia phòng'}
                </button>
              )}
              {isMember && !isHost && (
                <button onClick={handleLeave} className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm">
                  🚪 Rời phòng
                </button>
              )}
              {isHost && (
                <>
                  {group.status === 'open' || group.status === 'full' ? (
                    <button onClick={handleClose} className="w-full py-3 bg-amber-50 text-amber-700 font-semibold rounded-xl hover:bg-amber-100 transition-colors text-sm border border-amber-200">
                      🔒 Đóng phòng
                    </button>
                  ) : group.status === 'closed' ? (
                    <button onClick={handleReopen} className="w-full py-3 bg-green-50 text-green-700 font-semibold rounded-xl hover:bg-green-100 transition-colors text-sm border border-green-200">
                      🔓 Mở lại phòng
                    </button>
                  ) : null}
                  <button onClick={handleDelete} className="w-full py-3 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors text-sm border border-red-200">
                    🗑️ Xóa phòng
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Join Confirm Modal ═══ */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowJoinModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)' }}>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                🎮 Xác nhận tham gia
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Room info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{group.sport?.emoji || '⚽'}</span>
                  <span className="font-bold text-gray-900">{group.title}</span>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>📅 {displayDate}</p>
                  <p>⏰ {group.startTime?.slice(0,5)} - {group.endTime?.slice(0,5)}</p>
                  <p>📍 {group.location || group.facility?.name || '—'}</p>
                  <p>👥 {group.currentPlayers}/{group.maxPlayers} người</p>
                </div>
              </div>

              {/* Cost breakdown */}
              {group.totalCost > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-amber-800 mb-2">💰 Chi phí dự kiến:</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tổng tiền sân</span>
                    <span className="font-bold text-gray-900">{Number(group.totalCost).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-600">Chia cho {group.currentPlayers + 1} người (bao gồm bạn)</span>
                    <span className="font-bold text-green-600 text-lg">
                      ~{Math.round(group.totalCost / (group.currentPlayers + 1)).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 text-center">Bạn có thể rời phòng bất cứ lúc nào</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleJoin}
                disabled={joining}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm"
              >
                {joining ? 'Đang tham gia...' : '✅ Tham gia ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CasualGroupDetail;
