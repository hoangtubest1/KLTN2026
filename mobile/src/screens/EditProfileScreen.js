import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform,
    ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function EditProfileScreen({ navigation }) {
    const { user, login } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [section, setSection] = useState('info'); // 'info' | 'password'

    const handleSaveInfo = async () => {
        if (!name.trim()) { Alert.alert('Lỗi', 'Tên không được để trống'); return; }
        try {
            setLoading(true);
            await api.put('/auth/profile', { name: name.trim(), phone: phone.trim() });
            Alert.alert('✅ Thành công', 'Thông tin đã được cập nhật');
            navigation.goBack();
        } catch (e) {
            Alert.alert('Lỗi', e.response?.data?.message || 'Không thể cập nhật thông tin');
        } finally { setLoading(false); }
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword) { Alert.alert('Lỗi', 'Vui lòng điền đầy đủ'); return; }
        if (newPassword.length < 6) { Alert.alert('Lỗi', 'Mật khẩu mới ít nhất 6 ký tự'); return; }
        if (newPassword !== confirmPassword) { Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp'); return; }
        try {
            setLoading(true);
            await api.put('/auth/change-password', { oldPassword, newPassword });
            Alert.alert('✅ Thành công', 'Mật khẩu đã được đổi thành công');
            setOldPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (e) {
            Alert.alert('Lỗi', e.response?.data?.message || 'Mật khẩu cũ không đúng');
        } finally { setLoading(false); }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {/* Tab selector */}
            <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tab, section === 'info' && styles.tabActive]} onPress={() => setSection('info')}>
                    <Text style={[styles.tabText, section === 'info' && styles.tabTextActive]}>Thông tin</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, section === 'password' && styles.tabActive]} onPress={() => setSection('password')}>
                    <Text style={[styles.tabText, section === 'password' && styles.tabTextActive]}>Đổi mật khẩu</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {section === 'info' ? (
                    <View style={styles.form}>
                        {/* Avatar */}
                        <View style={styles.avatarArea}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{name?.[0]?.toUpperCase() || 'U'}</Text>
                            </View>
                            <Text style={styles.avatarHint}>Ảnh đại diện</Text>
                        </View>

                        <Field label="Họ và tên" value={name} onChangeText={setName} placeholder="Nguyễn Văn A" />
                        <Field label="Email" value={user?.email || ''} editable={false} style={styles.inputDisabled} />
                        <Field label="Số điện thoại" value={phone} onChangeText={setPhone} placeholder="0901234567" keyboardType="phone-pad" />

                        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSaveInfo} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Lưu thay đổi</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.form}>
                        <Field label="Mật khẩu hiện tại" value={oldPassword} onChangeText={setOldPassword} secureTextEntry placeholder="••••••••" />
                        <Field label="Mật khẩu mới" value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Tối thiểu 6 ký tự" />
                        <Field label="Xác nhận mật khẩu mới" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Nhập lại mật khẩu mới" />

                        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleChangePassword} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Đổi mật khẩu</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function Field({ label, style, ...props }) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput style={[styles.input, style]} placeholderTextColor="#9ca3af" {...props} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: '#18458B' },
    tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
    tabTextActive: { color: '#18458B' },
    scroll: { padding: 20 },
    form: {},
    avatarArea: { alignItems: 'center', marginBottom: 24 },
    avatar: {
        width: 72, height: 72, borderRadius: 36, backgroundColor: '#18458B',
        alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
    avatarHint: { fontSize: 12, color: '#9ca3af' },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
    input: {
        borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#fff',
    },
    inputDisabled: { backgroundColor: '#f3f4f6', color: '#9ca3af' },
    btn: {
        backgroundColor: '#18458B', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8,
        shadowColor: '#18458B', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    btnDisabled: { opacity: 0.7 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
