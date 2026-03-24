const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const https = require('https');
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');
const { auth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Sport = require('../models/Sport');
const { sendBookingConfirmationEmail, sendConfirmedBookingEmail } = require('../utils/emailService');
const { Op } = require('sequelize');

// ============================================================
// VNPay config
// ============================================================
const vnpay = new VNPay({
  tmnCode: process.env.VNPAY_TMN_CODE || 'X5IEZN31',
  secureSecret: process.env.VNPAY_HASH_SECRET || 'DIO443NDX4TXGBCG48XR5PMJMKMJC7LF',
  vnpayHost: 'https://sandbox.vnpayment.vn',
  testMode: true,
  hashAlgorithm: 'SHA512',
  loggerFn: ignoreLogger,
});

const vnp_ReturnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/payment/vnpay_return';

// ============================================================
// MoMo config (Test/Sandbox)
// ============================================================
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO';
const MOMO_REDIRECT_URL = process.env.MOMO_REDIRECT_URL || 'http://localhost:5000/api/payment/momo_return';
const MOMO_IPN_URL = process.env.MOMO_IPN_URL || 'http://localhost:5000/api/payment/momo_ipn';

// ============================================================
// Helper: tạo booking từ request body
// ============================================================
async function createBookingFromRequest(req, paymentMethod) {
  const {
    sportId, facilityName, facilityAddress, facilityPhone,
    customerName, customerPhone, customerEmail,
    date, startTime, endTime, duration, totalPrice, notes,
    paymentPlan, amountToPay
  } = req.body;

  // Validate
  if (!sportId || !facilityName || !customerName || !customerPhone || !customerEmail || !date || !startTime || !endTime) {
    throw new Error('Thiếu thông tin đặt sân');
  }

  // Check sport exists
  const sport = await Sport.findByPk(sportId);
  if (!sport) {
    throw new Error('Môn thể thao không tồn tại');
  }

  // Auto-expire: cancel pending_payment bookings older than 15 minutes
  const expireTime = new Date(Date.now() - 15 * 60 * 1000);
  await Booking.update(
    { status: 'cancelled', paymentStatus: 'failed' },
    {
      where: {
        status: 'pending_payment',
        createdAt: { [Op.lt]: expireTime }
      }
    }
  );

  // Check for booking conflicts (only pending & confirmed block the slot)
  const existingBooking = await Booking.findOne({
    where: {
      sportId,
      facilityName,
      date,
      status: { [Op.in]: ['pending', 'confirmed'] },
      [Op.or]: [{
        [Op.and]: [
          { startTime: { [Op.lt]: endTime } },
          { endTime: { [Op.gt]: startTime } }
        ]
      }]
    }
  });

  if (existingBooking) {
    throw new Error('Khung giờ này đã được đặt');
  }

  const txnRef = `${Date.now()}`;

  console.log(`\n🆕 Creating VNPay booking with txnRef: ${txnRef}`);
  const booking = await Booking.create({
    sportId,
    facilityName,
    facilityAddress: facilityAddress || '',
    facilityPhone: facilityPhone || '',
    customerName,
    customerPhone,
    customerEmail,
    date,
    startTime,
    endTime,
    duration: duration || 1,
    totalPrice: totalPrice || 0,
    notes,
    status: 'pending_payment',
    paymentMethod,
    paymentStatus: 'unpaid',
    vnpayTxnRef: txnRef,
  });
  console.log(`✅ Booking #${booking.id} created with vnpayTxnRef: ${booking.vnpayTxnRef}`);
  
  // Verify it's actually in the DB
  const verify = await Booking.findOne({ where: { vnpayTxnRef: txnRef } });
  console.log(`🔍 Verify booking exists in DB: ${verify ? `YES (id=${verify.id})` : 'NO!'}`);

  return { booking, txnRef, totalPrice: amountToPay || totalPrice || 0 };
}

// ============================================================
// Helper: cập nhật booking sau thanh toán
// ============================================================
async function updateBookingAfterPayment(txnRef, success) {
  console.log(`\n🔍 updateBookingAfterPayment called: txnRef=${txnRef}, success=${success}`);
  const booking = await Booking.findOne({ where: { vnpayTxnRef: txnRef } });
  if (!booking) {
    console.log('❌ No booking found for txnRef:', txnRef);
    // Debug: list all bookings to see what's in the DB
    const allBookings = await Booking.findAll({ 
      attributes: ['id', 'vnpayTxnRef', 'status', 'paymentStatus', 'createdAt'],
      order: [['id', 'DESC']],
      limit: 5
    });
    console.log('📋 Recent bookings in DB:', JSON.stringify(allBookings.map(b => b.toJSON()), null, 2));
    return null;
  }
  console.log(`📋 Booking #${booking.id} found: status=${booking.status}, email=${booking.customerEmail}`);

  if (success) {
    await booking.update({ paymentStatus: 'paid', status: 'confirmed' });
    console.log(`✅ Booking #${booking.id} updated to confirmed/paid`);

    // Gửi email xác nhận
    const populatedBooking = await Booking.findByPk(booking.id, {
      include: [{ model: Sport, as: 'sport' }]
    });
    const bookingData = populatedBooking.toJSON();
    console.log(`📧 Sending confirmed email to: ${bookingData.customerEmail}`);
    console.log(`   Sport: ${bookingData.sport?.nameVi || bookingData.sport?.name || 'N/A'}`);
    console.log(`   Facility: ${bookingData.facilityName}, Date: ${bookingData.date}`);
    
    try {
      const emailResult = await sendConfirmedBookingEmail(bookingData);
      console.log('📧 Email result:', JSON.stringify(emailResult));
    } catch (err) {
      console.error('❌ Email sending error:', err.message);
    }
    console.log(`✅ Booking #${booking.id} paid successfully`);
  } else {
    await booking.update({ paymentStatus: 'failed', status: 'cancelled' });
    console.log(`❌ Booking #${booking.id} payment failed`);
  }

  return booking;
}

// ============================================================
// POST /api/payment/create_payment_url (VNPay)
// ============================================================
router.post('/create_payment_url', auth, async (req, res) => {
  try {
    const { booking, txnRef, totalPrice } = await createBookingFromRequest(req, 'vnpay');

    const ipAddr = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress || '127.0.0.1';

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: Math.round(Number(totalPrice)),
      vnp_IpAddr: ipAddr,
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan dat san ${req.body.facilityName} ngay ${req.body.date}`,
      vnp_OrderType: ProductCode.Other,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    console.log('✅ VNPay payment URL created:', paymentUrl);

    res.json({ paymentUrl, bookingId: booking.id, txnRef });
  } catch (error) {
    console.error('VNPay create error:', error);
    res.status(error.message.includes('Thiếu') || error.message.includes('đã được') ? 400 : 500)
      .json({ message: error.message });
  }
});

// ============================================================
// GET /api/payment/vnpay_return
// ============================================================
router.get('/vnpay_return', async (req, res) => {
  try {
    const result = vnpay.verifyReturnUrl(req.query);
    console.log('🔍 VNPay return:', { isVerified: result.isVerified, isSuccess: result.isSuccess, txnRef: result.vnp_TxnRef });

    const txnRef = result.vnp_TxnRef;
    const amount = Number(result.vnp_Amount) / 100;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    if (result.isVerified) {
      await updateBookingAfterPayment(txnRef, result.isSuccess);
      res.redirect(`${clientUrl}/payment/result?vnp_ResponseCode=${result.vnp_ResponseCode}&vnp_TxnRef=${txnRef}&vnp_Amount=${amount}&success=${result.isSuccess ? '1' : '0'}&method=vnpay`);
    } else {
      res.redirect(`${clientUrl}/payment/result?success=0&message=invalid_signature`);
    }
  } catch (error) {
    console.error('VNPay return error:', error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/payment/result?success=0&message=server_error`);
  }
});

// ============================================================
// POST /api/payment/create_momo_url (MoMo)
// ============================================================
router.post('/create_momo_url', auth, async (req, res) => {
  try {
    const { booking, txnRef, totalPrice } = await createBookingFromRequest(req, 'momo');

    const orderId = MOMO_PARTNER_CODE + txnRef;
    const requestId = orderId;
    const orderInfo = `Thanh toan dat san ${req.body.facilityName}`;
    const amount = Math.round(Number(totalPrice));
    const extraData = Buffer.from(JSON.stringify({ txnRef })).toString('base64');

    // Tạo signature theo format MoMo
    const rawSignature =
      'accessKey=' + MOMO_ACCESS_KEY +
      '&amount=' + amount +
      '&extraData=' + extraData +
      '&ipnUrl=' + MOMO_IPN_URL +
      '&orderId=' + orderId +
      '&orderInfo=' + orderInfo +
      '&partnerCode=' + MOMO_PARTNER_CODE +
      '&redirectUrl=' + MOMO_REDIRECT_URL +
      '&requestId=' + requestId +
      '&requestType=payWithMethod';

    const signature = crypto.createHmac('sha256', MOMO_SECRET_KEY)
      .update(rawSignature).digest('hex');

    const requestBody = JSON.stringify({
      partnerCode: MOMO_PARTNER_CODE,
      partnerName: 'T&T Sport',
      storeId: 'TTSportStore',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: MOMO_REDIRECT_URL,
      ipnUrl: MOMO_IPN_URL,
      lang: 'vi',
      requestType: 'payWithMethod',
      autoCapture: true,
      extraData,
      orderGroupId: '',
      signature,
    });

    // Gửi request đến MoMo API
    const momoResponse = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'test-payment.momo.vn',
        port: 443,
        path: '/v2/gateway/api/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
        },
      };

      const momoReq = https.request(options, (momoRes) => {
        let data = '';
        momoRes.on('data', (chunk) => { data += chunk; });
        momoRes.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(new Error('MoMo response parse error'));
          }
        });
      });

      momoReq.on('error', reject);
      momoReq.write(requestBody);
      momoReq.end();
    });

    console.log('✅ MoMo response:', momoResponse.resultCode, momoResponse.message);

    if (momoResponse.resultCode === 0) {
      res.json({
        paymentUrl: momoResponse.payUrl,
        bookingId: booking.id,
        txnRef,
      });
    } else {
      // MoMo trả lỗi → hủy booking
      await booking.update({ paymentStatus: 'failed', status: 'cancelled' });
      res.status(400).json({ message: `MoMo error: ${momoResponse.message}` });
    }
  } catch (error) {
    console.error('MoMo create error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// GET /api/payment/momo_return (MoMo redirect về)
// ============================================================
router.get('/momo_return', async (req, res) => {
  try {
    const { resultCode, orderId, amount, extraData } = req.query;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    // Parse extraData để lấy txnRef
    let txnRef = '';
    try {
      const parsed = JSON.parse(Buffer.from(extraData || '', 'base64').toString());
      txnRef = parsed.txnRef || '';
    } catch (e) {
      // Fallback: lấy từ orderId
      txnRef = (orderId || '').replace(MOMO_PARTNER_CODE, '');
    }

    const success = String(resultCode) === '0';
    await updateBookingAfterPayment(txnRef, success);

    res.redirect(`${clientUrl}/payment/result?vnp_TxnRef=${txnRef}&vnp_Amount=${amount || 0}&success=${success ? '1' : '0'}&method=momo`);
  } catch (error) {
    console.error('MoMo return error:', error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/payment/result?success=0&message=server_error`);
  }
});

// ============================================================
// POST /api/payment/momo_ipn (MoMo IPN callback)
// ============================================================
router.post('/momo_ipn', async (req, res) => {
  try {
    const { resultCode, extraData } = req.body;

    let txnRef = '';
    try {
      const parsed = JSON.parse(Buffer.from(extraData || '', 'base64').toString());
      txnRef = parsed.txnRef || '';
    } catch (e) { }

    const success = String(resultCode) === '0';
    await updateBookingAfterPayment(txnRef, success);

    res.status(204).end();
  } catch (error) {
    console.error('MoMo IPN error:', error);
    res.status(204).end();
  }
});

module.exports = router;
