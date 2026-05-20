import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { useSocket } from '../context/SocketContext';

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const socketRef = useSocket();
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchTeam();
  }, [id, isAuthenticated]);

  const isCaptain = team && user && team.userId === user.id;
  const myMembership = team?.members?.find(m => m.userId === user?.id);
  const isMember = myMembership?.status === 'accepted';
  const isPending = myMembership?.status === 'pending';
  const acceptedMembers = team?.members?.filter(m => m.status === 'accepted') || [];
  const pendingMembers = team?.members?.filter(m => m.status === 'pending') || [];

  useEffect(() => {
    if (!team || (!isCaptain && !isMember)) return;

    // Tải lịch sử chat
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/teams/${id}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error('Lỗi khi tải lịch sử chat:', err);
      }
    };
    fetchMessages();

    // Sắp xếp kết nối Socket.IO
    const socket = socketRef?.current;
    if (socket) {
      socket.emit('join-team', { teamId: id });

      socket.on('team-message', (newMsg) => {
        setMessages((prev) => [...prev, newMsg]);
      });
    }

    return () => {
      if (socket) {
        socket.emit('leave-team', { teamId: id });
        socket.off('team-message');
      }
    };
  }, [team, isCaptain, isMember, id, socketRef]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    try {
      const msgText = chatMessage.trim();
      setChatMessage('');
      await api.post(`/teams/${id}/messages`, { message: msgText });
    } catch (err) {
      showMsg(err.response?.data?.message || 'Không thể gửi tin nhắn', 'error');
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await api.get(`/teams/${id}`);
      setTeam(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await api.post(`/teams/${id}/join`);
      showMsg('Đã gửi yêu cầu tham gia!');
      fetchTeam();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Lỗi', 'error');
    } finally { setActionLoading(false); }
  };

  const handleLeave = async () => {
    if (!window.confirm('Bạn có chắc muốn rời đội?')) return;
    setActionLoading(true);
    try {
      await api.delete(`/teams/${id}/leave`);
      showMsg('Đã rời đội');
      fetchTeam();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Lỗi', 'error');
    } finally { setActionLoading(false); }
  };

  const handleApprove = async (memberId, status) => {
    try {
      await api.put(`/teams/${id}/members/${memberId}`, { status });
      showMsg(status === 'accepted' ? 'Đã duyệt!' : 'Đã từ chối');
      fetchTeam();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Lỗi', 'error');
    }
  };

  const handleKick = async (memberId, name) => {
    if (!window.confirm(`Kick ${name} khỏi đội?`)) return;
    try {
      await api.delete(`/teams/${id}/kick/${memberId}`);
      showMsg(`Đã kick ${name}`);
      fetchTeam();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Lỗi', 'error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Xóa đội vĩnh viễn?')) return;
    try {
      await api.delete(`/teams/${id}`);
      navigate('/teams');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Lỗi', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8faff' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #e0e0e0', borderTopColor: '#1e3a5f', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!team) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8faff' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 64 }}>😕</span>
          <h2 style={{ color: '#374151', marginTop: 12 }}>Không tìm thấy đội</h2>
          <button onClick={() => navigate('/teams')} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, border: 'none', background: '#1e3a5f', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            Về danh sách
          </button>
        </div>
      </div>
    );
  }

  const teamImg = team.image ? resolveMediaUrl(team.image) : null;
  const createdDate = new Date(team.createdAt).toLocaleDateString('vi-VN');

  const cardStyle = { background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb', marginBottom: 20 };
  const btnBase = { padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8faff' }}>
      {/* Hero */}
      <div style={{
        height: 240, position: 'relative',
        background: teamImg ? `url(${teamImg}) center/cover` : 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 40%, #1a6b4a 100%)'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>
              {team.sport?.emoji} {team.sport?.nameVi}
            </span>
            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, padding: '4px 10px', borderRadius: 8 }}>
              📅 Ngày lập: {createdDate}
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0 }}>{team.name}</h1>
          {team.slogan && <p style={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', marginTop: 4, fontSize: 15 }}>"{team.slogan}"</p>}
        </div>
      </div>

      {/* Message Toast */}
      {message.text && (
        <div style={{
          position: 'fixed', top: 80, right: 20, zIndex: 999, padding: '12px 20px', borderRadius: 12,
          background: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          color: message.type === 'error' ? '#dc2626' : '#166534',
          fontWeight: 600, fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>
          {message.type === 'error' ? '❌' : '✅'} {message.text}
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 60px' }}>
        {/* Info + Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
          <div>
            {/* Description */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                📝 Giới thiệu
              </h3>
              <p style={{ color: '#6b7280', lineHeight: 1.7, fontSize: 14, whiteSpace: 'pre-wrap' }}>
                {team.description || 'Chưa có mô tả.'}
              </p>
            </div>

            {/* Members */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  👥 Thành viên ({acceptedMembers.length}/{team.maxMembers})
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {acceptedMembers.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f9fafb', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.role === 'captain' ? 'linear-gradient(135deg, #f59e0b, #eab308)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
                        {m.user?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, color: '#374151', fontSize: 14 }}>{m.user?.name}</span>
                        {m.role === 'captain' && <span style={{ marginLeft: 6, fontSize: 11, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>👑 Đội trưởng</span>}
                      </div>
                    </div>
                    {isCaptain && m.role !== 'captain' && (
                      <button onClick={() => handleKick(m.id, m.user?.name)} style={{ ...btnBase, background: '#fef2f2', color: '#dc2626', fontSize: 12, padding: '6px 12px' }}>
                        Kick
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Members (Captain only) */}
            {isCaptain && pendingMembers.length > 0 && (
              <div style={{ ...cardStyle, borderColor: '#fbbf24' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#92400e', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  ⏳ Yêu cầu tham gia ({pendingMembers.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pendingMembers.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fffbeb', borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                          {m.user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span style={{ fontWeight: 600, color: '#374151', fontSize: 14 }}>{m.user?.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleApprove(m.id, 'accepted')} style={{ ...btnBase, background: '#22c55e', color: '#fff', fontSize: 12, padding: '6px 14px' }}>
                          ✓ Duyệt
                        </button>
                        <button onClick={() => handleApprove(m.id, 'rejected')} style={{ ...btnBase, background: '#ef4444', color: '#fff', fontSize: 12, padding: '6px 14px' }}>
                          ✕ Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real-time Group Chat */}
            {(isCaptain || isMember) && (
              <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  💬 Trò chuyện đội nhóm
                </h3>
                
                {/* Chat Messages List */}
                <div 
                  ref={chatContainerRef}
                  style={{
                    height: 350,
                    overflowY: 'auto',
                    border: '1px solid #f3f4f6',
                    borderRadius: 12,
                    padding: '16px',
                    background: '#fafafa',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    marginBottom: 16
                  }}
                >
                  {messages.length === 0 ? (
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: 13, fontStyle: 'italic' }}>
                      Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.userId === user?.id;
                      return (
                        <div key={msg.id} style={{ display: 'flex', alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', gap: 8, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                          {/* Avatar */}
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: isMe ? 'linear-gradient(135deg, #22b84c, #15803d)' : 'linear-gradient(135deg, #1e3a5f, #2d5a87)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 12,
                            flexShrink: 0
                          }}>
                            {msg.sender?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>

                          {/* Message bubble */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                            {!isMe && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 2, marginLeft: 4 }}>
                                {msg.sender?.name}
                              </span>
                            )}
                            <div style={{
                              background: isMe ? '#22b84c' : '#ffffff',
                              color: isMe ? '#ffffff' : '#1f2937',
                              padding: '10px 14px',
                              borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              fontSize: 14,
                              lineHeight: 1.5,
                              wordBreak: 'break-word',
                              border: isMe ? 'none' : '1px solid #e5e7eb'
                            }}>
                              {msg.message}
                            </div>
                            <span style={{ fontSize: 9, color: '#9ca3af', marginTop: 4, marginLeft: isMe ? 0 : 4, marginRight: isMe ? 4 : 0 }}>
                              {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Chat Input form */}
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Nhập nội dung tin nhắn..."
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid #d1d5db',
                      fontSize: 14,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#22b84c'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '0 20px',
                      borderRadius: 12,
                      background: '#22b84c',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      boxShadow: '0 2px 8px rgba(34,184,76,0.3)',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.opacity = '0.9'}
                    onMouseOut={(e) => e.target.style.opacity = '1'}
                  >
                    Gửi 🚀
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#6b7280' }}>
                <div><span style={{ fontWeight: 600, color: '#374151' }}>🏅 Môn:</span> {team.sport?.emoji} {team.sport?.nameVi}</div>
                <div><span style={{ fontWeight: 600, color: '#374151' }}>👑 Đội trưởng:</span> {team.captain?.name}</div>
                <div><span style={{ fontWeight: 600, color: '#374151' }}>👥 Thành viên:</span> {team.currentMembers}/{team.maxMembers}</div>
                <div><span style={{ fontWeight: 600, color: '#374151' }}>📅 Ngày lập:</span> {createdDate}</div>
                <div>
                  <span style={{ fontWeight: 600, color: '#374151' }}>📊 Trạng thái:</span>{' '}
                  <span style={{ background: team.status === 'active' ? '#dcfce7' : '#f3f4f6', color: team.status === 'active' ? '#166534' : '#6b7280', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                    {team.status === 'active' ? 'Đang hoạt động' : 'Ngừng'}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div style={{ marginTop: 16 }}>
                <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #22c55e, #10b981)', width: `${Math.min(100, (team.currentMembers / team.maxMembers) * 100)}%`, transition: 'width 0.5s' }} />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {!isCaptain && !isMember && !isPending && (
                  <button onClick={handleJoin} disabled={actionLoading} style={{ ...btnBase, width: '100%', background: 'linear-gradient(135deg, #1a6b4a, #22c55e)', color: '#fff', padding: '12px 0', fontWeight: 700, boxShadow: '0 2px 10px rgba(34,197,94,0.3)' }}>
                    {actionLoading ? '⏳...' : '🤝 Tham gia đội'}
                  </button>
                )}
                {isPending && (
                  <div style={{ textAlign: 'center', padding: '12px', background: '#fef3c7', borderRadius: 10, color: '#92400e', fontWeight: 600, fontSize: 14 }}>
                    ⏳ Đang chờ đội trưởng duyệt
                  </div>
                )}
                {isMember && !isCaptain && (
                  <button onClick={handleLeave} disabled={actionLoading} style={{ ...btnBase, width: '100%', background: '#fef2f2', color: '#dc2626', padding: '12px 0', border: '1px solid #fecaca' }}>
                    🚪 Rời đội
                  </button>
                )}
                {isCaptain && (
                  <button onClick={handleDelete} style={{ ...btnBase, width: '100%', background: '#fef2f2', color: '#dc2626', padding: '12px 0', border: '1px solid #fecaca' }}>
                    🗑️ Xóa đội
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default TeamDetail;
