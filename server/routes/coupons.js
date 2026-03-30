const express = require('express');
const router = express.Router();
const { Coupon } = require('../models');
const { auth, admin } = require('../middleware/auth');
const { Op } = require('sequelize');

// ==========================================
// VALIDATE COUPON FOR CHECKOUT (PUBLIC/AUTH)
// ==========================================
router.post('/validate', auth, async (req, res) => {
  try {
    const { code, totalPrice } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Vui lòng nhập mã giảm giá' });
    }
    if (!totalPrice || totalPrice <= 0) {
      return res.status(400).json({ message: 'Đơn hàng không hợp lệ' });
    }

    const coupon = await Coupon.findOne({ where: { code } });
    if (!coupon) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
    }
    if (!coupon.isActive) {
      return res.status(400).json({ message: 'Mã giảm giá đã bị khóa' });
    }

    // Check dates by string comparison YYYY-MM-DD in Vietnam Time
    const localDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
    
    const startDateStr = typeof coupon.startDate === 'string' ? coupon.startDate.split('T')[0] : coupon.startDate;
    const endDateStr = typeof coupon.endDate === 'string' ? coupon.endDate.split('T')[0] : coupon.endDate;
    
    if (localDateStr < startDateStr) {
      return res.status(400).json({ message: 'Mã giảm giá chưa đến ngày áp dụng' });
    }
    if (localDateStr > endDateStr) {
      return res.status(400).json({ message: 'Mã giảm giá đã hết hạn' });
    }

    // Check usage limits
    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({ message: 'Mã giảm giá đã hết lượt sử dụng' });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percent') {
      discountAmount = (totalPrice * coupon.value) / 100;
    } else {
      discountAmount = coupon.value;
    }

    // Discount cannot exceed total price
    if (discountAmount > totalPrice) {
      discountAmount = totalPrice;
    }

    res.json({
      message: 'Áp dụng mã thành công',
      couponCode: coupon.code,
      discountAmount: discountAmount,
      type: coupon.type,
      value: coupon.value
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ message: 'Lỗi server khi kiểm tra mã' });
  }
});

// ==========================================
// ADMIN: Lấy tất cả mã giảm giá
// ==========================================
router.get('/', [auth, admin], async (req, res) => {
  try {
    const coupons = await Coupon.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// ADMIN: Tạo mới
// ==========================================
router.post('/', [auth, admin], async (req, res) => {
  try {
    const { code, name, type, value, maxUses, startDate, endDate, isActive } = req.body;
    
    const existing = await Coupon.findOne({ where: { code } });
    if (existing) {
      return res.status(400).json({ message: 'Mã giảm giá này đã tồn tại' });
    }

    const coupon = await Coupon.create({
      code,
      name,
      type,
      value,
      maxUses: maxUses ? parseInt(maxUses) : null,
      startDate,
      endDate,
      isActive: isActive !== undefined ? isActive : true
    });
    
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// ADMIN: Cập nhật
// ==========================================
router.put('/:id', [auth, admin], async (req, res) => {
  try {
    const { name, type, value, maxUses, startDate, endDate, isActive } = req.body;
    
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
    }

    // Chỉ cho phép update những trường có giá trị truyền lên
    await coupon.update({
      name: name !== undefined ? name : coupon.name,
      type: type !== undefined ? type : coupon.type,
      value: value !== undefined ? value : coupon.value,
      maxUses: maxUses !== undefined ? (maxUses ? parseInt(maxUses) : null) : coupon.maxUses,
      startDate: startDate !== undefined ? startDate : coupon.startDate,
      endDate: endDate !== undefined ? endDate : coupon.endDate,
      isActive: isActive !== undefined ? isActive : coupon.isActive
    });

    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// ADMIN: Xóa
// ==========================================
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
    }
    
    await coupon.destroy();
    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
