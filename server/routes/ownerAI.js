const express = require('express');
const router = express.Router();
const { Op, fn, col } = require('sequelize');
const { auth, owner } = require('../middleware/auth');
const { Facility, Sport, Booking, Review, User } = require('../models');
const { GoogleAuth } = require('google-auth-library');

// All routes require auth + approved owner
router.use(auth, owner);

// ============================================================
// WEATHER FORECAST (OpenWeatherMap API)
// ============================================================

// GET /api/owner/weather?lat=..&lon=.. or default to HCM City
router.get('/weather', async (req, res) => {
  try {
    const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
    if (!WEATHER_API_KEY) {
      return res.status(500).json({ message: 'Weather API key chưa được cấu hình' });
    }

    // Try to get coordinates from owner's first facility, or default HCM
    let lat = parseFloat(req.query.lat) || 0;
    let lon = parseFloat(req.query.lon) || 0;
    let cityName = req.query.city || '';

    if (!lat || !lon) {
      // Try to get from owner's facility
      const myFacility = await Facility.findOne({
        where: { ownerId: req.user.id },
        attributes: ['latitude', 'longitude', 'address']
      });

      if (myFacility?.latitude && myFacility?.longitude) {
        lat = myFacility.latitude;
        lon = myFacility.longitude;
        cityName = myFacility.address || '';
      } else {
        // Default: Ho Chi Minh City
        lat = 10.8231;
        lon = 106.6297;
        cityName = 'Hồ Chí Minh';
      }
    }

    // Current weather
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=vi`;
    const currentRes = await fetch(currentUrl);
    const currentData = await currentRes.json();

    // 5-day/3-hour forecast
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=vi`;
    const forecastRes = await fetch(forecastUrl);
    const forecastData = await forecastRes.json();

    // Process forecast: Get daily summary (one entry per day at noon or closest)
    const dailyForecast = [];
    const dateMap = {};

    if (forecastData.list) {
      forecastData.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        const hour = parseInt(item.dt_txt.split(' ')[1].split(':')[0]);

        if (!dateMap[date] || Math.abs(hour - 12) < Math.abs(dateMap[date].hour - 12)) {
          dateMap[date] = {
            hour,
            date,
            temp: Math.round(item.main.temp * 10) / 10,
            tempMin: Math.round(item.main.temp_min * 10) / 10,
            tempMax: Math.round(item.main.temp_max * 10) / 10,
            humidity: item.main.humidity,
            description: item.weather[0]?.description || '',
            icon: item.weather[0]?.icon || '',
            main: item.weather[0]?.main || '',
            windSpeed: item.wind?.speed || 0,
            rainProb: Math.round((item.pop || 0) * 100), // probability of precipitation (%)
            rain3h: item.rain?.['3h'] || 0
          };
        }
      });

      Object.values(dateMap).forEach(d => dailyForecast.push(d));
      dailyForecast.sort((a, b) => a.date.localeCompare(b.date));
    }

    res.json({
      current: {
        temp: Math.round(currentData.main?.temp * 10) / 10,
        feelsLike: Math.round(currentData.main?.feels_like * 10) / 10,
        humidity: currentData.main?.humidity,
        description: currentData.weather?.[0]?.description || '',
        icon: currentData.weather?.[0]?.icon || '',
        main: currentData.weather?.[0]?.main || '',
        windSpeed: currentData.wind?.speed || 0,
        city: currentData.name || cityName
      },
      forecast: dailyForecast.slice(0, 5), // 5 days
      location: { lat, lon, city: currentData.name || cityName }
    });
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({ message: 'Lỗi lấy dữ liệu thời tiết' });
  }
});

// ============================================================
// BOOKING PREDICTION
// ============================================================

// GET /api/owner/booking-prediction - Dự báo lượng đặt sân 7 ngày tới
router.get('/booking-prediction', async (req, res) => {
  try {
    const myFacilities = await Facility.findAll({
      where: { ownerId: req.user.id },
      attributes: ['id', 'name']
    });
    const facilityNames = myFacilities.map(f => f.name);

    if (facilityNames.length === 0) {
      return res.json({ predictions: [], history: [] });
    }

    // Get historical booking data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    const bookings = await Booking.findAll({
      where: {
        facilityName: { [Op.in]: facilityNames },
        date: { [Op.gte]: startDate },
        status: { [Op.in]: ['confirmed', 'completed', 'pending'] }
      },
      attributes: ['date', 'facilityName', 'startTime', 'endTime', 'totalPrice', 'status'],
      order: [['date', 'ASC']]
    });

    // Group by date
    const dailyData = {};
    bookings.forEach(b => {
      const d = b.date;
      if (!dailyData[d]) dailyData[d] = { count: 0, revenue: 0 };
      dailyData[d].count++;
      dailyData[d].revenue += parseFloat(b.totalPrice || 0);
    });

    // Calculate day-of-week averages for prediction
    const dowCounts = {}; // dayOfWeek -> [counts]
    const dowRevenues = {};
    Object.entries(dailyData).forEach(([date, data]) => {
      const dow = new Date(date).getDay(); // 0=Sun, 6=Sat
      if (!dowCounts[dow]) { dowCounts[dow] = []; dowRevenues[dow] = []; }
      dowCounts[dow].push(data.count);
      dowRevenues[dow].push(data.revenue);
    });

    const dowAvg = {};
    for (let i = 0; i < 7; i++) {
      const counts = dowCounts[i] || [0];
      const revenues = dowRevenues[i] || [0];
      dowAvg[i] = {
        avgBookings: Math.round(counts.reduce((a, b) => a + b, 0) / counts.length * 10) / 10,
        avgRevenue: Math.round(revenues.reduce((a, b) => a + b, 0) / revenues.length),
        dataPoints: counts.length
      };
    }

    // Generate 7-day predictions
    const predictions = [];
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dow = date.getDay();
      const dateStr = date.toISOString().split('T')[0];

      // Get actual bookings for this date if exist
      const actualBookings = await Booking.count({
        where: {
          facilityName: { [Op.in]: facilityNames },
          date: dateStr,
          status: { [Op.in]: ['confirmed', 'completed', 'pending', 'pending_payment'] }
        }
      });

      const avg = dowAvg[dow] || { avgBookings: 0, avgRevenue: 0, dataPoints: 0 };

      // Weekend boost factor
      const isWeekend = dow === 0 || dow === 6;
      const boostFactor = isWeekend ? 1.2 : 1.0;

      predictions.push({
        date: dateStr,
        dayName: dayNames[dow],
        isWeekend,
        predictedBookings: Math.round(avg.avgBookings * boostFactor),
        predictedRevenue: Math.round(avg.avgRevenue * boostFactor),
        actualBookings,
        confidence: avg.dataPoints >= 3 ? 'cao' : avg.dataPoints >= 1 ? 'trung bình' : 'thấp',
        trend: avg.avgBookings > 3 ? 'hot' : avg.avgBookings > 1 ? 'normal' : 'low'
      });
    }

    // Historical data for chart (last 14 days)
    const history = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      history.push({
        date: dateStr,
        dayName: dayNames[d.getDay()],
        bookings: dailyData[dateStr]?.count || 0,
        revenue: dailyData[dateStr]?.revenue || 0
      });
    }

    res.json({ predictions, history, totalFacilities: myFacilities.length });
  } catch (error) {
    console.error('Booking prediction error:', error.message);
    res.status(500).json({ message: 'Lỗi dự báo' });
  }
});

// ============================================================
// OWNER AI CHAT
// ============================================================

const VERTEX_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'project-b6d82976-1196-4bef-8f6';
const VERTEX_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const VERTEX_TIMEOUT_MS = 45000;

const googleAuth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform'
});

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
    generationConfig: { maxOutputTokens: 8192, temperature: 0.4, topP: 0.85, topK: 40 }
  };

  const model = 'gemini-2.5-flash';
  const url = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_PROJECT_ID}/locations/${VERTEX_LOCATION}/publishers/google/models/${model}:generateContent`;

  console.log(`🤖 [Owner AI] Calling Vertex AI: ${model}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERTEX_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
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
    if (parts?.length > 0) {
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

// Gather owner-specific analytics
async function getOwnerAnalytics(userId) {
  try {
    const myFacilities = await Facility.findAll({
      where: { ownerId: userId },
      include: [{ model: Sport, as: 'sport', attributes: ['name', 'nameVi'] }]
    });
    const facilityNames = myFacilities.map(f => f.name);
    const facilityIds = myFacilities.map(f => f.id);

    if (facilityNames.length === 0) return { facilities: [], bookings: [], stats: null };

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [allBookings, todayBookings, reviews, avgRating] = await Promise.all([
      Booking.findAll({
        where: { facilityName: { [Op.in]: facilityNames }, date: { [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0] } },
        order: [['date', 'DESC']]
      }),
      Booking.findAll({
        where: { facilityName: { [Op.in]: facilityNames }, date: today }
      }),
      Review.findAll({
        where: { facilityId: { [Op.in]: facilityIds } },
        include: [{ model: User, as: 'user', attributes: ['name'] }, { model: Facility, as: 'facility', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
        limit: 10
      }),
      Review.findOne({
        where: { facilityId: { [Op.in]: facilityIds } },
        attributes: [[fn('AVG', col('rating')), 'avg'], [fn('COUNT', col('id')), 'count']],
        raw: true
      })
    ]);

    const confirmed = allBookings.filter(b => ['confirmed', 'completed'].includes(b.status));
    const totalRevenue = confirmed.reduce((s, b) => s + parseFloat(b.totalPrice || 0), 0);
    const todayRevenue = todayBookings.filter(b => ['confirmed', 'completed'].includes(b.status))
      .reduce((s, b) => s + parseFloat(b.totalPrice || 0), 0);

    // Bookings by status
    const statusCounts = {};
    allBookings.forEach(b => { statusCounts[b.status] = (statusCounts[b.status] || 0) + 1; });

    // Revenue by facility
    const revenueByFac = {};
    confirmed.forEach(b => { revenueByFac[b.facilityName] = (revenueByFac[b.facilityName] || 0) + parseFloat(b.totalPrice || 0); });

    return {
      facilities: myFacilities,
      totalBookings: allBookings.length,
      todayBookingsCount: todayBookings.length,
      todayRevenue,
      totalRevenue,
      statusCounts,
      revenueByFacility: revenueByFac,
      avgRating: avgRating?.avg ? parseFloat(avgRating.avg).toFixed(1) : '0',
      totalReviews: parseInt(avgRating?.count || 0),
      recentReviews: reviews,
      today
    };
  } catch (err) {
    console.error('[Owner AI] Analytics error:', err.message);
    return null;
  }
}

function buildOwnerSystemInstruction() {
  return `# VAI TRÒ
Bạn là **Trợ lý AI** dành riêng cho **Chủ Sân** trên hệ thống đặt sân thể thao **Timsan247**.

# NĂNG LỰC
## 1. Phân Tích Kinh Doanh Chủ Sân
- Phân tích doanh thu sân bãi của chủ sân
- So sánh hiệu suất giữa các sân
- Xác định giờ cao điểm, ngày đông khách
- Tư vấn chiến lược giá

## 2. Quản Lý Sân Bãi
- Tình trạng sân (active/inactive)
- Quản lý booking, xác nhận/hủy
- Xử lý đánh giá khách hàng
- Tối ưu lịch sân

## 3. Dự Báo & Tư Vấn
- Phân tích xu hướng đặt sân
- Gợi ý cải thiện dịch vụ dựa trên đánh giá
- Tư vấn marketing, khuyến mãi
- Mở rộng dịch vụ

## 4. Thời Tiết & Ảnh Hưởng
- Phân tích ảnh hưởng thời tiết đến lượng đặt sân
- Đề xuất hành động khi thời tiết xấu (mưa, nắng gắt)

# QUY TẮC
1. **Trả lời bằng tiếng Việt**, chuyên nghiệp, thân thiện
2. **Dựa trên dữ liệu thực** — KHÔNG bịa số liệu
3. Sử dụng **markdown** (bảng, bold, bullet) để trình bày
4. Đưa ra **con số cụ thể** và **khuyến nghị**
5. Chỉ phân tích dữ liệu CỦA CHỦ SÂN NÀY, không tiết lộ dữ liệu hệ thống`;
}

function buildOwnerDataContext(analytics) {
  if (!analytics) return '\n⚠️ Không thể tải dữ liệu.\n';

  let ctx = `\n# 📊 DỮ LIỆU CỦA CHỦ SÂN (${analytics.today})\n\n`;

  // Facilities
  ctx += `## 🏟️ Sân Bãi (${analytics.facilities.length} sân)\n`;
  analytics.facilities.forEach(f => {
    ctx += `- **${f.name}** (${f.sport?.nameVi || f.sport?.name || 'N/A'}) - ${f.status} - ${new Intl.NumberFormat('vi-VN').format(f.pricePerHour || 0)}đ/h\n`;
  });

  // Stats
  ctx += `\n## 📈 Thống Kê 30 Ngày Qua\n`;
  ctx += `- Tổng booking: **${analytics.totalBookings}**\n`;
  ctx += `- Tổng doanh thu: **${new Intl.NumberFormat('vi-VN').format(analytics.totalRevenue)}đ**\n`;
  ctx += `- Hôm nay: **${analytics.todayBookingsCount}** booking, **${new Intl.NumberFormat('vi-VN').format(analytics.todayRevenue)}đ**\n`;
  ctx += `- Đánh giá TB: **${analytics.avgRating}/5** (${analytics.totalReviews} đánh giá)\n`;

  // Status
  if (analytics.statusCounts) {
    ctx += `\n## Booking Theo Trạng Thái\n`;
    Object.entries(analytics.statusCounts).forEach(([st, cnt]) => {
      ctx += `- ${st}: ${cnt}\n`;
    });
  }

  // Revenue by facility
  if (analytics.revenueByFacility) {
    ctx += `\n## Doanh Thu Theo Sân\n`;
    Object.entries(analytics.revenueByFacility).forEach(([name, rev]) => {
      ctx += `- ${name}: ${new Intl.NumberFormat('vi-VN').format(rev)}đ\n`;
    });
  }

  // Recent reviews
  if (analytics.recentReviews?.length > 0) {
    ctx += `\n## ⭐ Đánh Giá Gần Đây\n`;
    analytics.recentReviews.slice(0, 5).forEach(r => {
      ctx += `- ${r.user?.name}: ${r.rating}⭐ "${r.comment}" (${r.facility?.name})\n`;
    });
  }

  return ctx;
}

// POST /api/owner/ai-chat
router.post('/ai-chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Tin nhắn trống' });

    console.log(`\n🤖 [Owner AI] Query from ${req.user.name}: ${message.substring(0, 100)}...`);

    const analytics = await getOwnerAnalytics(req.user.id);
    const systemInstruction = buildOwnerSystemInstruction();
    const dataContext = buildOwnerDataContext(analytics);
    const userPrompt = `${dataContext}\n---\nChủ sân hỏi: ${message.trim()}`;

    try {
      const reply = await callVertexAI(systemInstruction, userPrompt, history);
      console.log(`✅ [Owner AI] Response generated (${reply.length} chars)`);
      return res.json({ reply, source: 'vertex-ai' });
    } catch (aiError) {
      console.error(`❌ [Owner AI] Vertex AI error:`, aiError.message);

      // Simple fallback
      let fallback = '🤖 Xin chào Chủ Sân! Tôi là trợ lý AI của Timsan247.\n\n';
      if (analytics) {
        fallback += `📊 **Tổng quan sân của bạn:**\n`;
        fallback += `- ${analytics.facilities.length} sân bãi\n`;
        fallback += `- ${analytics.totalBookings} booking (30 ngày)\n`;
        fallback += `- Doanh thu: ${new Intl.NumberFormat('vi-VN').format(analytics.totalRevenue)}đ\n`;
        fallback += `- Hôm nay: ${analytics.todayBookingsCount} booking\n\n`;
      }
      fallback += '⚠️ Đang gặp sự cố AI, vui lòng thử lại sau.';
      return res.json({ reply: fallback, source: 'fallback' });
    }
  } catch (error) {
    console.error('[Owner AI] Error:', error);
    res.status(500).json({ error: 'Lỗi xử lý' });
  }
});

module.exports = router;
