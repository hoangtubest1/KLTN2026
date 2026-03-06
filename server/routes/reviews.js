const express = require('express');
const router = express.Router();
const { Review, User, Facility } = require('../models');
const { auth } = require('../middleware/auth');

// GET - Lấy tất cả review của 1 sân (public)
router.get('/facility/:facilityId', async (req, res) => {
    try {
        const reviews = await Review.findAll({
            where: { facilityId: req.params.facilityId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email']
            }],
            order: [['createdAt', 'DESC']]
        });

        // Tính rating trung bình
        const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : null;

        res.json({ reviews, avgRating, total: reviews.length });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: error.message });
    }
});

// POST - Tạo review mới (yêu cầu đăng nhập)
router.post('/', auth, async (req, res) => {
    try {
        const { facilityId, rating, comment } = req.body;
        const userId = req.user.id; // auth middleware assigns full user object

        if (!facilityId || !rating) {
            return res.status(400).json({ message: 'facilityId và rating là bắt buộc' });
        }

        // Kiểm tra sân có tồn tại không
        const facility = await Facility.findByPk(facilityId);
        if (!facility) return res.status(404).json({ message: 'Sân không tồn tại' });

        // Kiểm tra user đã review sân này chưa
        const existing = await Review.findOne({ where: { userId, facilityId } });
        if (existing) {
            return res.status(400).json({ message: 'Bạn đã đánh giá sân này rồi' });
        }

        const review = await Review.create({ userId, facilityId, rating, comment });

        // Trả về review kèm thông tin user
        const fullReview = await Review.findByPk(review.id, {
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
        });

        res.status(201).json(fullReview);
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(400).json({ message: error.message });
    }
});

// PUT - Sửa review (chỉ chủ review)
router.put('/:id', auth, async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);
        if (!review) return res.status(404).json({ message: 'Không tìm thấy review' });
        if (review.userId !== req.user.id) return res.status(403).json({ message: 'Không có quyền sửa review này' });

        await review.update({ rating: req.body.rating, comment: req.body.comment });

        const updated = await Review.findByPk(review.id, {
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
        });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE - Xóa review (chủ review hoặc admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);
        if (!review) return res.status(404).json({ message: 'Không tìm thấy review' });
        if (review.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Không có quyền xóa review này' });
        }
        await review.destroy();
        res.json({ message: 'Đã xóa review' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
