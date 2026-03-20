import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator, Linking
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function FacilityDetailScreen({ route, navigation }) {
    const { facility } = route.params;
    const { isAuthenticated } = useAuth();
    const [booking, setBooking] = useState(false);

    const handleBook = () => {
        if (!isAuthenticated) {
            Alert.alert(
                'Chưa đăng nhập',
                'Vui lòng đăng nhập để đặt sân',
                [
                    { text: 'Hủy' },
                    { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') }
                ]
            );
            return;
        }
        navigation.navigate('Booking', { facility });
    };

    const handleCall = () => {
        if (facility.phone) {
            Linking.openURL(`tel:${facility.phone}`);
        }
    };

    const handleMap = () => {
        const query = encodeURIComponent(facility.address || facility.name);
        Linking.openURL(`https://maps.google.com/?q=${query}`);
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Banner placeholder */}
                <View style={styles.banner}>
                    <Text style={styles.bannerEmoji}>🏟️</Text>
                </View>

                {/* Info */}
                <View style={styles.content}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{facility.name}</Text>
                        <View style={[styles.statusBadge, facility.status === 'active' ? styles.statusActive : styles.statusInactive]}>
                            <Text style={styles.statusText}>{facility.status === 'active' ? 'Còn sân' : 'Hết sân'}</Text>
                        </View>
                    </View>

                    <Text style={styles.sport}>🏅 {facility.sport?.nameVi || facility.sport?.name}</Text>

                    {/* Stats row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{Number(facility.pricePerHour || 0).toLocaleString('vi-VN')}đ</Text>
                            <Text style={styles.statLabel}>/ giờ</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{facility.courtCount || 1}</Text>
                            <Text style={styles.statLabel}>Sân</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>⭐ {Number(facility.avgRating || 0).toFixed(1)}</Text>
                            <Text style={styles.statLabel}>{facility.reviewCount || 0} đánh giá</Text>
                        </View>
                    </View>

                    {/* Address */}
                    <TouchableOpacity style={styles.infoRow} onPress={handleMap}>
                        <Text style={styles.infoIcon}>📍</Text>
                        <Text style={[styles.infoText, styles.infoLink]}>{facility.address}</Text>
                    </TouchableOpacity>

                    {facility.phone && (
                        <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
                            <Text style={styles.infoIcon}>📞</Text>
                            <Text style={[styles.infoText, styles.infoLink]}>{facility.phone}</Text>
                        </TouchableOpacity>
                    )}

                    {/* Description */}
                    {facility.description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mô tả</Text>
                            <Text style={styles.description}>{facility.description}</Text>
                        </View>
                    )}

                    {/* Quick Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
                            <Text style={styles.actionIcon}>📞</Text>
                            <Text style={styles.actionText}>Gọi điện</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={handleMap}>
                            <Text style={styles.actionIcon}>🗺️</Text>
                            <Text style={styles.actionText}>Xem bản đồ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Book Button */}
            <View style={styles.footer}>
                <View style={styles.priceLabel}>
                    <Text style={styles.priceLabelText}>Giá thuê</Text>
                    <Text style={styles.priceValue}>{Number(facility.pricePerHour || 0).toLocaleString('vi-VN')}đ/giờ</Text>
                </View>
                <TouchableOpacity
                    style={[styles.bookBtn, facility.status !== 'active' && styles.bookBtnDisabled]}
                    onPress={handleBook}
                    disabled={facility.status !== 'active'}
                >
                    {booking ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookBtnText}>Đặt sân ngay</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    banner: {
        height: 220, backgroundColor: '#18458B',
        alignItems: 'center', justifyContent: 'center',
    },
    bannerEmoji: { fontSize: 72 },

    content: { padding: 20 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    title: { fontSize: 20, fontWeight: '800', color: '#111827', flex: 1, marginRight: 10 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    statusActive: { backgroundColor: '#dcfce7' },
    statusInactive: { backgroundColor: '#fee2e2' },
    statusText: { fontSize: 12, fontWeight: '700', color: '#166534' },
    sport: { fontSize: 13, color: '#2563eb', fontWeight: '600', marginBottom: 16 },

    statsRow: {
        flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16,
        padding: 16, marginBottom: 20, alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 16, fontWeight: '800', color: '#18458B' },
    statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
    statDivider: { width: 1, height: 36, backgroundColor: '#e5e7eb' },

    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    infoIcon: { fontSize: 16, marginRight: 8, marginTop: 1 },
    infoText: { fontSize: 14, color: '#374151', flex: 1 },
    infoLink: { color: '#2563eb', textDecorationLine: 'underline' },

    section: { marginTop: 16 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 },
    description: { fontSize: 14, color: '#6b7280', lineHeight: 22 },

    actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    actionBtn: {
        flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14,
        alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    },
    actionIcon: { fontSize: 22, marginBottom: 4 },
    actionText: { fontSize: 12, color: '#374151', fontWeight: '600' },

    footer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 24,
        borderTopWidth: 1, borderTopColor: '#e5e7eb',
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 8,
    },
    priceLabel: { flex: 1 },
    priceLabelText: { fontSize: 12, color: '#6b7280' },
    priceValue: { fontSize: 17, fontWeight: '800', color: '#18458B' },
    bookBtn: {
        backgroundColor: '#18458B', paddingHorizontal: 28, paddingVertical: 14,
        borderRadius: 14, shadowColor: '#18458B', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    bookBtnDisabled: { backgroundColor: '#9ca3af' },
    bookBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
