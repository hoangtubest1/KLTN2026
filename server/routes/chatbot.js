const express = require('express');
const router = express.Router();
const https = require('https');
const Facility = require('../models/Facility');
const Sport = require('../models/Sport');
const Booking = require('../models/Booking');
const { Op } = require('sequelize');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_TIMEOUT_MS = 10000; // 10 second timeout

// ============================================================
// Direct Gemini REST API call (no SDK - real timeout control)
// ============================================================
function callGeminiAPI(prompt, history = []) {
    return new Promise((resolve, reject) => {
        if (!GEMINI_API_KEY) {
            return reject(new Error('No API key'));
        }

        // Build messages array for REST API
        const contents = [
            ...history.filter(h => h.role && h.content).map(h => ({
                role: h.role === 'bot' ? 'model' : 'user',
                parts: [{ text: h.content }]
            })),
            { role: 'user', parts: [{ text: prompt }] }
        ];

        const body = JSON.stringify({
            contents,
            generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            },
            timeout: GEMINI_TIMEOUT_MS
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) {
                        reject(new Error(`Gemini API error: ${parsed.error.message}`));
                    } else {
                        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                            resolve(text);
                        } else {
                            reject(new Error('Empty response from Gemini'));
                        }
                    }
                } catch (e) {
                    reject(new Error('Failed to parse Gemini response'));
                }
            });
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`Gemini timeout after ${GEMINI_TIMEOUT_MS}ms`));
        });

        req.on('error', (err) => {
            reject(new Error(`Gemini request error: ${err.message}`));
        });

        req.write(body);
        req.end();
    });
}

// ============================================================
// Build context from real database data
// ============================================================
async function getDbData() {
    try {
        const today = new Date();
        today.setHours(today.getHours() + 7); // Chuyển sang múi giờ VN (GMT+7) tạm thời
        const dateString = today.toISOString().split('T')[0];

        const [sports, facilities, todayBookings] = await Promise.all([
            Sport.findAll({ attributes: ['id', 'name', 'nameVi', 'pricePerHour', 'description'] }),
            Facility.findAll({
                where: { status: 'active' },
                include: [{ model: Sport, as: 'sport', attributes: ['name', 'nameVi'] }],
                attributes: ['id', 'name', 'address', 'phone', 'pricePerHour'],
                limit: 30
            }),
            Booking.findAll({
                where: {
                    date: dateString,
                    status: { [Op.notIn]: ['cancelled'] } // Bỏ qua các lịch đã hủy
                },
                attributes: ['facilityName', 'startTime', 'endTime']
            })
        ]);
        return { sports, facilities, todayBookings, currentDate: dateString };
    } catch (err) {
        console.error('DB context error:', err.message);
        return { sports: [], facilities: [], todayBookings: [], currentDate: '' };
    }
}

function buildContextString(sports, facilities, todayBookings, currentDate) {
    let ctx = 'Bạn là nhân viên tư vấn của T&T Sport. Dữ liệu thực ngày hôm nay (' + currentDate + '):\n\n';
    ctx += 'Môn thể thao:\n';
    if (sports.length === 0) {
        ctx += '- Chưa có môn nào\n';
    } else {
        sports.forEach(s => {
            ctx += `- ${s.nameVi || s.name}`;
            if (s.pricePerHour) ctx += ` (${Number(s.pricePerHour).toLocaleString('vi-VN')}đ/giờ)`;
            ctx += '\n';
        });
    }

    ctx += '\nCác sân/cơ sở:\n';
    if (facilities.length === 0) {
        ctx += '- Chưa có cơ sở nào\n';
    } else {
        facilities.forEach(f => {
            // Lọc ra các booking của sân này trong ngày hôm nay
            const facilityBookings = todayBookings.filter(b => b.facilityName === f.name);
            let bookingInfo = '';

            if (facilityBookings.length > 0) {
                const bookedTimes = facilityBookings.map(b => `${b.startTime.substring(0, 5)}-${b.endTime.substring(0, 5)}`).join(', ');
                bookingInfo = `, đã có khách đặt các khung giờ: ${bookedTimes} (Lưu ý: Các khung giờ khác trong ngày vẫn CÒN TRỐNG)`;
            } else {
                bookingInfo = `, hiện đang TRỐNG toàn bộ các khung giờ trong ngày, khách có thể đặt ngay`;
            }

            ctx += `- ${f.name}`;
            if (f.sport) ctx += ` [${f.sport.nameVi || f.sport.name}]`;
            if (f.address) ctx += `, địa chỉ: ${f.address}`;
            if (f.phone) ctx += `, ĐT: ${f.phone}`;
            if (f.pricePerHour) ctx += `, giá: ${Number(f.pricePerHour).toLocaleString('vi-VN')}đ/giờ`;
            ctx += bookingInfo + '\n';
        });
    }
    return ctx;
}

// ============================================================
// Smart rule-based responses (with live DB data)
// ============================================================
function buildRuleBasedResponse(message, sports, facilities, todayBookings) {
    const msg = message.toLowerCase().normalize('NFC');

    if (/xin chào|hello|hi|chào|hey|bắt đầu|start/.test(msg)) {
        return '👋 Xin chào! Tôi là trợ lý AI của **T&T Sport**.\n\nTôi có thể giúp bạn:\n• 🏟️ Tìm sân thể thao\n• 💰 Tra giá thuê sân\n• 📅 Hướng dẫn đặt lịch\n• ⏰ Kiểm tra lịch trống\n\nBạn cần hỗ trợ gì?';
    }

    if (/môn|sport|thể thao|có những gì|danh sách môn/.test(msg)) {
        if (sports.length === 0) return '🏆 Hiện chưa có môn thể thao nào. Vui lòng truy cập trang **Danh sách sân** để xem mới nhất.';
        const sportList = sports.map(s =>
            `• **${s.nameVi || s.name}**${s.pricePerHour ? ` - ${Number(s.pricePerHour).toLocaleString('vi-VN')}đ/giờ` : ''}`
        ).join('\n');
        return `🏆 **T&T Sport** hiện có ${sports.length} môn thể thao:\n\n${sportList}\n\nBạn muốn tìm sân cho môn nào?`;
    }

    if (/sân|cơ sở|facility|tìm sân|danh sách sân/.test(msg)) {
        if (facilities.length === 0) return '🏟️ Hiện chưa có cơ sở nào. Vui lòng thử lại sau hoặc liên hệ quản trị viên.';
        const list = facilities.slice(0, 5).map(f => {
            let line = `• **${f.name}**`;
            if (f.sport) line += ` (${f.sport.nameVi || f.sport.name})`;
            if (f.address) line += `\n  📍 ${f.address}`;
            if (f.pricePerHour) line += `\n  💰 ${Number(f.pricePerHour).toLocaleString('vi-VN')}đ/giờ`;
            return line;
        }).join('\n\n');
        const more = facilities.length > 5 ? `\n\n...và ${facilities.length - 5} cơ sở khác.` : '';
        return `🏟️ Có **${facilities.length}** cơ sở:\n\n${list}${more}`;
    }

    if (/giá|bao nhiêu|phí|tiền|cost|price/.test(msg)) {
        if (sports.length === 0 && facilities.length === 0) return '💰 Vui lòng xem giá tại trang **Danh sách sân**.';
        let info = '💰 **Bảng giá tham khảo:**\n\n';
        sports.forEach(s => { if (s.pricePerHour) info += `• ${s.nameVi || s.name}: **${Number(s.pricePerHour).toLocaleString('vi-VN')}đ/giờ**\n`; });
        if (facilities.length > 0) {
            info += '\nGiá từng sân:\n';
            facilities.slice(0, 4).forEach(f => { if (f.pricePerHour) info += `• ${f.name}: **${Number(f.pricePerHour).toLocaleString('vi-VN')}đ/giờ**\n`; });
        }
        return info + '\nGiá có thể thay đổi. Xem chi tiết tại trang **Danh sách sân**.';
    }

    if (/đặt|book|lịch|booking|đăng ký|hướng dẫn/.test(msg)) {
        return '📅 **Cách đặt sân:**\n\n1. 🔑 **Đăng nhập** tài khoản\n2. 🏟️ Vào **Danh sách sân** → chọn môn\n3. 📍 Chọn cơ sở phù hợp\n4. 📆 Chọn ngày & **giờ trống**\n5. 📝 Điền thông tin\n6. ✅ Xác nhận → nhận **email**\n\nBạn cần hỗ trợ bước nào?';
    }

    if (/hủy|cancel|đổi lịch|thay đổi/.test(msg)) {
        return '❌ **Hủy/thay đổi lịch:**\n\n1. Vào trang **Danh sách đặt lịch**\n2. Tìm lịch cần thay đổi\n3. Liên hệ trực tiếp cơ sở\n\n⚠️ Mỗi cơ sở có chính sách khác nhau.';
    }

    if (/còn trống|available|trống|lịch trống/.test(msg)) {
        if (todayBookings && todayBookings.length === 0) {
            return '⏰ Hôm nay toàn bộ các sân đều đang trống. Bạn có thể đặt bất cứ giờ nào bạn muốn.\n\n👉 Vào trang **Đặt lịch** để chọn sân nhé!';
        }
        return `⏰ **Kiểm tra lịch trống:**\n\nHôm nay đã có ${todayBookings.length} lượt khách đặt sân. Các giờ khác vẫn còn trống.\n\n1. Vào trang **Đặt lịch**\n2. Chọn cơ sở và ngày\n3. Xem lưới giờ:\n   🟢 Xanh = còn trống\n   🔴 Đỏ = đã đặt\n\nBạn muốn đặt ngày nào?`;
    }

    if (/liên hệ|contact|phone|số điện thoại|email/.test(msg)) {
        let facilityContact = '';
        const withPhone = facilities.filter(f => f.phone).slice(0, 3);
        if (withPhone.length > 0) facilityContact = '\n\n**Các cơ sở:**\n' + withPhone.map(f => `• ${f.name}: ${f.phone}`).join('\n');
        return `📞 **Liên hệ T&T Sport:**\n\n• 📧 nguyenngohoangtu9a11@gmail.com\n• 🌐 Trang /contact${facilityContact}`;
    }

    if (/giờ mở cửa|mở cửa|giờ hoạt động/.test(msg)) {
        return '⏰ Vui lòng liên hệ trực tiếp từng cơ sở để biết giờ mở cửa chi tiết.';
    }

    if (/cảm ơn|thank|tốt|ok|được rồi/.test(msg)) {
        return '😊 Rất vui được hỗ trợ! Chúc bạn chơi thể thao vui vẻ! 🏆';
    }

    const suggestions = [];
    if (sports.length > 0) suggestions.push(`môn thể thao (${sports.length} môn)`);
    if (facilities.length > 0) suggestions.push(`sân (${facilities.length} cơ sở)`);
    suggestions.push('cách đặt lịch', 'giá sân', 'liên hệ');

    return `🤖 Tôi chưa hiểu câu hỏi. Tôi có thể tư vấn:\n\n${suggestions.map(s => `• ${s}`).join('\n')}\n\nBạn muốn hỏi về điều gì?`;
}

// ============================================================
// POST /api/chatbot/message
// ============================================================
router.post('/message', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Tin nhắn không được để trống' });
        }

        // Fetch live DB data
        const { sports, facilities, todayBookings, currentDate } = await getDbData();

        // Try Gemini via direct REST with real timeout
        if (GEMINI_API_KEY) {
            try {
                const dbContext = buildContextString(sports, facilities, todayBookings, currentDate);
                const fullPrompt = `${dbContext}\n\nYêu cầu: Bạn là trợ lý AI của T&T Sport. Ưu tiên sử dụng các thông tin trên để tư vấn về dịch vụ của sân. Trả lời chính xác tình trạng sân (sân nào đã có người đặt, sân nào đang trống rảnh rỗi). Nếu khách hàng hỏi những câu hỏi ngoài lề (ví dụ: kiến thức thể thao, luật chơi, v.v.), bạn vẫn có thể trả lời bình thường một cách lịch sự, ngắn gọn và dùng emoji.\n\nKhách hỏi: ${message.trim()}`;

                const geminiReply = await callGeminiAPI(fullPrompt, history);
                return res.json({ reply: geminiReply, source: 'gemini' });

            } catch (geminiError) {
                console.warn('⚠️ Gemini fallback:', geminiError.message);
            }
        }

        // Always fallback to rule-based
        const fallbackReply = buildRuleBasedResponse(message, sports, facilities, todayBookings);
        return res.json({ reply: fallbackReply, source: 'fallback' });

    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ error: 'Lỗi xử lý', reply: '⚠️ Đã có lỗi. Vui lòng thử lại.' });
    }
});

module.exports = router;
