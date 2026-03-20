import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform,
    ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function RegisterScreen({ navigation }) {
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const set = (field) => (val) => setForm(f => ({ ...f, [field]: val }));

    const handleRegister = async () => {
        if (!form.name || !form.email || !form.password) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }
        if (form.password.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }
        if (form.password !== form.confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
            return;
        }
        try {
            setLoading(true);
            await api.post('/auth/register', {
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                phone: form.phone.trim(),
                password: form.password,
            });
            Alert.alert('🎉 Đăng ký thành công!', 'Tài khoản đã được tạo. Vui lòng đăng nhập.', [
                { text: 'Đăng nhập ngay', onPress: () => navigation.replace('Login') }
            ]);
        } catch (e) {
            Alert.alert('Đăng ký thất bại', e.response?.data?.message || 'Email đã được sử dụng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                {/* Logo */}
                <View style={styles.logoArea}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoEmoji}>🏟️</Text>
                    </View>
                    <Text style={styles.appName}>TìmSân</Text>
                    <Text style={styles.appSub}>Tạo tài khoản miễn phí</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.formTitle}>Đăng ký</Text>

                    <Field label="Họ và tên *" placeholder="Nguyễn Văn A" value={form.name} onChangeText={set('name')} />
                    <Field label="Email *" placeholder="example@email.com" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
                    <Field label="Số điện thoại" placeholder="0901234567" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />

                    {/* Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mật khẩu *</Text>
                        <View style={styles.passRow}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Tối thiểu 6 ký tự"
                                value={form.password}
                                onChangeText={set('password')}
                                secureTextEntry={!showPass}
                                placeholderTextColor="#9ca3af"
                            />
                            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(p => !p)}>
                                <Text>{showPass ? '🙈' : '👁'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Field
                        label="Xác nhận mật khẩu *"
                        placeholder="Nhập lại mật khẩu"
                        value={form.confirmPassword}
                        onChangeText={set('confirmPassword')}
                        secureTextEntry={!showPass}
                    />

                    <TouchableOpacity
                        style={[styles.registerBtn, loading && styles.btnDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>Tạo tài khoản</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLinkText}>
                            Đã có tài khoản? <Text style={styles.loginLinkBold}>Đăng nhập</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// Reusable field component
function Field({ label, ...props }) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput style={styles.input} placeholderTextColor="#9ca3af" {...props} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

    logoArea: { alignItems: 'center', marginBottom: 24 },
    logoCircle: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: '#18458B', alignItems: 'center', justifyContent: 'center',
        marginBottom: 10, shadowColor: '#18458B', shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
    },
    logoEmoji: { fontSize: 32 },
    appName: { fontSize: 24, fontWeight: '800', color: '#18458B' },
    appSub: { fontSize: 13, color: '#6b7280', marginTop: 3 },

    form: {
        backgroundColor: '#fff', borderRadius: 20, padding: 24,
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    },
    formTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 18 },
    inputGroup: { marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 5 },
    input: {
        borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#111827',
        backgroundColor: '#f9fafb',
    },
    passRow: { flexDirection: 'row', alignItems: 'center' },
    eyeBtn: { position: 'absolute', right: 14, padding: 4 },

    registerBtn: {
        backgroundColor: '#18458B', borderRadius: 12, paddingVertical: 14,
        alignItems: 'center', marginTop: 6,
        shadowColor: '#18458B', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    btnDisabled: { opacity: 0.7 },
    registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    loginLink: { alignItems: 'center', marginTop: 14 },
    loginLinkText: { color: '#6b7280', fontSize: 14 },
    loginLinkBold: { color: '#18458B', fontWeight: '700' },
});
