import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLOR = {
    confirmed: { bg: '#dcfce7', text: '#166534', label: 'Đã xác nhận' },
    pending: { bg: '#fef9c3', text: '#854d0e', label: 'Chờ xác nhận' },
    cancelled: { bg: '#fee2e2', text: '#991b1b', label: 'Đã hủy' },
    completed: { bg: '#dbeafe', text: '#1e40af', label: 'Hoàn thành' },
};

export default function BookingsScreen({ navigation }) {
    const { isAuthenticated } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [reviewedFacilityIds, setReviewedFacilityIds] = useState(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchBookings();
    }, [isAuthenticated]);

    // Refresh khi quay lại màn hình (sau khi đánh giá xong)
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (isAuthenticated) fetchBookings();
        });
        return unsubscribe;
    }, [navigation, isAuthenticated]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/bookings');
            setBookings(res.data);

            // Lấy danh sách các facilityId mà user đã review
            // Dùng endpoint GET /reviews/facility/:id sẽ tốn nhiều request
            // Nên dùng endpoint my-reviews nếu có, hoặc check từng sân completed
            const completedBookings = res.data.filter(b => b.status === 'completed' && b.facilityId);
            if (completedBookings.length > 0) {
                const uniqueFacilityIds = [...new Set(completedBookings.map(b => b.facilityId))];
                const results = await Promise.allSettled(
                    uniqueFacilityIds.map(fId => api.get(`/reviews/can-review/${fId}`))
                );
                const reviewed = new Set();
                results.forEach((r, idx) => {
                    if (r.status === 'fulfilled' && r.value.data.reason === 'already_reviewed') {
                        reviewed.add(uniqueFacilityIds[idx]);
                    }
                });
                setReviewedFacilityIds(reviewed);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };


    const handleCancel = (bookingId) => {
        Alert.alert('Hủy đặt sân', 'Bạn có chắc muốn hủy lịch này?', [
            { text: 'Không' },
            {
                text: 'Hủy đặt', style: 'destructive',
                onPress: async () => {
                    try {
                        await api.put(`/bookings/${bookingId}/cancel`);
                        fetchBookings();
                    } catch (e) {
                        Alert.alert('Lỗi', e.response?.data?.message || 'Không thể hủy');
                    }
                }
            }
        ]);
    };

    if (!isAuthenticated) return (
        <View style={styles.center}>
            <Text style={styles.emptyIcon}>🔒</Text>
            <Text style={styles.emptyTitle}>Chưa đăng nhập</Text>
            <Text style={styles.emptyText}>Vui lòng đăng nhập để xem lịch đặt</Text>
            <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Profile')}>
                <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#18458B" />
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={bookings}
                keyExtractor={b => String(b.id)}
                contentContainerStyle={styles.list}
                refreshing={loading}
                onRefresh={fetchBookings}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.emptyIcon}>📅</Text>
                        <Text style={styles.emptyTitle}>Chưa có lịch đặt</Text>
                        <Text style={styles.emptyText}>Đặt sân ngay hôm nay!</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const s = STATUS_COLOR[item.status] || STATUS_COLOR.pending;
                    return (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.facilityName} numberOfLines={1}>{item.facilityName}</Text>
                                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                                    <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
                                </View>
                            </View>
                            <Text style={styles.sport}>{item.sport?.nameVi || item.sport?.name}</Text>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoIcon}>📅</Text>
                                <Text style={styles.infoText}>
                                    {new Date(item.date).toLocaleDateString('vi-VN')}
                                </Text>
                                <Text style={styles.infoIcon}>⏰</Text>
                                <Text style={styles.infoText}>{item.startTime?.slice(0, 5)} – {item.endTime?.slice(0, 5)}</Text>
                            </View>
                            {item.createdAt && (
                                <Text style={styles.createdAt}>
                                    🕐 Đặt lúc: {new Date(item.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            )}
                            <View style={styles.cardFooter}>
                                <Text style={styles.price}>
                                    {Number(item.totalPrice || 0).toLocaleString('vi-VN')}đ
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {(item.status === 'confirmed' || item.status === 'pending') && (
                                        <TouchableOpacity
                                            style={styles.cancelBtn}
                                            onPress={() => handleCancel(item.id)}
                                        >
                                            <Text style={styles.cancelBtnText}>Hủy đặt</Text>
                                        </TouchableOpacity>
                                    )}
                                    {item.status === 'completed' && (
                                        <TouchableOpacity
                                            style={styles.reviewBtn}
                                            onPress={() => navigation.navigate('Review', { booking: item })}
                                        >
                                            <Text style={styles.reviewBtnText}>⭐ Đánh giá</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
    emptyText: { color: '#6b7280', fontSize: 14, textAlign: 'center' },
    loginBtn: {
        marginTop: 16, backgroundColor: '#18458B', paddingHorizontal: 24,
        paddingVertical: 12, borderRadius: 12,
    },
    loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    list: { padding: 16 },
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    facilityName: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
    badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    sport: { fontSize: 12, color: '#2563eb', fontWeight: '600', marginBottom: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    infoIcon: { fontSize: 14, marginRight: 4 },
    infoText: { fontSize: 13, color: '#374151', marginRight: 12 },
    createdAt: { fontSize: 11, color: '#9ca3af', marginBottom: 10, fontStyle: 'italic' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    price: { fontSize: 16, fontWeight: '800', color: '#18458B' },
    cancelBtn: {
        backgroundColor: '#fee2e2', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
    },
    cancelBtnText: { color: '#991b1b', fontSize: 13, fontWeight: '700' },
    reviewBtn: {
        backgroundColor: '#fef9c3', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
    },
    reviewBtnText: { color: '#854d0e', fontSize: 13, fontWeight: '700' },
});
