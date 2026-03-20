import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const HOURS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

function getDates(days = 14) {
    const dates = [];
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dates.push(d);
    }
    return dates;
}

function fmt(d) {
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function fmtDisplay(d) {
    return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

export default function BookingScreen({ route, navigation }) {
    const { facility } = route.params;
    const { isAuthenticated } = useAuth();

    const [selectedDate, setSelectedDate] = useState(getDates(14)[0]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [selectedStart, setSelectedStart] = useState(null);
    const [selectedEnd, setSelectedEnd] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const dates = getDates(14);

    useEffect(() => {
        fetchBooked();
    }, [selectedDate]);

    const fetchBooked = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/facilities/${facility.id}/booked-slots?date=${fmt(selectedDate)}`);
            setBookedSlots(res.data || []);
        } catch {
            setBookedSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const isBooked = (hour) => bookedSlots.some(s => s.startTime <= hour && hour < s.endTime);

    const handleSelectSlot = (hour) => {
        if (isBooked(hour)) return;
        if (!selectedStart) {
            setSelectedStart(hour);
            setSelectedEnd(null);
        } else if (selectedStart === hour) {
            setSelectedStart(null);
            setSelectedEnd(null);
        } else {
            const start = selectedStart < hour ? selectedStart : hour;
            const end = selectedStart < hour ? hour : selectedStart;
            // Check không có slot đã đặt ở giữa
            const conflict = HOURS.slice(HOURS.indexOf(start), HOURS.indexOf(end))
                .some(h => isBooked(h));
            if (conflict) {
                Alert.alert('Lỗi', 'Có khung giờ đã được đặt trong khoảng này!');
                setSelectedStart(null);
                return;
            }
            setSelectedStart(start);
            setSelectedEnd(end);
        }
    };

    const isSelected = (hour) => {
        if (!selectedStart) return false;
        if (!selectedEnd) return hour === selectedStart;
        return hour >= selectedStart && hour < selectedEnd;
    };

    const calcTotal = () => {
        if (!selectedStart || !selectedEnd) return 0;
        const hours = HOURS.indexOf(selectedEnd) - HOURS.indexOf(selectedStart);
        return hours * Number(facility.pricePerHour || 0);
    };

    const handleBook = async () => {
        if (!isAuthenticated) {
            Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để đặt sân', [
                { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') }
            ]);
            return;
        }
        if (!selectedStart || !selectedEnd) {
            Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 2 khung giờ (từ giờ bắt đầu đến giờ kết thúc)');
            return;
        }
        Alert.alert(
            'Xác nhận đặt sân',
            `📅 ${fmtDisplay(selectedDate)}\n⏰ ${selectedStart} – ${selectedEnd}\n💰 ${calcTotal().toLocaleString('vi-VN')}đ`,
            [
                { text: 'Hủy' },
                { text: 'Đặt sân', onPress: submitBooking }
            ]
        );
    };

    const submitBooking = async () => {
        try {
            setSubmitting(true);
            await api.post('/bookings', {
                facilityId: facility.id,
                date: fmt(selectedDate),
                startTime: selectedStart,
                endTime: selectedEnd,
                totalPrice: calcTotal(),
            });
            Alert.alert('🎉 Đặt sân thành công!', 'Lịch đặt của bạn đang chờ xác nhận.', [
                { text: 'Xem lịch đặt', onPress: () => navigation.navigate('Bookings') }
            ]);
        } catch (e) {
            Alert.alert('Lỗi', e.response?.data?.message || 'Không thể đặt sân, vui lòng thử lại');
        } finally {
            setSubmitting(false);
        }
    };

    const totalHours = selectedStart && selectedEnd
        ? HOURS.indexOf(selectedEnd) - HOURS.indexOf(selectedStart) : 0;

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Facility info */}
                <View style={styles.facilityBar}>
                    <Text style={styles.facilityName} numberOfLines={1}>{facility.name}</Text>
                    <Text style={styles.facilityPrice}>{Number(facility.pricePerHour || 0).toLocaleString('vi-VN')}đ/giờ</Text>
                </View>

                {/* Date Picker */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📅 Chọn ngày</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datePicker}>
                        {dates.map((d) => {
                            const isToday = fmt(d) === fmt(new Date());
                            const active = fmt(d) === fmt(selectedDate);
                            return (
                                <TouchableOpacity
                                    key={fmt(d)}
                                    style={[styles.dateChip, active && styles.dateChipActive]}
                                    onPress={() => { setSelectedDate(d); setSelectedStart(null); setSelectedEnd(null); }}
                                >
                                    <Text style={[styles.dateChipWeekday, active && styles.dateChipTextActive]}>
                                        {isToday ? 'Hôm nay' : d.toLocaleDateString('vi-VN', { weekday: 'short' })}
                                    </Text>
                                    <Text style={[styles.dateChipDay, active && styles.dateChipTextActive]}>
                                        {d.getDate()}/{d.getMonth() + 1}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Time Slots */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⏰ Chọn khung giờ</Text>
                    <Text style={styles.slotHint}>Nhấn giờ bắt đầu, sau đó nhấn giờ kết thúc</Text>
                    {loading ? (
                        <ActivityIndicator color="#18458B" style={{ marginTop: 16 }} />
                    ) : (
                        <View style={styles.slotGrid}>
                            {HOURS.map((hour) => {
                                const booked = isBooked(hour);
                                const selected = isSelected(hour);
                                return (
                                    <TouchableOpacity
                                        key={hour}
                                        style={[
                                            styles.slot,
                                            booked && styles.slotBooked,
                                            selected && styles.slotSelected,
                                        ]}
                                        onPress={() => handleSelectSlot(hour)}
                                        disabled={booked}
                                    >
                                        <Text style={[
                                            styles.slotText,
                                            booked && styles.slotTextBooked,
                                            selected && styles.slotTextSelected,
                                        ]}>
                                            {hour}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    {/* Legend */}
                    <View style={styles.legend}>
                        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db' }]} /><Text style={styles.legendText}>Trống</Text></View>
                        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#18458B' }]} /><Text style={styles.legendText}>Đã chọn</Text></View>
                        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#fee2e2' }]} /><Text style={styles.legendText}>Đã đặt</Text></View>
                    </View>
                </View>

                {/* Summary */}
                {selectedStart && (
                    <View style={styles.summary}>
                        <Text style={styles.summaryTitle}>📋 Tóm tắt</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Ngày</Text>
                            <Text style={styles.summaryValue}>{fmtDisplay(selectedDate)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Khung giờ</Text>
                            <Text style={styles.summaryValue}>{selectedStart} – {selectedEnd || '...'}</Text>
                        </View>
                        {totalHours > 0 && (
                            <>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Số giờ</Text>
                                    <Text style={styles.summaryValue}>{totalHours} giờ</Text>
                                </View>
                                <View style={[styles.summaryRow, styles.summaryTotal]}>
                                    <Text style={styles.summaryTotalLabel}>Tổng tiền</Text>
                                    <Text style={styles.summaryTotalValue}>{calcTotal().toLocaleString('vi-VN')}đ</Text>
                                </View>
                            </>
                        )}
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <View>
                    <Text style={styles.footerLabel}>{selectedStart && selectedEnd ? `${selectedStart} – ${selectedEnd}` : 'Chưa chọn giờ'}</Text>
                    <Text style={styles.footerTotal}>{calcTotal() > 0 ? `${calcTotal().toLocaleString('vi-VN')}đ` : '--'}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.bookBtn, (!selectedStart || !selectedEnd || submitting) && styles.bookBtnDisabled]}
                    onPress={handleBook}
                    disabled={!selectedStart || !selectedEnd || submitting}
                >
                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookBtnText}>Đặt sân ngay</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    facilityBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#18458B', paddingHorizontal: 20, paddingVertical: 14,
    },
    facilityName: { fontSize: 15, fontWeight: '700', color: '#fff', flex: 1, marginRight: 10 },
    facilityPrice: { fontSize: 14, color: '#FFD700', fontWeight: '700' },

    section: { padding: 16, paddingBottom: 8 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
    slotHint: { fontSize: 12, color: '#6b7280', marginBottom: 10 },

    datePicker: { flexGrow: 0 },
    dateChip: {
        alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: 14, backgroundColor: '#fff', marginRight: 8,
        borderWidth: 1, borderColor: '#e5e7eb',
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    },
    dateChipActive: { backgroundColor: '#18458B', borderColor: '#18458B' },
    dateChipWeekday: { fontSize: 11, color: '#6b7280', marginBottom: 3 },
    dateChipDay: { fontSize: 15, fontWeight: '700', color: '#111827' },
    dateChipTextActive: { color: '#fff' },

    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    slot: {
        width: '22%', paddingVertical: 12, borderRadius: 10, alignItems: 'center',
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
    },
    slotBooked: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
    slotSelected: { backgroundColor: '#18458B', borderColor: '#18458B' },
    slotText: { fontSize: 13, fontWeight: '600', color: '#374151' },
    slotTextBooked: { color: '#ef4444' },
    slotTextSelected: { color: '#fff' },

    legend: { flexDirection: 'row', gap: 16, marginTop: 14 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 14, height: 14, borderRadius: 7 },
    legendText: { fontSize: 12, color: '#6b7280' },

    summary: {
        margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16,
        shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
    },
    summaryTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { fontSize: 14, color: '#6b7280' },
    summaryValue: { fontSize: 14, color: '#111827', fontWeight: '500' },
    summaryTotal: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10, marginTop: 4 },
    summaryTotalLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
    summaryTotalValue: { fontSize: 18, fontWeight: '800', color: '#18458B' },

    footer: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 24,
        borderTopWidth: 1, borderTopColor: '#e5e7eb',
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 8,
    },
    footerLabel: { fontSize: 13, color: '#6b7280' },
    footerTotal: { fontSize: 18, fontWeight: '800', color: '#18458B' },
    bookBtn: {
        backgroundColor: '#18458B', paddingHorizontal: 28, paddingVertical: 14,
        borderRadius: 14, shadowColor: '#18458B', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    bookBtnDisabled: { backgroundColor: '#9ca3af', shadowOpacity: 0 },
    bookBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
