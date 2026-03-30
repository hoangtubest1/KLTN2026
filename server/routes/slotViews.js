const express = require('express');
const router = express.Router();

// In-memory store: key = "facilityId:date:slotStart" → { sessionId, expiresAt }
const LOCK_TTL_MS = 60 * 1000; // 60s TTL
const views = new Map();

// Cleanup expired entries every 30s
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of views.entries()) {
        if (val.expiresAt < now) views.delete(key);
    }
}, 30000);

// ──────────────────────────────────────────────────────────────────────────────
// POST / — lock một hoặc nhiều slot cho một session
// Body: { facilityId, date, slotStart, sessionId }
//    OR { facilityId, date, slotStarts: ['08:00','10:00'], sessionId }
// ──────────────────────────────────────────────────────────────────────────────
router.post('/', (req, res) => {
    const { facilityId, date, slotStart, slotStarts, sessionId } = req.body;
    if (!facilityId || !date || !sessionId) {
        return res.status(400).json({ message: 'Missing required fields: facilityId, date, sessionId' });
    }

    const starts = slotStarts && Array.isArray(slotStarts) ? slotStarts : (slotStart ? [slotStart] : []);
    if (starts.length === 0) {
        return res.status(400).json({ message: 'Missing slotStart or slotStarts' });
    }

    const now = Date.now();
    const MAX_LOCK_TIME = 5 * 60 * 1000; // 5 phút

    starts.forEach(s => {
        const key = `${facilityId}:${date}:${s}`;
        const existing = views.get(key);
        // Chỉ lock nếu chưa ai khác lock hoặc chính session này đã lock
        if (!existing || existing.sessionId === sessionId || existing.expiresAt < now) {
            // Nếu session này đã có lock trước đó, giữ nguyên lockedAt, ngược lại set là now
            const lockedAt = (existing && existing.sessionId === sessionId) ? existing.lockedAt : now;
            
            // Nếu đã giữ quá 5 phút thì không cho gia hạn thêm
            if (now - lockedAt > MAX_LOCK_TIME) {
                views.delete(key);
            } else {
                views.set(key, { sessionId, lockedAt, expiresAt: now + LOCK_TTL_MS });
            }
        }
    });

    res.json({ ok: true });
});

// ──────────────────────────────────────────────────────────────────────────────
// PATCH / — heartbeat: gia hạn TTL của slot(s) đang bị lock bởi session này
// Body: { facilityId, date, slotStart?, slotStarts?, sessionId }
// ──────────────────────────────────────────────────────────────────────────────
router.patch('/', (req, res) => {
    const { facilityId, date, slotStart, slotStarts, sessionId } = req.body;
    if (!facilityId || !date || !sessionId) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    const starts = slotStarts && Array.isArray(slotStarts) ? slotStarts : (slotStart ? [slotStart] : []);
    const now = Date.now();
    const MAX_LOCK_TIME = 5 * 60 * 1000;

    starts.forEach(s => {
        const key = `${facilityId}:${date}:${s}`;
        const existing = views.get(key);
        if (existing && existing.sessionId === sessionId) {
            // Kiểm tra xem đã vượt quá 5 phút từ khi khóa lần đầu chưa
            if (now - existing.lockedAt > MAX_LOCK_TIME) {
                views.delete(key);
            } else {
                views.set(key, { ...existing, expiresAt: now + LOCK_TTL_MS });
            }
        }
    });

    res.json({ ok: true });
});

// ──────────────────────────────────────────────────────────────────────────────
// DELETE / — giải phóng lock
// Body: { facilityId, date, slotStart?, slotStarts?, sessionId }
// ──────────────────────────────────────────────────────────────────────────────
router.delete('/', (req, res) => {
    const { facilityId, date, slotStart, slotStarts, sessionId } = req.body;
    if (!facilityId || !date || !sessionId) {
        return res.json({ ok: true }); // silent fail ok
    }

    const starts = slotStarts && Array.isArray(slotStarts) ? slotStarts : (slotStart ? [slotStart] : []);

    starts.forEach(s => {
        const key = `${facilityId}:${date}:${s}`;
        const entry = views.get(key);
        if (entry && entry.sessionId === sessionId) views.delete(key);
    });

    res.json({ ok: true });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET / — slots đang bị lock bởi SESSION KHÁC
// Query: facilityId, date, sessionId (optional)
// Returns: ['08:00', '10:00', ...]
// ──────────────────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
    const { facilityId, date, sessionId } = req.query;
    if (!facilityId || !date) return res.json([]);

    const now = Date.now();
    const prefix = `${facilityId}:${date}:`;
    const locked = [];

    for (const [key, val] of views.entries()) {
        if (
            key.startsWith(prefix) &&
            val.expiresAt > now &&
            val.sessionId !== sessionId   // chỉ trả về slot của người KHÁC
        ) {
            locked.push(key.replace(prefix, ''));
        }
    }

    res.json(locked);
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /beacon — nhận navigator.sendBeacon() khi user đóng tab
// Beacon gửi text/plain hoặc application/json blob
// ──────────────────────────────────────────────────────────────────────────────
router.post('/beacon', (req, res) => {
    try {
        const { facilityId, date, slotStart, slotStarts, sessionId } = req.body;
        if (!facilityId || !date || !sessionId) return res.status(200).end();

        const starts = slotStarts && Array.isArray(slotStarts)
            ? slotStarts
            : (slotStart ? [slotStart] : []);

        starts.forEach(s => {
            const key = `${facilityId}:${date}:${s}`;
            const entry = views.get(key);
            if (entry && entry.sessionId === sessionId) views.delete(key);
        });
    } catch (_) { /* beacon không cần response chính xác */ }
    res.status(204).end();
});

module.exports = router;
