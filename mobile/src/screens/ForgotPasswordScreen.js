import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform,
    ScrollView, ActivityIndicator, Alert
} from 'react-native';
import api from '../api';

export default function ForgotPasswordScreen({ navigation }) {
    const [step, setStep] = useState(1); // 1: email, 2: otp+newpass
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        if (!email) { Alert.alert('Lỗi', 'Vui lòng nhập email'); return; }
        try {
            setLoading(true);
            await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
            Alert.alert('✅ Đã gửi!', 'Vui lòng kiểm tra email của bạn để lấy mã OTP');
            setStep(2);
        } catch (e) {
            Alert.alert('Lỗi', e.response?.data?.message || 'Email không tồn tại trong hệ thống');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp || !newPassword) { Alert.alert('Lỗi', 'Vui lòng điền đầy đủ'); return; }
        if (newPassword.length < 6) { Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự'); return; }
        if (newPassword !== confirmPassword) { Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp'); return; }
        try {
            setLoading(true);
            await api.post('/auth/reset-password', {
                email: email.trim().toLowerCase(),
                otp: otp.trim(),
                newPassword,
            });
            Alert.alert('🎉 Thành công!', 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập.', [
                { text: 'Đăng nhập ngay', onPress: () => navigation.replace('Login') }
            ]);
        } catch (e) {
            Alert.alert('Lỗi', e.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                <View style={styles.logo}>
                    <Text style={styles.logoEmoji}>🔑</Text>
                    <Text style={styles.title}>Quên mật khẩu</Text>
                    <Text style={styles.sub}>
                        {step === 1 ? 'Nhập email để nhận mã OTP' : 'Nhập mã OTP và mật khẩu mới'}
                    </Text>
                </View>

                {/* Step indicator */}
                <View style={styles.steps}>
                    <View style={[styles.step, styles.stepDone]}><Text style={styles.stepNum}>1</Text></View>
                    <View style={[styles.stepLine, step === 2 && styles.stepLineDone]} />
                    <View style={[styles.step, step === 2 && styles.stepDone]}><Text style={styles.stepNum}>2</Text></View>
                </View>

                <View style={styles.form}>
                    {step === 1 ? (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email đăng ký</Text>
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
                            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSendOTP} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Gửi mã OTP</Text>}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Mã OTP (từ email)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập mã 6 số"
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="number-pad"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Mật khẩu mới</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Tối thiểu 6 ký tự"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Xác nhận mật khẩu</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập lại mật khẩu mới"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleResetPassword} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Đặt lại mật khẩu</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                                <Text style={styles.backBtnText}>← Gửi lại OTP</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLinkText}>Quay lại <Text style={styles.loginLinkBold}>Đăng nhập</Text></Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    logo: { alignItems: 'center', marginBottom: 24 },
    logoEmoji: { fontSize: 52, marginBottom: 10 },
    title: { fontSize: 22, fontWeight: '800', color: '#111827' },
    sub: { fontSize: 14, color: '#6b7280', marginTop: 4, textAlign: 'center' },

    steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    step: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb',
        alignItems: 'center', justifyContent: 'center',
    },
    stepDone: { backgroundColor: '#18458B' },
    stepNum: { color: '#fff', fontWeight: '700', fontSize: 14 },
    stepLine: { width: 60, height: 2, backgroundColor: '#e5e7eb', marginHorizontal: 8 },
    stepLineDone: { backgroundColor: '#18458B' },

    form: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
    input: {
        borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#f9fafb',
    },
    btn: {
        backgroundColor: '#18458B', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6,
        shadowColor: '#18458B', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    btnDisabled: { opacity: 0.7 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    backBtn: { alignItems: 'center', marginTop: 12 },
    backBtnText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
    loginLink: { alignItems: 'center', marginTop: 16 },
    loginLinkText: { color: '#6b7280', fontSize: 14 },
    loginLinkBold: { color: '#18458B', fontWeight: '700' },
});
