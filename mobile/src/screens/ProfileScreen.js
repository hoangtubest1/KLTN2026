import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
    const { user, logout, isAuthenticated } = useAuth();

    const handleLogout = () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
            { text: 'Hủy' },
            { text: 'Đăng xuất', style: 'destructive', onPress: logout }
        ]);
    };

    if (!isAuthenticated) return (
        <View style={styles.center}>
            <Text style={styles.icon}>👤</Text>
            <Text style={styles.title}>Chưa đăng nhập</Text>
            <Text style={styles.sub}>Đăng nhập để quản lý tài khoản và lịch đặt sân</Text>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.btnText}>Đăng nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('Register')}>
                <Text style={styles.btnOutlineText}>Đăng ký tài khoản</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            {/* Avatar */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
                </View>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.email}>{user?.email}</Text>
                {user?.role === 'admin' && (
                    <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>⚙️ Quản trị viên</Text>
                    </View>
                )}
            </View>

            {/* Menu */}
            <View style={styles.menu}>
                <MenuItem icon="✏️" label="Chỉnh sửa hồ sơ" onPress={() => navigation.navigate('EditProfile')} />
                <MenuItem icon="📅" label="Lịch đặt của tôi" onPress={() => navigation.navigate('Bookings')} />
                <MenuItem icon="🏟️" label="Tìm sân gần đây" onPress={() => navigation.navigate('Home')} />
                <MenuItem icon="📞" label="Liên hệ hỗ trợ" onPress={() => { }} />
                <MenuItem icon="ℹ️" label="Về ứng dụng" onPress={() => { }} />
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>🚪 Đăng xuất</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

function MenuItem({ icon, label, onPress }) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
            <Text style={styles.menuIcon}>{icon}</Text>
            <Text style={styles.menuLabel}>{label}</Text>
            <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    icon: { fontSize: 64, marginBottom: 16 },
    title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
    sub: { color: '#6b7280', textAlign: 'center', fontSize: 14, marginBottom: 24 },
    btn: {
        backgroundColor: '#18458B', paddingHorizontal: 32, paddingVertical: 14,
        borderRadius: 14, width: '100%', alignItems: 'center', marginBottom: 12,
    },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    btnOutline: {
        borderWidth: 2, borderColor: '#18458B', paddingHorizontal: 32,
        paddingVertical: 13, borderRadius: 14, width: '100%', alignItems: 'center',
    },
    btnOutlineText: { color: '#18458B', fontSize: 16, fontWeight: '700' },

    header: { alignItems: 'center', backgroundColor: '#18458B', paddingVertical: 40, paddingHorizontal: 24 },
    avatar: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFD700',
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    avatarText: { fontSize: 32, fontWeight: '800', color: '#18458B' },
    name: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
    email: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
    adminBadge: {
        marginTop: 10, backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
    },
    adminBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    menu: {
        backgroundColor: '#fff', margin: 16, borderRadius: 16,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
        paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },
    menuIcon: { fontSize: 20, marginRight: 12 },
    menuLabel: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
    menuArrow: { fontSize: 22, color: '#9ca3af' },

    logoutBtn: {
        margin: 16, marginTop: 0, backgroundColor: '#fee2e2',
        paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    },
    logoutBtnText: { color: '#991b1b', fontSize: 15, fontWeight: '700' },
});
