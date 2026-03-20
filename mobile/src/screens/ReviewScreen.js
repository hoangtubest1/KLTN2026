import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    TextInput, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import api from '../api';

export default function ReviewScreen({ route, navigation }) {
    const { booking } = route.params;
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Lỗi', 'Vui lòng chọn số sao đánh giá');
            return;
        }
        try {
            setLoading(true);
            await api.post('/reviews', {
                facilityId: booking.facilityId,
                bookingId: booking.id,
                rating,
                comment: comment.trim(),
            });
            Alert.alert('🎉 Cảm ơn bạn!', 'Đánh giá đã được gửi thành công.', [
                { text: 'Quay lại', onPress: () => navigation.goBack() }
            ]);
        } catch (e) {
            Alert.alert('Lỗi', e.response?.data?.message || 'Không thể gửi đánh giá');
        } finally {
            setLoading(false);
        }
    };

    const LABELS = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Facility info */}
            <View style={styles.facilityCard}>
                <Text style={styles.facilityEmoji}>🏟️</Text>
                <View style={{ flex: 1 }}>
                    <Text style={styles.facilityName}>{booking.facilityName}</Text>
                    <Text style={styles.facilityDate}>
                        {new Date(booking.date).toLocaleDateString('vi-VN')} • {booking.startTime?.slice(0, 5)} – {booking.endTime?.slice(0, 5)}
                    </Text>
                </View>
            </View>

            {/* Stars */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Đánh giá sao</Text>
                <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map(s => (
                        <TouchableOpacity key={s} onPress={() => setRating(s)} style={styles.starBtn}>
                            <Text style={[styles.star, s <= rating && styles.starActive]}>★</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {rating > 0 && (
                    <Text style={styles.ratingLabel}>{LABELS[rating]}</Text>
                )}
            </View>

            {/* Comment */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nhận xét <Text style={styles.optional}>(không bắt buộc)</Text></Text>
                <TextInput
                    style={styles.commentInput}
                    placeholder="Chia sẻ trải nghiệm của bạn về sân..."
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    numberOfLines={5}
                    placeholderTextColor="#9ca3af"
                    textAlignVertical="top"
                />
                <Text style={styles.charCount}>{comment.length}/500</Text>
            </View>

            <TouchableOpacity
                style={[styles.submitBtn, (loading || rating === 0) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading || rating === 0}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Gửi đánh giá</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { padding: 20 },

    facilityCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 16, padding: 16, marginBottom: 20, gap: 12,
        shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
    },
    facilityEmoji: { fontSize: 36 },
    facilityName: { fontSize: 15, fontWeight: '700', color: '#111827' },
    facilityDate: { fontSize: 13, color: '#6b7280', marginTop: 3 },

    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
    optional: { fontWeight: '400', color: '#9ca3af', fontSize: 13 },

    starsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    starBtn: { padding: 4 },
    star: { fontSize: 44, color: '#d1d5db' },
    starActive: { color: '#f59e0b' },
    ratingLabel: { fontSize: 16, fontWeight: '600', color: '#374151', textAlign: 'center', marginTop: 4 },

    commentInput: {
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db',
        borderRadius: 12, padding: 14, fontSize: 15, color: '#111827',
        minHeight: 120,
    },
    charCount: { textAlign: 'right', fontSize: 12, color: '#9ca3af', marginTop: 4 },

    submitBtn: {
        backgroundColor: '#18458B', borderRadius: 14, paddingVertical: 16,
        alignItems: 'center', shadowColor: '#18458B', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    submitBtnDisabled: { backgroundColor: '#9ca3af', shadowOpacity: 0 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
