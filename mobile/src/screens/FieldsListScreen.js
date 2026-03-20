import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, TextInput, ActivityIndicator, Image
} from 'react-native';
import api from '../api';

export default function FieldsListScreen({ navigation }) {
    const [facilities, setFacilities] = useState([]);
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedSport, setSelectedSport] = useState('');
    const [sortBy, setSortBy] = useState(''); // 'price_asc','price_desc','rating'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [fRes, sRes] = await Promise.all([api.get('/facilities'), api.get('/sports')]);
            setFacilities(fRes.data);
            setSports(sRes.data);
        } catch { }
        finally { setLoading(false); }
    };

    const filtered = facilities
        .filter(f => {
            const q = search.toLowerCase();
            const matchSearch = !q || f.name.toLowerCase().includes(q) || (f.address || '').toLowerCase().includes(q);
            const matchSport = !selectedSport || String(f.sportId) === String(selectedSport);
            return matchSearch && matchSport;
        })
        .sort((a, b) => {
            if (sortBy === 'price_asc') return (a.pricePerHour || 0) - (b.pricePerHour || 0);
            if (sortBy === 'price_desc') return (b.pricePerHour || 0) - (a.pricePerHour || 0);
            if (sortBy === 'rating') return (b.avgRating || 0) - (a.avgRating || 0);
            return 0;
        });

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#18458B" />
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Search */}
            <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm theo tên, địa chỉ..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor="#9ca3af"
                />
                {search ? (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Text style={{ color: '#9ca3af', fontSize: 18 }}>✕</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Filters Row */}
            <View style={styles.filterRow}>
                {/* Sport filter */}
                <FlatList
                    data={[{ id: '', nameVi: 'Tất cả' }, ...sports]}
                    keyExtractor={s => String(s.id)}
                    horizontal showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.chip, String(selectedSport) === String(item.id) && styles.chipActive]}
                            onPress={() => setSelectedSport(item.id)}
                        >
                            <Text style={[styles.chipText, String(selectedSport) === String(item.id) && styles.chipTextActive]}>
                                {item.nameVi || item.name}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Sort */}
            <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>Sắp xếp:</Text>
                {[
                    { key: '', label: 'Mặc định' },
                    { key: 'price_asc', label: 'Giá ↑' },
                    { key: 'price_desc', label: 'Giá ↓' },
                    { key: 'rating', label: '⭐ Rating' },
                ].map(s => (
                    <TouchableOpacity
                        key={s.key}
                        style={[styles.sortBtn, sortBy === s.key && styles.sortBtnActive]}
                        onPress={() => setSortBy(s.key)}
                    >
                        <Text style={[styles.sortBtnText, sortBy === s.key && styles.sortBtnTextActive]}>{s.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Results count */}
            <Text style={styles.resultCount}>{filtered.length} sân tìm thấy</Text>

            <FlatList
                data={filtered}
                keyExtractor={f => String(f.id)}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={{ fontSize: 40, marginBottom: 10 }}>🔍</Text>
                        <Text style={styles.emptyText}>Không tìm thấy sân nào</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('FacilityDetail', { facility: item })}
                        activeOpacity={0.85}
                    >
                        {item.image ? (
                            <Image source={{ uri: item.image }} style={styles.cardImage} />
                        ) : (
                            <View style={[styles.cardImage, styles.imagePlaceholder]}>
                                <Text style={{ fontSize: 32 }}>🏟️</Text>
                            </View>
                        )}
                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.cardSport}>{item.sport?.nameVi || item.sport?.name}</Text>
                            <Text style={styles.cardAddress} numberOfLines={1}>📍 {item.address}</Text>
                            <View style={styles.cardFooter}>
                                <Text style={styles.cardPrice}>
                                    {Number(item.pricePerHour || 0).toLocaleString('vi-VN')}đ/h
                                </Text>
                                <Text style={styles.cardRating}>⭐ {Number(item.avgRating || 0).toFixed(1)}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyText: { color: '#9ca3af', fontSize: 16 },

    searchBar: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        margin: 12, marginBottom: 6, borderRadius: 12, paddingHorizontal: 12,
        borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000',
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    searchIcon: { fontSize: 15, marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15, color: '#111827', paddingVertical: 11 },

    filterRow: { paddingLeft: 12, marginBottom: 8 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f3f4f6',
        marginRight: 8, borderWidth: 1, borderColor: '#e5e7eb',
    },
    chipActive: { backgroundColor: '#18458B', borderColor: '#18458B' },
    chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
    chipTextActive: { color: '#fff' },

    sortRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 6 },
    sortLabel: { fontSize: 12, color: '#6b7280', marginRight: 8 },
    sortBtn: {
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#f3f4f6',
        marginRight: 6, borderWidth: 1, borderColor: '#e5e7eb',
    },
    sortBtnActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
    sortBtnText: { fontSize: 12, color: '#374151' },
    sortBtnTextActive: { color: '#2563eb', fontWeight: '700' },

    resultCount: { fontSize: 12, color: '#6b7280', paddingHorizontal: 14, marginBottom: 6 },

    list: { paddingHorizontal: 12 },
    card: {
        flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginBottom: 10,
        overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
    },
    cardImage: { width: 100, height: 100, backgroundColor: '#e5e7eb' },
    imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
    cardBody: { flex: 1, padding: 12, justifyContent: 'space-between' },
    cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
    cardSport: { fontSize: 11, color: '#2563eb', fontWeight: '600' },
    cardAddress: { fontSize: 12, color: '#6b7280' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardPrice: { fontSize: 14, fontWeight: '800', color: '#18458B' },
    cardRating: { fontSize: 12, color: '#374151' },
});
