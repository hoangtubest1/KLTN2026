import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import './BookingsList.css';

const BookingsList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchBookings();
  }, [filterDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // Fetch all bookings (will be filtered by user on backend if authenticated)
      const response = await axios.get('http://localhost:5000/api/bookings');
      // Filter by date on frontend
      const filteredBookings = response.data.filter(booking => {
        const bookingDate = format(new Date(booking.date), 'yyyy-MM-dd');
        return bookingDate === filterDate;
      });
      setBookings(filteredBookings);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      case 'completed':
        return 'status-completed';
      default:
        return '';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Đã Xác Nhận';
      case 'pending':
        return 'Chờ Xác Nhận';
      case 'cancelled':
        return 'Đã Hủy';
      case 'completed':
        return 'Hoàn Thành';
      default:
        return status;
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
    <div className="bookings-list-page">
      <div className="container">
        <div className="bookings-header">
          <h2>Danh Sách Lịch Đã Đặt</h2>
          <div className="date-filter">
            <label>Lọc theo ngày:</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="no-bookings">
            <p>Không có lịch đặt nào cho ngày này.</p>
          </div>
        ) : (
          <div className="bookings-grid">
            {bookings.map((booking) => (
              <div key={booking._id} className="booking-card">
                <div className="booking-header">
                  <h3>{booking.sportId?.nameVi || booking.sportId?.name}</h3>
                  <span className={`status ${getStatusColor(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                </div>
                
                <div className="booking-info">
                  <div className="info-item">
                    <strong>Sân:</strong> {booking.facilityName}
                  </div>
                  <div className="info-item">
                    <strong>Ngày:</strong> {format(new Date(booking.date), 'dd/MM/yyyy')}
                  </div>
                  <div className="info-item">
                    <strong>Thời gian:</strong> {booking.startTime} - {booking.endTime}
                  </div>
                  <div className="info-item">
                    <strong>Khách hàng:</strong> {booking.customerName}
                  </div>
                  <div className="info-item">
                    <strong>SĐT:</strong> {booking.customerPhone}
                  </div>
                  <div className="info-item">
                    <strong>Email:</strong> {booking.customerEmail}
                  </div>
                  {booking.notes && (
                    <div className="info-item">
                      <strong>Ghi chú:</strong> {booking.notes}
                    </div>
                  )}
                  <div className="info-item price">
                    <strong>Tổng tiền:</strong> {booking.totalPrice?.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsList;
