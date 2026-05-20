import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const TeamCreate = () => {
  const [sports, setSports] = useState([]);
  const [form, setForm] = useState({
    sportId: '',
    name: '',
    description: '',
    slogan: '',
    maxMembers: 20,
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchSports();
  }, [isAuthenticated, navigate]);

  const fetchSports = async () => {
    try {
      const res = await api.get('/sports');
      setSports(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(f => ({ ...f, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Vui lòng nhập tên đội');
      return;
    }
    if (!form.sportId) {
      setError('Vui lòng chọn môn thể thao');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = null;

      // Upload ảnh nếu có
      if (form.image) {
        const formData = new FormData();
        formData.append('file', form.image);
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadRes.data?.url || uploadRes.data?.filePath || null;
      }

      const res = await api.post('/teams', {
        sportId: parseInt(form.sportId),
        name: form.name.trim(),
        description: form.description.trim() || null,
        slogan: form.slogan.trim() || null,
        image: imageUrl,
        maxMembers: parseInt(form.maxMembers) || 20
      });

      navigate(`/teams/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 40%, #1a6b4a 100%)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.08,
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 16px', position: 'relative', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            ➕ Tạo Đội Mới
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>
            Tập hợp đồng đội, cùng nhau luyện tập và thi đấu
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '-32px auto 60px', padding: '0 16px', position: 'relative' }}>
        <form onSubmit={handleSubmit} style={{
          background: '#fff', borderRadius: 20, padding: '36px 32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb'
        }}>
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
              padding: '12px 16px', marginBottom: 20, color: '#dc2626',
              fontSize: 14, fontWeight: 500
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Tên đội */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Tên đội <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="VD: Team bóng rổ Quận 11"
              maxLength={200}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = '#1a6b4a'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Môn thể thao */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Môn thể thao <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={form.sportId}
              onChange={(e) => setForm(f => ({ ...f, sportId: e.target.value }))}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none',
                background: '#fff', cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="">-- Chọn môn --</option>
              {sports.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.nameVi || s.name}</option>)}
            </select>
          </div>

          {/* Slogan */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Slogan / Khẩu hiệu
            </label>
            <input
              type="text"
              value={form.slogan}
              onChange={(e) => setForm(f => ({ ...f, slogan: e.target.value }))}
              placeholder="VD: Vô là có người gánh"
              maxLength={255}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none',
                fontStyle: 'italic',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = '#1a6b4a'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Mô tả */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Mô tả đội
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Giới thiệu về đội, phong cách chơi, lịch tập..."
              rows={4}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
                resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6,
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = '#1a6b4a'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Số thành viên tối đa */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Số thành viên tối đa
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min={2}
                max={100}
                value={form.maxMembers}
                onChange={(e) => setForm(f => ({ ...f, maxMembers: parseInt(e.target.value) }))}
                style={{ flex: 1, accentColor: '#1a6b4a' }}
              />
              <span style={{
                background: '#f0fdf4', color: '#166534', fontWeight: 700,
                padding: '6px 14px', borderRadius: 8, fontSize: 15, minWidth: 50, textAlign: 'center'
              }}>
                {form.maxMembers}
              </span>
            </div>
          </div>

          {/* Ảnh đại diện */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Ảnh đại diện đội
            </label>
            <div style={{
              border: '2px dashed #d1d5db', borderRadius: 14, padding: 20,
              textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s',
              background: '#fafafa'
            }}
              onClick={() => document.getElementById('team-image-input').click()}
              onMouseOver={e => e.currentTarget.style.borderColor = '#1a6b4a'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#d1d5db'}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, objectFit: 'cover' }}
                />
              ) : (
                <div>
                  <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>📷</span>
                  <p style={{ color: '#9ca3af', fontSize: 14 }}>Nhấn để chọn ảnh</p>
                </div>
              )}
            </div>
            <input
              id="team-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={() => navigate('/teams')}
              style={{
                flex: 1, padding: '14px 0', borderRadius: 12,
                border: '1.5px solid #e5e7eb', background: '#fff',
                color: '#6b7280', fontSize: 15, fontWeight: 600, cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 2, padding: '14px 0', borderRadius: 12,
                border: 'none',
                background: submitting ? '#9ca3af' : 'linear-gradient(135deg, #1a6b4a, #22c55e)',
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
                transition: 'all 0.2s'
              }}
            >
              {submitting ? '⏳ Đang tạo...' : '🏆 Tạo Đội'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamCreate;
