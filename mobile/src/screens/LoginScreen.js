import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform,
    ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
            return;
        }
        try {
            setLoading(true);
            await login(email.trim().toLowerCase(), password);
            // Navigate về Trang Chủ trước, sau đó show thông báo
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            setTimeout(() => {
                Alert.alert('✅ Đăng nhập thành công!', 'Chào mừng bạn trở lại!');
            }, 300);
        } catch (e) {
            Alert.alert('Đăng nhập thất bại', e.response?.data?.message || 'Sai email hoặc mật khẩu');
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
                    <Text style={styles.appSub}>Đặt sân thể thao dễ dàng</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.formTitle}>Đăng nhập</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="example@email.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mật khẩu</Text>
                        <View style={styles.passContainer}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="••••••••"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPass}
                                placeholderTextColor="#9ca3af"
                            />
                            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(p => !p)}>
                                <Text>{showPass ? '🙈' : '👁'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.forgotLink} onPress={() => navigation.navigate('ForgotPassword')}>
                        <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginBtnText}>Đăng nhập</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.registerLinkText}>
                            Chưa có tài khoản? <Text style={styles.registerLinkBold}>Đăng ký ngay</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

    logoArea: { alignItems: 'center', marginBottom: 32 },
    logoCircle: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: '#18458B', alignItems: 'center', justifyContent: 'center',
        marginBottom: 12, shadowColor: '#18458B', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    },
    logoEmoji: { fontSize: 40 },
    appName: { fontSize: 28, fontWeight: '800', color: '#18458B', letterSpacing: 0.5 },
    appSub: { fontSize: 14, color: '#6b7280', marginTop: 4 },

    form: {
        backgroundColor: '#fff', borderRadius: 20, padding: 24,
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    },
    formTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
    input: {
        borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827',
        backgroundColor: '#f9fafb',
    },
    passContainer: { flexDirection: 'row', alignItems: 'center' },
    eyeBtn: { position: 'absolute', right: 14, padding: 4 },

    forgotLink: { alignItems: 'flex-end', marginTop: -6, marginBottom: 10 },
    forgotText: { color: '#2563eb', fontSize: 13, fontWeight: '600' },

    loginBtn: {
        backgroundColor: '#18458B', borderRadius: 12, paddingVertical: 14,
        alignItems: 'center', marginTop: 8,
        shadowColor: '#18458B', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    loginBtnDisabled: { opacity: 0.7 },
    loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    registerLink: { alignItems: 'center', marginTop: 16 },
    registerLinkText: { color: '#6b7280', fontSize: 14 },
    registerLinkBold: { color: '#18458B', fontWeight: '700' },
});
