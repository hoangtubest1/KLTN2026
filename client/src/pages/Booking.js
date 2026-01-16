import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import './Booking.css';

const Booking = () => {
  const { sportId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [sports, setSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    sportId: sportId || '',
    facilityName: '',
    customerName: user?.name || '',
    customerPhone: user?.phone || '',
    customerEmail: user?.email || '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '08:00',
    endTime: '09:00',
    notes: ''
  });

  useEffect(() => {
    fetchSports();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.name || '',
        customerPhone: user.phone || '',
        customerEmail: user.email || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    if (sportId && sports.length > 0) {
      const sport = sports.find(s => s._id === sportId);
      if (sport) {
        setSelectedSport(sport);
        setFormData(prev => ({ ...prev, sportId, facilityName: sport.facilities?.[0]?.name || '' }));
      }
    }
  }, [sportId, sports]);

  const fetchSports = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/sports');
      setSports(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sports:', error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'sportId') {
      const sport = sports.find(s => s._id === value);
      setSelectedSport(sport);
      setFormData(prev => ({ 
        ...prev, 
        facilityName: sport?.facilities?.[0]?.name || '' 
      }));
    }
  };

  const calculatePrice = () => {
    if (!selectedSport) return 0;
    const start = new Date(`2000-01-01 ${formData.startTime}`);
    const end = new Date(`2000-01-01 ${formData.endTime}`);
    const duration = (end - start) / (1000 * 60 * 60);
    return duration * selectedSport.pricePerHour;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post('http://localhost:5000/api/bookings', formData);
      setMessage({ type: 'success', text: 'Đặt lịch thành công!' });
      setTimeout(() => {
        navigate('/bookings');
      }, 2000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Có lỗi xảy ra' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="container">
        <div className="booking-form-container">
          <h2>Đặt Lịch Thể Thao</h2>
          
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="booking-form">
            <div className="form-group">
              <label>Chọn Môn Thể Thao *</label>
              <select
                name="sportId"
                value={formData.sportId}
                onChange={handleChange}
                required
              >
                <option value="">-- Chọn môn thể thao --</option>
                {sports.map(sport => (
                  <option key={sport._id} value={sport._id}>
                    {sport.nameVi || sport.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedSport && (
              <div className="form-group">
                <label>Chọn Sân *</label>
                <select
                  name="facilityName"
                  value={formData.facilityName}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn sân --</option>
                  {selectedSport.facilities?.map((facility, index) => (
                    <option key={index} value={facility.name}>
                      {facility.name} {facility.capacity && `(${facility.capacity} người)`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Ngày Đặt *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>

              <div className="form-group">
                <label>Giờ Bắt Đầu *</label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Giờ Kết Thúc *</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  min={formData.startTime}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Họ Tên *</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                required
                placeholder="Nhập họ tên"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Số Điện Thoại *</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  required
                  placeholder="0123456789"
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  required
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Ghi Chú</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Ghi chú thêm (nếu có)"
              />
            </div>

            {selectedSport && (
              <div className="price-summary">
                <h3>Tổng Tiền: {calculatePrice().toLocaleString('vi-VN')}đ</h3>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Xác Nhận Đặt Lịch'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Booking;
