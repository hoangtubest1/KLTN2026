const express = require('express');
const router = express.Router();
const { News } = require('../models');
const { auth } = require('../middleware/auth');

// GET /news - public, get all news (newest first)
router.get('/', async (req, res) => {
    try {
        const news = await News.findAll({ order: [['publishedAt', 'DESC']] });
        res.json(news);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /news/:id - public, get single news
router.get('/:id', async (req, res) => {
    try {
        const item = await News.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /news - admin only, create news
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền' });
        const { title, summary, content, image, publishedAt } = req.body;
        if (!title) return res.status(400).json({ message: 'Tiêu đề là bắt buộc' });
        const item = await News.create({ title, summary, content, image, publishedAt: publishedAt || new Date() });
        res.status(201).json(item);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /news/:id - admin only, update news
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền' });
        const item = await News.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
        await item.update(req.body);
        res.json(item);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /news/:id - admin only
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Không có quyền' });
        const item = await News.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
        await item.destroy();
        res.json({ message: 'Đã xóa bài viết' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
