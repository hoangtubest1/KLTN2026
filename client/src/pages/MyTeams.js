import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { resolveMediaUrl } from '../utils/mediaUrl';

const MyTeams = () => {
  const [createdTeams, setCreatedTeams] = useState([]);
  const [joinedTeams, setJoinedTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchMyTeams();
  }, [isAuthenticated, navigate]);

  const fetchMyTeams = async () => {
    try {
      const res = await api.get('/teams/my/teams');
      setCreatedTeams(res.data?.created || []);
      setJoinedTeams(res.data?.joined || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTeamImage = (team) => {
    if (team.image) return resolveMediaUrl(team.image);
    return null;
  };

  const getSportGradient = (sportId) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    ];
    return gradients[(sportId || 0) % gradients.length];
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8faff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid #e0e0e0', borderTopColor: '#1e3a5f', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: 16, color: '#6b7280', fontWeight: 500 }}>Đang tải...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const TeamCard = ({ team, isCaptain }) => {
    const teamImg = getTeamImage(team);
    const memberPct = Math.min(100, Math.round((team.currentMembers / team.maxMembers) * 100));

    return (
      <div
        onClick={() => navigate(`/teams/${team.id}`)}
        style={{
          background: '#fff', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb',
          cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <div style={{
          height: 120, position: 'relative',
          background: teamImg ? `url(${teamImg}) center/cover` : getSportGradient(team.sportId),
          display: 'flex', alignItems: 'flex-end'
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
          <div style={{ position: 'relative', padding: '12px 16px', width: '100%' }}>
            <span style={{
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
              color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px',
              borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 4
            }}>
              {team.sport?.emoji || '⚽'} {team.sport?.nameVi || team.sport?.name}
            </span>
          </div>
        </div>

        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.3, flex: 1, paddingRight: 8 }}>
              {team.name}
            </h3>
            {isCaptain && (
              <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                👑 Đội trưởng
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
            <span>👥</span> {team.currentMembers} / {team.maxMembers} thành viên
          </div>

          <div style={{ marginTop: 'auto' }}>
            <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #1a6b4a, #22c55e)', width: `${memberPct}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8faff', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 40%, #1a6b4a 100%)', padding: '40px 16px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: 0 }}>📋 Đội Của Tôi</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>Quản lý các đội bạn đã tạo hoặc tham gia</p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
        {createdTeams.length === 0 && joinedTeams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, border: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: 48 }}>🤔</span>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#374151', margin: '16px 0 8px' }}>Bạn chưa tham gia đội nào</h3>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>Hãy tạo một đội mới hoặc tìm đội để tham gia nhé!</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => navigate('/teams')} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>
                Tìm đội
              </button>
              <button onClick={() => navigate('/teams/create')} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1a6b4a, #22c55e)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Tạo đội
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {createdTeams.length > 0 && (
              <section>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  👑 Đội tôi quản lý ({createdTeams.length})
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                  {createdTeams.map(team => <TeamCard key={team.id} team={team} isCaptain={true} />)}
                </div>
              </section>
            )}

            {joinedTeams.length > 0 && (
              <section>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  🤝 Đội tôi tham gia ({joinedTeams.length})
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                  {joinedTeams.map(team => <TeamCard key={team.id} team={team} isCaptain={false} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeams;
