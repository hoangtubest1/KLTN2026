const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/auth');
const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../models');
const Booking = require('../models/Booking');
const Facility = require('../models/Facility');
const Sport = require('../models/Sport');
const User = require('../models/User');
const Review = require('../models/Review');
const News = require('../models/News');
const Coupon = require('../models/Coupon');
const { GoogleAuth } = require('google-auth-library');

// Vertex AI Configuration
const VERTEX_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'project-b6d82976-1196-4bef-8f6';
const VERTEX_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const VERTEX_TIMEOUT_MS = 45000; // 45 second timeout for complex admin queries

const googleAuth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform'
});

// ============================================================
// Vertex AI call (reused pattern from chatbot.js)
// ============================================================
async function callVertexAI(systemInstruction, prompt, history = []) {
    const client = await googleAuth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse.token;

    if (!accessToken) throw new Error('Failed to get access token');

    const contents = [
        ...history.filter(h => h.role && h.content).map(h => ({
            role: h.role === 'bot' ? 'model' : 'user',
            parts: [{ text: h.content }]
        })),
        { role: 'user', parts: [{ text: prompt }] }
    ];

    const requestBody = {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.4,
            topP: 0.85,
            topK: 40
        }
    };

    const model = 'gemini-2.5-flash';
    const url = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_PROJECT_ID}/locations/${VERTEX_LOCATION}/publishers/google/models/${model}:generateContent`;

    console.log(`🤖 [Admin AI] Calling Vertex AI: ${model}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), VERTEX_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Vertex AI error ${response.status}: ${errorData?.error?.message || response.statusText}`);
        }

        const parsed = await response.json();
        const parts = parsed?.candidates?.[0]?.content?.parts;
        if (parts && parts.length > 0) {
            const text = parts.filter(p => p.text).map(p => p.text).join('');
            if (text) return text;
        }
        throw new Error('Empty response from Vertex AI');
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') throw new Error(`Vertex AI timeout after ${VERTEX_TIMEOUT_MS}ms`);
        throw err;
    }
}

// ============================================================
// Gather comprehensive admin analytics from database
// ============================================================
async function getAdminAnalytics() {
    const now = new Date();
    now.setHours(now.getHours() + 7); // GMT+7
    const today = now.toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7); // YYYY-MM
    const thisYear = today.substring(0, 4);

    try {
        // --- Core stats ---
        const [
            totalUsers, totalFacilities, totalBookings, totalSports,
            pendingBookings, confirmedBookings, completedBookings, cancelledBookings,
            totalNews, totalCoupons
        ] = await Promise.all([
            User.count(),
            Facility.count(),
            Booking.count(),
            Sport.count(),
            Booking.count({ where: { status: 'pending' } }),
            Booking.count({ where: { status: 'confirmed' } }),
            Booking.count({ where: { status: 'completed' } }),
            Booking.count({ where: { status: 'cancelled' } }),
            News.count(),
            Coupon.count()
        ]);

        // --- Revenue ---
        const revenueAll = await Booking.findAll({
            where: { status: { [Op.in]: ['confirmed', 'completed'] } },
            attributes: [[fn('SUM', col('totalPrice')), 'total']],
            raw: true
        });
        const totalRevenue = parseFloat(revenueAll[0]?.total || 0);

        // Revenue this month
        const revenueMonth = await Booking.findAll({
            where: {
                status: { [Op.in]: ['confirmed', 'completed'] },
                date: { [Op.gte]: `${thisMonth}-01` }
            },
            attributes: [[fn('SUM', col('totalPrice')), 'total']],
            raw: true
        });
        const monthRevenue = parseFloat(revenueMonth[0]?.total || 0);

        // Today's bookings
        const todayBookings = await Booking.count({ where: { date: today } });
        const todayRevenue = await Booking.findAll({
            where: { date: today, status: { [Op.in]: ['confirmed', 'completed'] } },
            attributes: [[fn('SUM', col('totalPrice')), 'total']],
            raw: true
        });

        // --- Top facilities by bookings ---
        const topFacilities = await Booking.findAll({
            where: { status: { [Op.in]: ['confirmed', 'completed'] } },
            attributes: ['facilityName', [fn('COUNT', col('id')), 'bookingCount'], [fn('SUM', col('totalPrice')), 'revenue']],
            group: ['facilityName'],
            order: [[fn('COUNT', col('id')), 'DESC']],
            limit: 10,
            raw: true
        });

        // --- User role breakdown ---
        const userRoles = await User.findAll({
            attributes: ['role', [fn('COUNT', col('id')), 'count']],
            group: ['role'],
            raw: true
        });

        // --- Sports popularity ---
        const sportPopularity = await Booking.findAll({
            where: { status: { [Op.in]: ['confirmed', 'completed'] } },
            include: [{ model: Sport, as: 'sport', attributes: ['name', 'nameVi'] }],
            attributes: ['sportId', [fn('COUNT', col('Booking.id')), 'bookingCount']],
            group: ['sportId', 'sport.id', 'sport.name', 'sport.nameVi'],
            order: [[fn('COUNT', col('Booking.id')), 'DESC']],
            raw: true
        });

        // --- Recent bookings (last 5) ---
        const recentBookings = await Booking.findAll({
            include: [{ model: Sport, as: 'sport', attributes: ['nameVi', 'name'] }],
            order: [['createdAt', 'DESC']],
            limit: 5,
            raw: true
        });

        // --- Facility status ---
        const activeFacilities = await Facility.count({ where: { status: 'active' } });
        const inactiveFacilities = totalFacilities - activeFacilities;

        // --- Reviews summary ---
        const avgRating = await Review.findAll({
            attributes: [[fn('AVG', col('rating')), 'avg'], [fn('COUNT', col('id')), 'count']],
            raw: true
        });

        // --- Owner requests ---
        const pendingOwners = await User.count({ where: { role: 'owner', ownerStatus: 'pending' } });

        return {
            today, thisMonth,
            totalUsers, totalFacilities, totalBookings, totalSports,
            pendingBookings, confirmedBookings, completedBookings, cancelledBookings,
            totalRevenue, monthRevenue,
            todayBookings, todayRevenue: parseFloat(todayRevenue[0]?.total || 0),
            topFacilities, userRoles, sportPopularity, recentBookings,
            activeFacilities, inactiveFacilities,
            avgRating: parseFloat(avgRating[0]?.avg || 0).toFixed(1),
            totalReviews: parseInt(avgRating[0]?.count || 0),
            totalNews, totalCoupons, pendingOwners
        };
    } catch (err) {
        console.error('[Admin AI] Analytics error:', err.message);
        return null;
    }
}

// ============================================================
// Build admin system instruction
// ============================================================
function buildAdminSystemInstruction() {
    return `# VAI TRÒ
Bạn là **Trợ lý AI Quản trị** dành riêng cho admin hệ thống đặt sân thể thao **Timsan247**. Bạn có quyền truy cập vào toàn bộ dữ liệu hệ thống.

# NĂNG LỰC CHUYÊN SÂU
Bạn có thể hỗ trợ admin về:

## 1. Phân Tích Kinh Doanh
- Phân tích doanh thu theo ngày/tháng/năm
- So sánh hiệu suất giữa các sân, các môn thể thao
- Xác định xu hướng đặt sân (giờ cao điểm, ngày đông khách)
- Tính toán tỷ lệ chuyển đổi (pending → confirmed)
- Đề xuất chiến lược giá cả

## 2. Quản Lý Vận Hành
- Tình trạng sân bãi (active/inactive)
- Đánh giá và feedback của khách hàng
- Quản lý người dùng và phân quyền
- Xử lý khiếu nại và hoàn tiền
- Quản lý mã giảm giá hiệu quả

## 3. Tư Vấn Chiến Lược
- Gợi ý cải thiện dịch vụ dựa trên data
- Marketing và khuyến mãi
- Mở rộng sân bãi
- Tối ưu hóa pricing
- Quản lý chủ sân (owner)

## 4. Hỗ Trợ Kỹ Thuật
- Giải thích các tính năng hệ thống
- Hướng dẫn sử dụng dashboard admin
- Xử lý các vấn đề thường gặp

# QUY TẮC
1. **Trả lời bằng tiếng Việt**, chuyên nghiệp nhưng thân thiện
2. **Dựa trên dữ liệu thực** từ database — KHÔNG bịa số liệu
3. Sử dụng **markdown** (bảng, bullet, bold) để trình bày rõ ràng
4. Khi phân tích, đưa ra **con số cụ thể** và **nhận xét / khuyến nghị**
5. Nếu thiếu dữ liệu, nói rõ và gợi ý cách thu thập thêm
6. **Bảo mật**: Không tiết lộ thông tin nhạy cảm ra ngoài (mật khẩu, API key)
7. Sử dụng emoji phù hợp để tạo trực quan`;
}

// ============================================================
// Build admin data context
// ============================================================
function buildAdminDataContext(analytics) {
    if (!analytics) return '\n⚠️ Không thể tải dữ liệu phân tích.\n';

    let ctx = `\n# 📊 DỮ LIỆU HỆ THỐNG TIMSAN247 (${analytics.today})\n\n`;

    // Overview
    ctx += `## Tổng Quan\n`;
    ctx += `| Chỉ số | Giá trị |\n|---|---|\n`;
    ctx += `| 👥 Tổng người dùng | ${analytics.totalUsers} |\n`;
    ctx += `| 🏟️ Tổng sân bãi | ${analytics.totalFacilities} (${analytics.activeFacilities} active, ${analytics.inactiveFacilities} inactive) |\n`;
    ctx += `| 🏃 Môn thể thao | ${analytics.totalSports} |\n`;
    ctx += `| 📅 Tổng booking | ${analytics.totalBookings} |\n`;
    ctx += `| 📰 Tin tức | ${analytics.totalNews} |\n`;
    ctx += `| 🏷️ Mã giảm giá | ${analytics.totalCoupons} |\n`;
    ctx += `| ⭐ Đánh giá trung bình | ${analytics.avgRating}/5 (${analytics.totalReviews} đánh giá) |\n`;
    ctx += `| 🏠 Chủ sân chờ duyệt | ${analytics.pendingOwners} |\n\n`;

    // Booking breakdown
    ctx += `## Trạng Thái Booking\n`;
    ctx += `| Trạng thái | Số lượng |\n|---|---|\n`;
    ctx += `| ⏳ Chờ xác nhận | ${analytics.pendingBookings} |\n`;
    ctx += `| ✅ Đã xác nhận | ${analytics.confirmedBookings} |\n`;
    ctx += `| 🏆 Hoàn thành | ${analytics.completedBookings} |\n`;
    ctx += `| ❌ Đã hủy | ${analytics.cancelledBookings} |\n\n`;

    // Revenue
    ctx += `## 💰 Doanh Thu\n`;
    ctx += `- **Tổng doanh thu**: ${analytics.totalRevenue.toLocaleString('vi-VN')}đ\n`;
    ctx += `- **Doanh thu tháng ${analytics.thisMonth}**: ${analytics.monthRevenue.toLocaleString('vi-VN')}đ\n`;
    ctx += `- **Hôm nay (${analytics.today})**: ${analytics.todayBookings} booking, ${analytics.todayRevenue.toLocaleString('vi-VN')}đ\n\n`;

    // Top facilities
    if (analytics.topFacilities.length > 0) {
        ctx += `## 🏆 Top Sân Được Đặt Nhiều\n`;
        ctx += `| # | Sân | Booking | Doanh thu |\n|---|---|---|---|\n`;
        analytics.topFacilities.forEach((f, i) => {
            ctx += `| ${i + 1} | ${f.facilityName} | ${f.bookingCount} | ${parseFloat(f.revenue || 0).toLocaleString('vi-VN')}đ |\n`;
        });
        ctx += '\n';
    }

    // Sport popularity
    if (analytics.sportPopularity.length > 0) {
        ctx += `## 🏃 Môn Thể Thao Phổ Biến\n`;
        analytics.sportPopularity.forEach(s => {
            ctx += `- **${s['sport.nameVi'] || s['sport.name'] || 'N/A'}**: ${s.bookingCount} lượt đặt\n`;
        });
        ctx += '\n';
    }

    // User roles
    if (analytics.userRoles.length > 0) {
        ctx += `## 👥 Phân Quyền Người Dùng\n`;
        analytics.userRoles.forEach(r => {
            const label = r.role === 'admin' ? 'Admin' : r.role === 'owner' ? 'Chủ sân' : 'Người dùng';
            ctx += `- ${label}: ${r.count} người\n`;
        });
        ctx += '\n';
    }

    // Recent bookings
    if (analytics.recentBookings.length > 0) {
        ctx += `## 📋 5 Booking Gần Nhất\n`;
        analytics.recentBookings.forEach(b => {
            ctx += `- #${b.id} | ${b['sport.nameVi'] || b['sport.name'] || ''} | ${b.facilityName} | ${b.date} ${b.startTime}-${b.endTime} | ${b.status} | ${parseFloat(b.totalPrice || 0).toLocaleString('vi-VN')}đ\n`;
        });
        ctx += '\n';
    }

    return ctx;
}

// ============================================================
// POST /api/admin/ai-chat
// ============================================================
router.post('/ai-chat', auth, admin, async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Tin nhắn không được để trống' });
        }

        console.log(`\n🤖 [Admin AI] Query from ${req.user.name}: ${message.substring(0, 100)}...`);

        // Gather real-time analytics
        const analytics = await getAdminAnalytics();

        const systemInstruction = buildAdminSystemInstruction();
        const dataContext = buildAdminDataContext(analytics);
        const userPrompt = `${dataContext}\n---\nAdmin hỏi: ${message.trim()}`;

        try {
            const reply = await callVertexAI(systemInstruction, userPrompt, history);
            console.log(`✅ [Admin AI] Response generated (${reply.length} chars)`);
            return res.json({ reply, source: 'vertex-ai' });
        } catch (aiError) {
            console.error(`❌ [Admin AI] Vertex AI error:`, aiError.message);

            // Fallback: basic rule-based response
            const fallback = buildFallbackResponse(message, analytics);
            return res.json({ reply: fallback, source: 'fallback' });
        }
    } catch (error) {
        console.error('[Admin AI] Error:', error);
        res.status(500).json({ error: 'Lỗi xử lý', reply: '⚠️ Đã có lỗi. Vui lòng thử lại.' });
    }
});

// ============================================================
// Fallback rule-based responses
// ============================================================
function buildFallbackResponse(message, analytics) {
    const msg = message.toLowerCase();

    if (!analytics) {
        return '⚠️ Không thể tải dữ liệu hệ thống. Vui lòng thử lại sau.';
    }

    if (/doanh thu|revenue|tiền/.test(msg)) {
        return `💰 **Tổng quan doanh thu:**\n\n` +
            `- Tổng doanh thu: **${analytics.totalRevenue.toLocaleString('vi-VN')}đ**\n` +
            `- Tháng này: **${analytics.monthRevenue.toLocaleString('vi-VN')}đ**\n` +
            `- Hôm nay: **${analytics.todayRevenue.toLocaleString('vi-VN')}đ** (${analytics.todayBookings} booking)\n\n` +
            `Bạn muốn phân tích chi tiết hơn về khoảng thời gian nào?`;
    }

    if (/booking|đặt sân|đặt lịch/.test(msg)) {
        return `📅 **Thống kê booking:**\n\n` +
            `- Tổng: **${analytics.totalBookings}** booking\n` +
            `- ⏳ Chờ xác nhận: ${analytics.pendingBookings}\n` +
            `- ✅ Đã xác nhận: ${analytics.confirmedBookings}\n` +
            `- 🏆 Hoàn thành: ${analytics.completedBookings}\n` +
            `- ❌ Đã hủy: ${analytics.cancelledBookings}`;
    }

    if (/user|người dùng|tài khoản/.test(msg)) {
        return `👥 Hệ thống có **${analytics.totalUsers}** người dùng.\n\n` +
            analytics.userRoles.map(r => {
                const label = r.role === 'admin' ? 'Admin' : r.role === 'owner' ? 'Chủ sân' : 'Người dùng';
                return `- ${label}: ${r.count}`;
            }).join('\n');
    }

    return `🤖 Xin chào Admin! Tôi là **Trợ lý AI Quản trị** của Timsan247.\n\n` +
        `Tôi có thể giúp bạn:\n` +
        `• 📊 Phân tích doanh thu và hiệu suất kinh doanh\n` +
        `• 📅 Thống kê booking và tình trạng sân\n` +
        `• 👥 Quản lý người dùng\n` +
        `• 💡 Tư vấn chiến lược phát triển\n` +
        `• 🔧 Hỗ trợ vận hành hệ thống\n\n` +
        `Bạn muốn tìm hiểu về vấn đề gì?`;
}

module.exports = router;
