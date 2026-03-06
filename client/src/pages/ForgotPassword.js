import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password, 4: success
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 1: Send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/forgot-password', { email });
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra');
        }
        setLoading(false);
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/verify-otp', { email, otp });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Mã OTP không hợp lệ');
        }
        setLoading(false);
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/reset-password', {
                email,
                otp,
                newPassword
            });
            setStep(4);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra');
        }
        setLoading(false);
    };

    // Resend OTP
    const handleResendOTP = async () => {
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/forgot-password', { email });
            setError('');
            alert('Mã OTP mới đã được gửi!');
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra');
        }
        setLoading(false);
    };

    const getStepInfo = () => {
        switch (step) {
            case 1: return { title: 'Quên Mật Khẩu', subtitle: 'Nhập email để nhận mã xác nhận', icon: '🔐' };
            case 2: return { title: 'Nhập Mã OTP', subtitle: `Mã đã được gửi đến ${email}`, icon: '📧' };
            case 3: return { title: 'Đặt Mật Khẩu Mới', subtitle: 'Tạo mật khẩu mới cho tài khoản', icon: '🔑' };
            case 4: return { title: 'Thành Công!', subtitle: 'Mật khẩu đã được đặt lại', icon: '✅' };
            default: return {};
        }
    };

    const stepInfo = getStepInfo();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-6">
                        <div className="text-4xl text-center mb-2">{stepInfo.icon}</div>
                        <h2 className="text-3xl font-bold text-white text-center">{stepInfo.title}</h2>
                        <p className="text-amber-100 text-center mt-2 text-sm">{stepInfo.subtitle}</p>

                        {/* Step Indicator */}
                        {step < 4 && (
                            <div className="flex justify-center gap-2 mt-4">
                                {[1, 2, 3].map((s) => (
                                    <div
                                        key={s}
                                        className={`h-2 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-white' : s < step ? 'w-8 bg-white/60' : 'w-8 bg-white/30'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="px-8 py-8">
                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* Step 1: Enter Email */}
                        {step === 1 && (
                            <form onSubmit={handleSendOTP} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email đã đăng ký *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                            </svg>
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                            required
                                            placeholder="email@example.com"
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Đang gửi...' : 'Gửi Mã Xác Nhận'}
                                </button>
                            </form>
                        )}

                        {/* Step 2: Enter OTP */}
                        {step === 2 && (
                            <form onSubmit={handleVerifyOTP} className="space-y-6">
                                <div>
                                    <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Mã OTP (6 số) *
                                    </label>
                                    <input
                                        id="otp"
                                        type="text"
                                        value={otp}
                                        onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                                        required
                                        maxLength={6}
                                        placeholder="Nhập mã 6 số"
                                        className="block w-full text-center text-2xl font-bold tracking-[0.5em] py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 placeholder:text-base placeholder:tracking-normal placeholder:font-normal"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Đang xác nhận...' : 'Xác Nhận Mã OTP'}
                                </button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        disabled={loading}
                                        className="text-sm text-amber-600 hover:text-orange-600 font-medium transition-colors disabled:opacity-50"
                                    >
                                        Gửi lại mã OTP
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 3: New Password */}
                        {step === 3 && (
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Mật khẩu mới *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <input
                                            id="newPassword"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                                            required
                                            minLength={6}
                                            placeholder="Ít nhất 6 ký tự"
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Xác nhận mật khẩu *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                                            required
                                            minLength={6}
                                            placeholder="Nhập lại mật khẩu"
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Đang đặt lại...' : 'Đặt Lại Mật Khẩu'}
                                </button>
                            </form>
                        )}

                        {/* Step 4: Success */}
                        {step === 4 && (
                            <div className="text-center space-y-6">
                                <div className="text-6xl">🎉</div>
                                <p className="text-gray-700">
                                    Mật khẩu của bạn đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới.
                                </p>
                                <Link
                                    to="/login"
                                    className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl text-center"
                                >
                                    Đăng Nhập Ngay
                                </Link>
                            </div>
                        )}

                        {/* Back to Login */}
                        {step < 4 && (
                            <p className="mt-6 text-center text-sm text-gray-600">
                                <Link
                                    to="/login"
                                    className="font-semibold text-amber-600 hover:text-orange-600 transition-colors duration-200"
                                >
                                    ← Quay lại Đăng Nhập
                                </Link>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
