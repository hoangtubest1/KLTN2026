import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Linking, Alert
} from 'react-native';
import api from '../api';

export default function PaymentScreen({ route, navigation }) {
    const { booking } = route.params;

    const handlePaymentMethod = async (method) => {
        if (method === 'contact') {
            Alert.alert(
                '📞 Liên hệ thanh toán',
                'Vui lòng liên hệ chủ sân để thanh toán trực tiếp hoặc chuyển khoản.\n\nLịch đặt đã được ghi nhận.',
                [{ text: 'OK', onPress: () => navigation.navigate('Bookings') }]
            );
            return;
        }
        try {
            const res = await api.post(`/payments/${method}`, { bookingId: booking.id });
            if (res.data?.payUrl) {
                Linking.openURL(res.data.payUrl);
            }
        } catch (e) {
            Alert.alert('Lỗi', e.response?.data?.message || 'Không thể khởi tạo thanh toán');
        }
    };

    const methods = [
        { key: 'momo', icon: '💜', name: 'MoMo', sub: 'Thanh toán qua ví MoMo', color: '#a21caf' },
        { key: 'vnpay', icon: '🏦', name: 'VNPay', sub: 'Thẻ ATM / Internet Banking', color: '#1d4ed8' },
        { key: 'contact', icon: '💵', name: 'Thanh toán trực tiếp', sub: 'Liên hệ chủ sân để thanh toán', color: '#15803d' },
    ];

    return (
        <ScrollView style={styles.container}>
            {/* Booking summary */}
            <View style={styles.summary}>
                <Text style={styles.summaryTitle}>📋 Thông tin đặt sân</Text>
                <Row label="Sân" value={booking.facilityName} />
                <Row label="Ngày" value={new Date(booking.date).toLocaleDateString('vi-VN')} />
                <Row label="Giờ" value={`${booking.startTime?.slice(0, 5)} – ${booking.endTime?.slice(0, 5)}`} />
                <View style={styles.divider} />
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tổng tiền</Text>
                    <Text style={styles.totalValue}>{Number(booking.totalPrice || 0).toLocaleString('vi-VN')}đ</Text>
                </View>
            </View>

            {/* Payment methods */}
            <Text style={styles.sectionTitle}>Chọn phương thức thanh toán</Text>
            {methods.map(m => (
                <TouchableOpacity
                    key={m.key}
                    style={styles.methodCard}
                    onPress={() => handlePaymentMethod(m.key)}
                    activeOpacity={0.8}
                >
                    <View style={[styles.methodIcon, { backgroundColor: m.color + '20' }]}>
                        <Text style={styles.methodEmoji}>{m.icon}</Text>
                    </View>
                    <View style={styles.methodInfo}>
                        <Text style={styles.methodName}>{m.name}</Text>
                        <Text style={styles.methodSub}>{m.sub}</Text>
                    </View>
                    <Text style={styles.methodArrow}>›</Text>
                </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.navigate('Bookings')}>
                <Text style={styles.skipBtnText}>Thanh toán sau</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

function Row({ label, value }) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    summary: {
        margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16,
        shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
    },
    summaryTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    rowLabel: { fontSize: 14, color: '#6b7280' },
    rowValue: { fontSize: 14, color: '#111827', fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 10 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
    totalValue: { fontSize: 20, fontWeight: '800', color: '#18458B' },

    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginHorizontal: 16, marginBottom: 10 },
    methodCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 16,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    },
    methodIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    methodEmoji: { fontSize: 24 },
    methodInfo: { flex: 1 },
    methodName: { fontSize: 15, fontWeight: '700', color: '#111827' },
    methodSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    methodArrow: { fontSize: 24, color: '#9ca3af' },

    skipBtn: { margin: 16, paddingVertical: 14, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: '#d1d5db' },
    skipBtnText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
});
