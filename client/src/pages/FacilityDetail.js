import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import api from '../api';
import ReviewSection from '../components/ReviewSection';
import { resolveMediaUrl } from '../utils/mediaUrl';

const timeToFloat = (t = '00:00') => {
    const [h, m] = t.substring(0, 5).split(':').map(Number);
    return h + m / 60;
};
const addHrs = (t, hrs) => {
    const f = timeToFloat(t) + hrs;
    const h = Math.floor(f), m = Math.round((f - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
const getPriceForTime = (timeStr, schedule) => {
    if (!schedule || !schedule.length) return null;
    const t = timeToFloat(timeStr);
    const tier = schedule.find(s => t >= timeToFloat(s.startTime) && t < timeToFloat(s.endTime));
    return tier ? Number(tier.price) : null;
};
const generateSlots = (schedule) => {
    const slots = [];
    for (let h = 6; h < 22; h += 2) {
        const s = `${String(h).padStart(2, '0')}:00`;
        const e = addHrs(s, 2);
        if (timeToFloat(e) > 22) break;
        slots.push({ start: s, end: e, price: getPriceForTime(s, schedule) });
    }
    return slots;
};
const getDayLabel = (date) => ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
const isPastDay = (date) => isBefore(startOfDay(date), startOfDay(new Date()));

const FacilityDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [facility, setFacility] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [activeImg, setActiveImg] = useState(0);
    const [calMonth, setCalMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);

    // Realtime slot-views
    const [viewingSlots, setViewingSlots] = useState([]);
    const sessionId = React.useRef(
        sessionStorage.getItem('_svSid') || (() => {
            const sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
            sessionStorage.setItem('_svSid', sid);
            return sid;
        })()
    ).current;

    // ── Data fetching ──
    useEffect(() => { fetchFacility(); }, [id]); // eslint-disable-line
    useEffect(() => {
        if (selectedDate) {
            const d = format(selectedDate, 'yyyy-MM-dd');
            fetchBookedSlots(d);
            fetchViewingSlots(d);
        } else { setViewingSlots([]); }
    }, [selectedDate, id]); // eslint-disable-line

    // Poll viewing slots every 500ms (dưới 1 giây)
    useEffect(() => {
        if (!selectedDate) return;
        const d = format(selectedDate, 'yyyy-MM-dd');
        const iv = setInterval(() => fetchViewingSlots(d), 500);
        return () => clearInterval(iv);
    }, [selectedDate, id]); // eslint-disable-line

    // Heartbeat mỗi 30s — gia hạn TTL lock đang giữ
    useEffect(() => {
        if (!selectedSlot || !selectedDate) return;
        const d = format(selectedDate, 'yyyy-MM-dd');
        const hb = setInterval(() => {
            api.patch('/slot-views', { facilityId: id, date: d, slotStart: selectedSlot.start, sessionId }).catch(() => {});
        }, 30000);
        return () => clearInterval(hb);
    }, [selectedSlot, selectedDate, id]); // eslint-disable-line

    // Cleanup slot lock on unmount
    useEffect(() => {
        return () => {
            if (selectedSlot && selectedDate) {
                api.delete('/slot-views', { data: { facilityId: id, date: format(selectedDate, 'yyyy-MM-dd'), slotStart: selectedSlot.start, sessionId } }).catch(() => { });
            }
        };
    }, [selectedSlot, selectedDate]); // eslint-disable-line

    // Cleanup khi đóng tab / reload
    useEffect(() => {
        const handleUnload = () => {
            if (selectedSlot && selectedDate) {
                const d = format(selectedDate, 'yyyy-MM-dd');
                // sendBeacon là cách duy nhất đáng tin cậy khi tab bị đóng
                const payload = JSON.stringify({ facilityId: id, date: d, slotStart: selectedSlot.start, sessionId });
                navigator.sendBeacon && navigator.sendBeacon(
                    `${process.env.REACT_APP_API_URL || ''}/api/slot-views/beacon`,
                    new Blob([payload], { type: 'application/json' })
                );
            }
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, [selectedSlot, selectedDate, id]); // eslint-disable-line

    const fetchFacility = async () => {
        try { setLoading(true); const r = await api.get(`/facilities/${id}`); setFacility(r.data); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };
    const fetchBookedSlots = async (d) => {
        try { const r = await api.get(`/facilities/${id}/booked-slots?date=${d}`); setBookedSlots(r.data || []); }
        catch { setBookedSlots([]); }
    };
    const fetchViewingSlots = async (d) => {
        try { const r = await api.get(`/slot-views?facilityId=${id}&date=${d}&sessionId=${sessionId}`); setViewingSlots(Array.isArray(r.data) ? r.data : []); }
        catch { /* non-critical */ }
    };
    const lockSlot = (slot) => {
        if (!selectedDate) return;
        api.post('/slot-views', { facilityId: id, date: format(selectedDate, 'yyyy-MM-dd'), slotStart: slot.start, sessionId }).catch(() => { });
    };
    const unlockSlot = (slot) => {
        if (!selectedDate) return;
        api.delete('/slot-views', { data: { facilityId: id, date: format(selectedDate, 'yyyy-MM-dd'), slotStart: slot.start, sessionId } }).catch(() => { });
    };

    const getSlotBookingInfo = (slot) => {
        const sF = timeToFloat(slot.start), eF = timeToFloat(slot.end);
        return bookedSlots.find(b => {
            if (b.status === 'cancelled') return false;
            const bS = timeToFloat((b.startTime || '00:00').substring(0, 5));
            const bE = timeToFloat((b.endTime || '00:00').substring(0, 5));
            return sF < bE && eF > bS;
        });
    };

    const handleBook = () => {
        if (!facility) return;
        const sportId = facility.sport?.id || facility.sportId;
        let url = `/booking/${sportId}?facility=${facility.id}`;
        if (selectedDate) url += `&date=${format(selectedDate, 'yyyy-MM-dd')}`;
        if (selectedSlot) url += `&start=${selectedSlot.start}&end=${selectedSlot.end}`;
        navigate(url);
    };

    const handleSlotSelect = (slot) => {
        if (selectedSlot && selectedSlot.start === slot.start) {
            unlockSlot(slot); setSelectedSlot(null);
        } else {
            if (selectedSlot) unlockSlot(selectedSlot);
            lockSlot(slot); setSelectedSlot(slot);
        }
    };

    const calDays = useCallback(() => {
        const first = startOfMonth(calMonth), last = endOfMonth(calMonth);
        return { days: eachDayOfInterval({ start: first, end: last }), startPad: first.getDay() };
    }, [calMonth]);

    // ── Loading / Error states ──
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-3"></div>
                <p className="text-gray-500">Đang tải...</p>
            </div>
        </div>
    );
    if (!facility) return (
        <div className="min-h-screen flex items-center justify-center flex-col gap-4">
            <div className="text-6xl">😔</div>
            <p className="text-gray-600 font-medium">Không tìm thấy sân bãi</p>
            <Link to="/fields" className="text-green-600 hover:underline">← Quay lại danh sách</Link>
        </div>
    );

    // ── Derived data ──
    const images = facility.image ? [resolveMediaUrl(facility.image)] : [];
    const amenities = [
        { icon: '🏠', label: 'Phòng thay đồ' },
        { icon: '🅿️', label: 'Bãi đỗ xe' },
        { icon: '💡', label: 'Đèn chiếu sáng' },
        { icon: '👥', label: `Sân ${facility.courtCount || 1} sân` },
    ];
    const rating = facility.avgRating ? parseFloat(facility.avgRating) : 4.8;
    const reviewCount = facility.reviewCount || 0;
    const priceFrom = facility.pricingSchedule?.length
        ? Math.min(...facility.pricingSchedule.map(t => Number(t.price)))
        : Number(facility.pricePerHour);
    const { days, startPad } = calDays();
    const slots = selectedDate ? generateSlots(facility.pricingSchedule || []) : [];
    const pricingTiers = facility.pricingSchedule || [];
    const selectedDayLabel = selectedDate ? getDayLabel(selectedDate) : '';
    const slotPrice = selectedSlot ? (selectedSlot.price || Number(facility.pricePerHour)) : 0;
    const bookingTotal = slotPrice * 2;

    // ── RENDER ──
    return (
        <div style={{ minHeight: '100vh', background: '#f7f8fa' }}>

            {/* ── Gallery ── */}
            <div style={{ background: '#fff', borderBottom: '1px solid #eee' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
                    {images.length > 0 ? (
                        <div>
                            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '16px 0', scrollbarWidth: 'none' }}>
                                <div style={{ flex: '0 0 460px', height: 240, borderRadius: 12, overflow: 'hidden' }}>
                                    <img src={images[activeImg]} alt={facility.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                {[...images, ...images, ...images, ...images].slice(0, 4).map((img, i) => (
                                    <div key={i} onClick={() => setActiveImg(i % images.length)} style={{
                                        flex: '0 0 180px', height: 240, borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                                        opacity: activeImg === (i % images.length) ? 1 : 0.7,
                                        border: activeImg === (i % images.length) ? '2px solid #22b84c' : '2px solid transparent'
                                    }}>
                                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingBottom: 12 }}>
                                {images.map((_, i) => (
                                    <button key={i} onClick={() => setActiveImg(i)} style={{
                                        width: i === activeImg ? 20 : 8, height: 8, borderRadius: 4,
                                        background: i === activeImg ? '#22b84c' : '#d1d5db', border: 'none', cursor: 'pointer'
                                    }} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ height: 200, background: 'linear-gradient(135deg,#22b84c,#1a9e3f)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px 0' }}>
                            <span style={{ fontSize: 64 }}>🏟️</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Main ── */}
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

                {/* LEFT */}
                <div style={{ minWidth: 0 }}>

                    {/* Info */}
                    <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,.07)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: 0 }}>{facility.name}</h1>
                            <span style={{ background: '#22b84c', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {facility.courtCount || 1} sân
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, fontSize: 14, color: '#6b7280', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ color: '#f59e0b' }}>★</span>
                                <strong style={{ color: '#111' }}>{rating.toFixed(1)}</strong>
                                <span>({reviewCount} đánh giá)</span>
                            </span>
                            <span>📍 {facility.address}</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {amenities.map((a, i) => (
                                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f3f4f6', borderRadius: 20, padding: '6px 12px', fontSize: 13, color: '#374151' }}>
                                    {a.icon} {a.label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    {facility.description && (
                        <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,.07)' }}>
                            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: '#111' }}>Mô tả sân</h2>
                            <p style={{ color: '#4b5563', lineHeight: 1.7, margin: 0 }}>{facility.description}</p>
                        </div>
                    )}

                    {/* Pricing */}
                    {pricingTiers.length > 0 && (
                        <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,.07)' }}>
                            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, color: '#111' }}>
                                Bảng giá{selectedDayLabel ? ` — ${selectedDayLabel}` : ''}
                            </h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                {pricingTiers.map((tier, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 14px', fontSize: 14 }}>
                                        <span style={{ color: '#6b7280' }}>🕐 {tier.startTime} - {tier.endTime}</span>
                                        <strong style={{ color: '#22b84c' }}>{Number(tier.price).toLocaleString('vi-VN')}đ</strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Calendar */}
                    <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,.07)' }}>
                        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: '#111' }}>Chọn lịch đặt sân</h2>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <button onClick={() => setCalMonth(m => subMonths(m, 1))} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>‹</button>
                            <span style={{ fontWeight: 700, color: '#111' }}>
                                {format(calMonth, 'MMMM, yyyy', { locale: vi }).replace(/^\w/, c => c.toUpperCase())}
                            </span>
                            <button onClick={() => setCalMonth(m => addMonths(m, 1))} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>›</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                                <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#9ca3af', padding: '4px 0' }}>{d}</div>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                            {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} />)}
                            {days.map(day => {
                                const past = isPastDay(day);
                                const sel = selectedDate && isSameDay(day, selectedDate);
                                const td = isToday(day);
                                return (
                                    <button key={day.toISOString()} onClick={() => { if (!past) { setSelectedDate(day); setSelectedSlot(null); } }} disabled={past}
                                        style={{
                                            aspectRatio: '1', borderRadius: 8, border: 'none', cursor: past ? 'not-allowed' : 'pointer',
                                            background: sel ? '#22b84c' : td ? '#f0fdf4' : 'transparent',
                                            color: sel ? '#fff' : past ? '#d1d5db' : td ? '#22b84c' : '#111',
                                            fontWeight: sel || td ? 700 : 400, fontSize: 14
                                        }}
                                    >{day.getDate()}</button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Time slots */}
                    {selectedDate && (
                        <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,.07)' }}>
                            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, color: '#111' }}>
                                Khung giờ khả dụng — {getDayLabel(selectedDate)}/{selectedDate.getDate()}
                            </h2>
                            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 14 }}>Chọn khung giờ bạn muốn đặt</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {slots.map((slot, i) => {
                                    const bookingInfo = getSlotBookingInfo(slot);
                                    const booked = !!bookingInfo && bookingInfo.status !== 'pending_payment';
                                    const pendingPayment = !!bookingInfo && bookingInfo.status === 'pending_payment';
                                    const isUnavailable = booked || pendingPayment;
                                    const sel = selectedSlot && selectedSlot.start === slot.start;
                                    const viewing = !isUnavailable && !sel && viewingSlots.includes(slot.start);
                                    return (
                                        <button key={i} onClick={() => { if (!isUnavailable && !viewing) handleSlotSelect(slot); }} disabled={isUnavailable || viewing}
                                            style={{
                                                borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, border: 'none',
                                                cursor: (isUnavailable || viewing) ? 'not-allowed' : 'pointer',
                                                background: sel ? '#22b84c' : pendingPayment ? '#fef3c7' : booked ? '#f3f4f6' : viewing ? '#fff7ed' : '#f0fdf4',
                                                color: sel ? '#fff' : pendingPayment ? '#b45309' : booked ? '#9ca3af' : viewing ? '#c2410c' : '#166534',
                                                outline: viewing ? '2px solid #fb923c' : 'none',
                                                transition: 'all .15s'
                                            }}>
                                            {slot.start} - {slot.end}
                                            {booked && <span style={{ display: 'block', fontSize: 11 }}>đã đặt</span>}
                                            {pendingPayment && <span style={{ display: 'block', fontSize: 11, fontWeight: 600 }}>đang giữ chỗ</span>}
                                            {viewing && <span style={{ display: 'block', fontSize: 11, fontWeight: 500 }}>👁 đang chọn...</span>}
                                            {slot.price && !isUnavailable && !viewing && (
                                                <span style={{ display: 'block', fontSize: 11, fontWeight: 400, opacity: 0.8 }}>
                                                    {slot.price.toLocaleString('vi-VN')}đ/h
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Reviews */}
                    <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,.07)' }}>
                        <ReviewSection facilityId={facility.id} />
                    </div>
                </div>

                {/* RIGHT — Booking Card */}
                <div style={{ position: 'sticky', top: 80 }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}>
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#22b84c' }}>
                                {priceFrom.toLocaleString('vi-VN')}<span style={{ fontSize: 15, fontWeight: 400, color: '#9ca3af' }}> đ/giờ</span>
                            </div>
                            <div style={{ fontSize: 13, color: '#9ca3af' }}>Giá từ</div>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280', marginBottom: 6 }}>📅 <strong>Ngày đã chọn</strong></div>
                            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 600, color: selectedDate ? '#111' : '#9ca3af', background: '#fafafa' }}>
                                {selectedDate ? format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi }) : 'Chưa chọn ngày'}
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280', marginBottom: 6 }}>🕐 <strong>Khung giờ đã chọn</strong></div>
                            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 600, color: selectedSlot ? '#111' : '#9ca3af', background: '#fafafa' }}>
                                {selectedSlot ? `${selectedSlot.start} – ${selectedSlot.end}` : 'Chưa chọn khung giờ nào'}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                            <span style={{ fontWeight: 600, color: '#374151' }}>Tổng cộng</span>
                            <span style={{ fontWeight: 800, fontSize: 18, color: selectedSlot ? '#22b84c' : '#111' }}>
                                {selectedSlot ? `${bookingTotal.toLocaleString('vi-VN')}đ` : '0đ'}
                            </span>
                        </div>

                        <button onClick={handleBook} disabled={facility.status !== 'active' || !selectedSlot} style={{
                            width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                            background: facility.status !== 'active' || !selectedSlot ? '#e5e7eb' : 'linear-gradient(to right,#22b84c,#1a9e3f)',
                            color: facility.status !== 'active' || !selectedSlot ? '#9ca3af' : '#fff',
                            fontWeight: 700, fontSize: 16, cursor: facility.status !== 'active' || !selectedSlot ? 'not-allowed' : 'pointer',
                            boxShadow: facility.status !== 'active' || !selectedSlot ? 'none' : '0 4px 14px rgba(34,184,76,.35)'
                        }}>
                            {facility.status === 'active' ? 'Đặt sân ngay' : 'Sân tạm đóng'}
                        </button>
                        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 8 }}>Bạn chưa bị trừ tiền ở bước này</p>

                        <a href={`tel:${facility.phone}`} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            marginTop: 12, padding: '12px 0', borderRadius: 12, border: '1px solid #22b84c',
                            color: '#22b84c', fontWeight: 600, fontSize: 14, textDecoration: 'none'
                        }}>📞 Gọi cho chủ sân</a>
                    </div>

                    {/* Map */}
                    {(facility.mapEmbed || facility.address) && (
                        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginTop: 16, boxShadow: '0 1px 6px rgba(0,0,0,.07)', overflow: 'hidden' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#111' }}>📍 Vị trí sân</h3>
                            <div style={{ borderRadius: 10, overflow: 'hidden', height: 200 }}>
                                <iframe title="map" width="100%" height="100%" style={{ border: 0 }} loading="lazy"
                                    src={facility.mapEmbed
                                        ? (facility.mapEmbed.match(/src="([^"]+)"/) ? facility.mapEmbed.match(/src="([^"]+)"/)[1] : facility.mapEmbed)
                                        : `https://maps.google.com/maps?q=${encodeURIComponent(facility.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FacilityDetail;
