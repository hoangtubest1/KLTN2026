import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Image, TextInput
} from 'react-native';
import api from '../api';

export default function HomeScreen({ navigation }) {
    const [facilities, setFacilities] = useState([]);
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedSport, setSelectedSport] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [fRes, sRes] = await Promise.all([
                api.get('/facilities'),
                api.get('/sports'),
            ]);
            setFacilities(fRes.data);
            setSports(sRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = facilities.filter(f => {
        const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || (f.address || '').toLowerCase().includes(search.toLowerCase());
        const matchSport = !selectedSport || f.sportId === selectedSport;
        return matchSearch && matchSport;
    });

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#18458B" />
            <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm sân theo tên, địa chỉ..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor="#9ca3af"
                />
            </View>

            {/* Sport Filter */}
            <FlatList
                data={[{ id: '', name: 'Tất cả', nameVi: 'Tất cả' }, ...sports]}
                keyExtractor={s => String(s.id)}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.sportFilter}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.sportChip, selectedSport === item.id && styles.sportChipActive]}
                        onPress={() => setSelectedSport(item.id)}
                    >
                        <Text style={[styles.sportChipText, selectedSport === item.id && styles.sportChipTextActive]}>
                            {item.nameVi || item.name}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            {/* Facilities List */}
            <FlatList
                data={filtered}
                keyExtractor={f => String(f.id)}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.center}>
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
                            <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                                <Text style={{ fontSize: 36 }}>🏟️</Text>
                            </View>
                        )}
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.cardSport}>{item.sport?.nameVi || item.sport?.name}</Text>
                            <Text style={styles.cardAddress} numberOfLines={2}>📍 {item.address}</Text>
                            <View style={styles.cardFooter}>
                                <Text style={styles.cardPrice}>
                                    {Number(item.pricePerHour || 0).toLocaleString('vi-VN')}đ/giờ
                                </Text>
                                <View style={[styles.statusBadge, item.status === 'active' ? styles.statusActive : styles.statusInactive]}>
                                    <Text style={styles.statusText}>{item.status === 'active' ? 'Còn sân' : 'Hết sân'}</Text>
                                </View>
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
    loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
    emptyText: { color: '#9ca3af', fontSize: 16 },

    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', margin: 16, marginBottom: 8,
        borderRadius: 12, paddingHorizontal: 14,
        borderWidth: 1, borderColor: '#e5e7eb',
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    searchIcon: { fontSize: 16, marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15, color: '#111827', paddingVertical: 12 },

    sportFilter: { paddingLeft: 16, marginBottom: 8, flexGrow: 0 },
    sportChip: {
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
        backgroundColor: '#f3f4f6', marginRight: 8, borderWidth: 1, borderColor: '#e5e7eb',
    },
    sportChipActive: { backgroundColor: '#18458B', borderColor: '#18458B' },
    sportChipText: { color: '#374151', fontSize: 13, fontWeight: '500' },
    sportChipTextActive: { color: '#fff' },

    list: { padding: 16, paddingTop: 8 },
    card: {
        backgroundColor: '#fff', borderRadius: 16, marginBottom: 14,
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
        overflow: 'hidden',
    },
    cardImage: { width: '100%', height: 160, backgroundColor: '#e5e7eb' },
    cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
    cardContent: { padding: 14 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 3 },
    cardSport: { fontSize: 12, color: '#2563eb', fontWeight: '600', marginBottom: 6 },
    cardAddress: { fontSize: 13, color: '#6b7280', marginBottom: 10 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardPrice: { fontSize: 15, fontWeight: '700', color: '#18458B' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusActive: { backgroundColor: '#dcfce7' },
    statusInactive: { backgroundColor: '#fee2e2' },
    statusText: { fontSize: 12, fontWeight: '600', color: '#166534' },
});
