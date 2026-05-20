const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const { auth, owner } = require('../middleware/auth');
const { Facility, Sport, Booking, Review, User } = require('../models');

// All routes require auth + approved owner
router.use(auth, owner);

// ============================================
// FACILITY MANAGEMENT (Quản lý sân)
// ============================================

// GET /api/owner/facilities - Danh sách sân của owner
router.get('/facilities', async (req, res) => {
  try {
    const facilities = await Facility.findAll({
      where: { ownerId: req.user.id },
      include: [{ model: Sport, as: 'sport', attributes: ['id', 'name', 'nameVi', 'emoji'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(facilities);
  } catch (error) {
    console.error('Owner get facilities error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/owner/facilities - Tạo sân mới
router.post('/facilities', async (req, res) => {
  try {
    const { name, sportId, phone, address, image, description, courtCount, pricePerHour, latitude, longitude, mapEmbed, pricingSchedule, status } = req.body;

    if (!name || !sportId || !phone || !address) {
      return res.status(400).json({ message: 'Tên sân, môn thể thao, SĐT và địa chỉ là bắt buộc' });
    }

    const facility = await Facility.create({
      name,
      sportId,
      ownerId: req.user.id,
      phone,
      address,
      image: image || '',
      description: description || '',
      courtCount: courtCount || 1,
      pricePerHour: pricePerHour || 0,
      latitude: latitude || null,
      longitude: longitude || null,
      mapEmbed: mapEmbed || '',
      pricingSchedule: pricingSchedule || [],
      status: status || 'active',
      isApproved: false // Cần admin duyệt
    });

    const result = await Facility.findByPk(facility.id, {
      include: [{ model: Sport, as: 'sport', attributes: ['id', 'name', 'nameVi', 'emoji'] }]
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Owner create facility error:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo sân' });
  }
});

// PUT /api/owner/facilities/:id - Cập nhật sân
router.put('/facilities/:id', async (req, res) => {
  try {
    const facility = await Facility.findOne({
      where: { id: req.params.id, ownerId: req.user.id }
    });

    if (!facility) {
      return res.status(404).json({ message: 'Không tìm thấy sân hoặc bạn không có quyền' });
    }

    const allowedFields = ['name', 'sportId', 'phone', 'address', 'image', 'description', 'courtCount', 'pricePerHour', 'latitude', 'longitude', 'mapEmbed', 'pricingSchedule', 'status'];
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    await facility.update(updateData);

    const result = await Facility.findByPk(facility.id, {
      include: [{ model: Sport, as: 'sport', attributes: ['id', 'name', 'nameVi', 'emoji'] }]
    });

    res.json(result);
  } catch (error) {
    console.error('Owner update facility error:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật sân' });
  }
});

// DELETE /api/owner/facilities/:id - Xóa sân
router.delete('/facilities/:id', async (req, res) => {
  try {
    const facility = await Facility.findOne({
      where: { id: req.params.id, ownerId: req.user.id }
    });

    if (!facility) {
      return res.status(404).json({ message: 'Không tìm thấy sân hoặc bạn không có quyền' });
    }

    await facility.destroy();
    res.json({ message: 'Xóa sân thành công' });
  } catch (error) {
    console.error('Owner delete facility error:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa sân' });
  }
});

// ============================================
// BOOKING MANAGEMENT (Quản lý đặt sân)
// ============================================

// GET /api/owner/bookings - Booking trên sân của owner
router.get('/bookings', async (req, res) => {
  try {
    // Lấy tên các sân owner sở hữu
    const myFacilities = await Facility.findAll({
      where: { ownerId: req.user.id },
      attributes: ['id', 'name']
    });
    const facilityNames = myFacilities.map(f => f.name);

    if (facilityNames.length === 0) {
      return res.json([]);
    }

    const where = { facilityName: { [Op.in]: facilityNames } };

    // Filters
    if (req.query.status) where.status = req.query.status;
    if (req.query.date) where.date = req.query.date;
    if (req.query.facilityName) where.facilityName = req.query.facilityName;

    const bookings = await Booking.findAll({
      where,
      include: [{ model: Sport, as: 'sport', attributes: ['id', 'name', 'nameVi', 'emoji'] }],
      order: [['date', 'DESC'], ['startTime', 'ASC']]
    });

    res.json(bookings);
  } catch (error) {
    console.error('Owner get bookings error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/owner/bookings/:id - Cập nhật trạng thái booking
router.put('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Không tìm thấy booking' });

    // Verify ownership
    const myFacility = await Facility.findOne({
      where: { ownerId: req.user.id, name: booking.facilityName }
    });
    if (!myFacility) return res.status(403).json({ message: 'Bạn không có quyền quản lý booking này' });

    const { status, notes } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    await booking.update(updateData);
    res.json(booking);
  } catch (error) {
    console.error('Owner update booking error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/owner/bookings - Owner tự tạo booking
router.post('/bookings', async (req, res) => {
  try {
    const { facilityName, sportId, customerName, customerPhone, customerEmail, date, startTime, endTime, duration, totalPrice, notes, status } = req.body;

    // Verify owner owns this facility
    const myFacility = await Facility.findOne({
      where: { ownerId: req.user.id, name: facilityName }
    });
    if (!myFacility) return res.status(403).json({ message: 'Bạn không có quyền tạo booking cho sân này' });

    const booking = await Booking.create({
      sportId,
      facilityName,
      facilityAddress: myFacility.address,
      facilityPhone: myFacility.phone,
      customerName,
      customerPhone,
      customerEmail,
      date,
      startTime,
      endTime,
      duration,
      totalPrice,
      notes: notes || '',
      status: status || 'confirmed'
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('Owner create booking error:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo booking' });
  }
});

// DELETE /api/owner/bookings/:id - Xóa/hủy booking
router.delete('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Không tìm thấy booking' });

    const myFacility = await Facility.findOne({
      where: { ownerId: req.user.id, name: booking.facilityName }
    });
    if (!myFacility) return res.status(403).json({ message: 'Không có quyền' });

    await booking.update({ status: 'cancelled' });
    res.json({ message: 'Đã hủy booking' });
  } catch (error) {
    console.error('Owner delete booking error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ============================================
// REVIEW MANAGEMENT (Quản lý bình luận)
// ============================================

// GET /api/owner/reviews - Review trên sân của owner
router.get('/reviews', async (req, res) => {
  try {
    const myFacilities = await Facility.findAll({
      where: { ownerId: req.user.id },
      attributes: ['id']
    });
    const facilityIds = myFacilities.map(f => f.id);

    if (facilityIds.length === 0) return res.json([]);

    const reviews = await Review.findAll({
      where: { facilityId: { [Op.in]: facilityIds } },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Facility, as: 'facility', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(reviews);
  } catch (error) {
    console.error('Owner get reviews error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/owner/reviews/:id - Xóa review trên sân của mình
router.delete('/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: 'Không tìm thấy review' });

    // Verify ownership
    const myFacility = await Facility.findOne({
      where: { id: review.facilityId, ownerId: req.user.id }
    });
    if (!myFacility) return res.status(403).json({ message: 'Không có quyền xóa review này' });

    await review.destroy();
    res.json({ message: 'Xóa review thành công' });
  } catch (error) {
    console.error('Owner delete review error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ============================================
// STATISTICS (Thống kê doanh thu)
// ============================================

// GET /api/owner/stats - Thống kê tổng quan + doanh thu
router.get('/stats', async (req, res) => {
  try {
    const myFacilities = await Facility.findAll({
      where: { ownerId: req.user.id },
      attributes: ['id', 'name']
    });
    const facilityNames = myFacilities.map(f => f.name);

    if (facilityNames.length === 0) {
      return res.json({
        totalFacilities: 0,
        totalBookings: 0,
        totalRevenue: 0,
        todayBookings: 0,
        todayRevenue: 0,
        revenueByDate: [],
        bookingsByStatus: {}
      });
    }

    const bookingWhere = { facilityName: { [Op.in]: facilityNames } };
    const { period, startDate, endDate } = req.query;

    // Date filter
    if (startDate && endDate) {
      bookingWhere.date = { [Op.between]: [startDate, endDate] };
    } else if (period === 'today') {
      bookingWhere.date = new Date().toISOString().split('T')[0];
    } else if (period === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      bookingWhere.date = { [Op.gte]: d.toISOString().split('T')[0] };
    } else if (period === 'month') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      bookingWhere.date = { [Op.gte]: d.toISOString().split('T')[0] };
    }

    // Total stats
    const allBookings = await Booking.findAll({ where: bookingWhere });
    const confirmedBookings = allBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');

    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.totalPrice || 0), 0);

    // Today stats
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = allBookings.filter(b => b.date === today);
    const todayRevenue = todayBookings.filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + parseFloat(b.totalPrice || 0), 0);

    // Bookings by status
    const bookingsByStatus = {};
    allBookings.forEach(b => {
      bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1;
    });

    // Revenue by date (for chart)
    const revenueMap = {};
    confirmedBookings.forEach(b => {
      const d = b.date;
      revenueMap[d] = (revenueMap[d] || 0) + parseFloat(b.totalPrice || 0);
    });
    const revenueByDate = Object.entries(revenueMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Revenue by facility
    const revenueByFacility = {};
    confirmedBookings.forEach(b => {
      revenueByFacility[b.facilityName] = (revenueByFacility[b.facilityName] || 0) + parseFloat(b.totalPrice || 0);
    });

    res.json({
      totalFacilities: myFacilities.length,
      totalBookings: allBookings.length,
      totalRevenue,
      todayBookings: todayBookings.length,
      todayRevenue,
      revenueByDate,
      revenueByFacility,
      bookingsByStatus
    });
  } catch (error) {
    console.error('Owner stats error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/owner/stats/export - Xuất dữ liệu booking dạng JSON (frontend convert Excel)
router.get('/stats/export', async (req, res) => {
  try {
    const myFacilities = await Facility.findAll({
      where: { ownerId: req.user.id },
      attributes: ['name']
    });
    const facilityNames = myFacilities.map(f => f.name);

    const where = { facilityName: { [Op.in]: facilityNames } };
    if (req.query.startDate && req.query.endDate) {
      where.date = { [Op.between]: [req.query.startDate, req.query.endDate] };
    }

    const bookings = await Booking.findAll({
      where,
      include: [{ model: Sport, as: 'sport', attributes: ['nameVi'] }],
      order: [['date', 'DESC']],
      raw: true,
      nest: true
    });

    // Flatten for export
    const exportData = bookings.map(b => ({
      'Ngày': b.date,
      'Sân': b.facilityName,
      'Môn': b.sport?.nameVi || '',
      'Khách hàng': b.customerName,
      'SĐT': b.customerPhone,
      'Giờ bắt đầu': b.startTime,
      'Giờ kết thúc': b.endTime,
      'Thời lượng (giờ)': b.duration,
      'Tổng tiền': b.totalPrice,
      'Trạng thái': b.status,
      'Thanh toán': b.paymentStatus,
      'Ghi chú': b.notes || ''
    }));

    res.json(exportData);
  } catch (error) {
    console.error('Owner export error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ============================================
// DASHBOARD SUMMARY (Tổng quan)
// ============================================

// GET /api/owner/dashboard - Dữ liệu tổng quan cho dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const myFacilities = await Facility.findAll({
      where: { ownerId: req.user.id },
      include: [{ model: Sport, as: 'sport', attributes: ['id', 'name', 'nameVi', 'emoji'] }]
    });

    const facilityNames = myFacilities.map(f => f.name);
    const facilityIds = myFacilities.map(f => f.id);

    const today = new Date().toISOString().split('T')[0];

    // Today's bookings
    const todayBookings = facilityNames.length > 0 ? await Booking.findAll({
      where: { facilityName: { [Op.in]: facilityNames }, date: today },
      order: [['startTime', 'ASC']]
    }) : [];

    // Recent reviews
    const recentReviews = facilityIds.length > 0 ? await Review.findAll({
      where: { facilityId: { [Op.in]: facilityIds } },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'avatar'] },
        { model: Facility, as: 'facility', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    }) : [];

    // Average rating
    const avgRating = facilityIds.length > 0
      ? await Review.findOne({
          where: { facilityId: { [Op.in]: facilityIds } },
          attributes: [[fn('AVG', col('rating')), 'avg'], [fn('COUNT', col('id')), 'count']],
          raw: true
        })
      : { avg: 0, count: 0 };

    res.json({
      facilities: myFacilities,
      todayBookings,
      recentReviews,
      avgRating: {
        average: avgRating.avg ? parseFloat(avgRating.avg).toFixed(1) : '0.0',
        count: parseInt(avgRating.count) || 0
      }
    });
  } catch (error) {
    console.error('Owner dashboard error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
