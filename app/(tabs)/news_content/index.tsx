import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// ─── Hardcoded Data ───────────────────────────────────────────────────────────

const CATEGORIES = ['Semua', 'Lingkungan', 'Pengumuman', 'Aktiviti', 'Kesihatan'];

const ALERT = {
  id: 'a1',
  message: 'Amaran Banjir Kilat di Kampung Punggol',
};

const FEATURED = {
  id: 'f1',
  title: 'Program Derma Darah Komuniti',
  category: 'Aktiviti Komuniti',
  likes: 100,
  comments: 100,
  image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80',
};

const NEWS = [
  {
    id: '1',
    title: 'Gotong Royong Bersih Lingkungan Minggu Ini',
    category: 'Lingkungan',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80',
    date: '11 Feb 2026',
  },
  {
    id: '2',
    title: 'Bali Perpanjang Siaga Bencana Cuaca Ekstrem 2026',
    category: 'Pengumuman',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=200&q=80',
    date: '10 Feb 2026',
  },
  {
    id: '3',
    title: 'Klinik Kesihatan Desa Buka Setiap Sabtu',
    category: 'Kesihatan',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&q=80',
    date: '9 Feb 2026',
  },
  {
    id: '4',
    title: 'Mesyuarat Penduduk Blok B Dijadualkan Semula',
    category: 'Pengumuman',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=200&q=80',
    date: '8 Feb 2026',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function BeritaIndex() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [search, setSearch] = useState('');

  const filteredNews = NEWS.filter((n) => {
    const matchCat = activeCategory === 'Semua' || n.category === activeCategory;
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Search Bar ── */}
      <View style={styles.searchRow}>
        <TouchableOpacity style={styles.menuBtn}>
          <View style={styles.menuLine} />
          <View style={[styles.menuLine, { width: 14 }]} />
          <View style={styles.menuLine} />
        </TouchableOpacity>

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Masukkan kata kunci"
            placeholderTextColor="#AABFBA"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <TouchableOpacity style={styles.searchIconBtn}>
          <Text style={styles.searchIconText}>⌕</Text>
        </TouchableOpacity>
      </View>

      {/* ── Category Pills ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catPill, activeCategory === cat && styles.catPillActive]}
            onPress={() => setActiveCategory(cat)}
            activeOpacity={0.8}
          >
            <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 }]}
      >
        {/* ── Alert Banner ── */}
        <View style={styles.alertCard}>
          <View style={styles.alertIcon}>
            <Text style={styles.alertIconText}>!</Text>
          </View>
          <Text style={styles.alertText}>{ALERT.message}</Text>
        </View>

        {/* ── Featured Card ── */}
        <TouchableOpacity
          style={[styles.featuredCard, { width: width - 32 }]}
          activeOpacity={0.92}
          onPress={() => router.push(`/(tabs)/news_content/${FEATURED.id}` as any)}
        >
          <Image source={{ uri: FEATURED.image }} style={styles.featuredImage} />
          <View style={styles.featuredOverlay} />
          <View style={styles.featuredBottom}>
            <Text style={styles.featuredTitle}>{FEATURED.title}</Text>
            <View style={styles.featuredMeta}>
              <View style={styles.featuredTag}>
                <Text style={styles.featuredTagText}>{FEATURED.category}</Text>
              </View>
              <View style={styles.featuredStats}>
                <Text style={styles.statText}>♡ {FEATURED.likes}</Text>
                <Text style={[styles.statText, { marginLeft: 10 }]}>◯ {FEATURED.comments}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── News List ── */}
        <View style={styles.newsList}>
          {filteredNews.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.newsCard}
              activeOpacity={0.88}
              onPress={() => router.push(`/(tabs)/news_content/${item.id}` as any)}
            >
              <Image source={{ uri: item.image }} style={styles.newsImage} />
              <View style={styles.newsInfo}>
                <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.newsFooter}>
                  <View style={[styles.newsCatTag, { backgroundColor: getCatColor(item.category) }]}>
                    <Text style={styles.newsCatText}>{item.category}</Text>
                  </View>
                  <Text style={styles.newsDate}>{item.date}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCatColor(cat: string) {
  const map: Record<string, string> = {
    Lingkungan: '#E8F9EF',
    Pengumuman: '#FFF0E8',
    Aktiviti: '#E8F0FF',
    Kesihatan: '#FFF0F0',
    'Aktiviti Komuniti': '#E8F9EF',
  };
  return map[cat] ?? '#F0F4F3';
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const GREEN = '#3FCC54';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAF9',
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    gap: 10,
  },
  menuBtn: {
    padding: 4,
    gap: 4,
    justifyContent: 'center',
  },
  menuLine: {
    width: 18,
    height: 2,
    backgroundColor: '#1A2E27',
    borderRadius: 2,
    marginVertical: 2,
  },
  searchWrap: {
    flex: 1,
    backgroundColor: '#F4FAF7',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5EFEC',
  },
  searchInput: {
    fontSize: 13,
    color: '#1A2E27',
    paddingVertical: 9,
  },
  searchIconBtn: {
    padding: 4,
  },
  searchIconText: {
    fontSize: 22,
    color: '#1A2E27',
  },

  // Categories
  catScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF3F1',
  },
  catContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F4FAF7',
    borderWidth: 1,
    borderColor: '#E5EFEC',
    marginRight: 8,
  },
  catPillActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  catText: {
    fontSize: 13,
    color: '#6B8880',
    fontWeight: '500',
  },
  catTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  scrollContent: {
    padding: 16,
    gap: 14,
  },

  // Alert
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE8E8',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 14,
  },
  alertIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E05252',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIconText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: '#A03030',
    fontWeight: '500',
    lineHeight: 18,
  },

  // Featured
  featuredCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    marginBottom: 14,
    alignSelf: 'center',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  featuredBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  featuredTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  featuredStats: {
    flexDirection: 'row',
  },
  statText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },

  // News list
  newsList: {
    gap: 12,
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0A3D2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  newsImage: {
    width: 100,
    height: 90,
  },
  newsInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  newsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A2E27',
    lineHeight: 18,
  },
  newsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  newsCatTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  newsCatText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3A6A58',
  },
  newsDate: {
    fontSize: 11,
    color: '#AABFBA',
  },
});