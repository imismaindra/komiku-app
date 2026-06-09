import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';
import { addReadHistory } from '@/database/db';
import { fetchChapterDetail } from '@/services/mangaApi';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ChapterDetail, ChapterPage } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MangaPageProps {
  item: ChapterPage;
  onPress: () => void;
}

function MangaPage({ item, onPress }: MangaPageProps) {
  const [aspectRatio, setAspectRatio] = useState(0.7);

  return (
    <Pressable style={styles.pageWrapper} onPress={onPress}>
      <Image
        source={{ uri: item.image_url }}
        style={[
          styles.pageImage,
          {
            width: SCREEN_WIDTH,
            aspectRatio: aspectRatio,
          },
        ]}
        contentFit="contain"
        onLoad={(e) => {
          const { width, height } = e.source;
          if (width && height) {
            setAspectRatio(width / height);
          }
        }}
        transition={200}
      />
    </Pressable>
  );
}

export default function ChapterReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chapterId = Array.isArray(id) ? id[0] : id;
  const theme = useTheme();
  const { state: authState } = useAuth();
  const userId = authState.user?.id;

  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUI, setShowUI] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const flatRef = useRef<FlatList>(null);

  // Load Chapter Detail and Log Reading History
  useEffect(() => {
    if (!chapterId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetchChapterDetail(chapterId);
        if (res.retcode === 0) {
          const data = res.data;
          setChapter(data);
          
          // Log Reading history in background
          if (userId && data) {
            await addReadHistory(userId, data.manga_id, chapterId, data.chapter_number);
          }
        } else {
          setError('Chapter tidak ditemukan');
        }
      } catch {
        setError('Gagal memuat chapter');
      } finally {
        setLoading(false);
      }
    })();
  }, [chapterId, userId]);

  // Keep track of scroll position/page count
  const onViewableItemsChanged = useMemo(() => ({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (typeof index === 'number') {
        setCurrentPage(index + 1);
      }
    }
  }, []);

  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
  }), []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: '#06060A' }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Mengunduh halaman komik...</Text>
      </View>
    );
  }

  if (error || !chapter) {
    return (
      <View style={[styles.center, { backgroundColor: '#06060A' }]}>
        <Ionicons name="alert-circle-outline" size={54} color={theme.accent} />
        <Text style={[styles.errorTitle, { color: theme.text }]}>Gagal Memuat</Text>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>{error ?? 'Chapter tidak ditemukan'}</Text>
        <Pressable
          style={[styles.backBtn, { backgroundColor: theme.accent }]}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
        >
          <Ionicons name="chevron-back" size={18} color="#fff" />
          <Text style={styles.backBtnText}>Kembali</Text>
        </Pressable>
      </View>
    );
  }

  const renderPage = ({ item }: { item: ChapterPage }) => (
    <MangaPage item={item} onPress={() => setShowUI(!showUI)} />
  );

  return (
    <View style={styles.root}>
      {/* Main FlatList Reader */}
      <FlatList
        ref={flatRef}
        data={chapter.pages}
        renderItem={renderPage}
        keyExtractor={(item) => item.page_number.toString()}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListHeaderComponent={
          <View style={styles.chapterHeader}>
            <Text style={[styles.chapterNum, { color: theme.accent }]}>
              Chapter {chapter.chapter_number}
              {chapter.title ? ` - ${chapter.title}` : ''}
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
              <Text style={styles.footerText}>Anda telah selesai membaca Bab {chapter.chapter_number}</Text>
            </View>
            {chapter.next_chapter_id && (
              <Pressable
                style={[styles.nextBtn, { backgroundColor: theme.accent }]}
                onPress={() => router.replace(`/chapter/${chapter.next_chapter_id}` as any)}
              >
                <Text style={styles.nextBtnText}>Chapter Berikutnya</Text>
                <Ionicons name="chevron-forward" size={18} color="#fff" style={{ marginLeft: 2 }} />
              </Pressable>
            )}
            <Pressable
              style={styles.backToDetailBtn}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace(`/manga/${chapter.manga_id}` as any);
                }
              }}
            >
              <Ionicons name="chevron-back" size={16} color="#94A3B8" />
              <Text style={styles.backToDetailText}>Kembali ke Detail</Text>
            </Pressable>
          </View>
        }
      />

      {/* Floating HUD Controller */}
      {showUI && (
        <SafeAreaView style={styles.hudContainer} pointerEvents="box-none">
          {/* Top HUD Row */}
          <View style={styles.hudTop}>
            <Pressable
              style={styles.hudBtn}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace(`/manga/${chapter.manga_id}` as any);
                }
              }}
            >
              <Ionicons name="chevron-back" size={18} color="#fff" style={{ marginRight: 2 }} />
            </Pressable>
            
            <View style={styles.hudInfo}>
              <Text style={styles.hudChapterTitle} numberOfLines={1}>
                Chapter {chapter.chapter_number}
                {chapter.title ? ` - ${chapter.title}` : ''}
              </Text>
              <Text style={styles.hudPageCount}>{currentPage} / {chapter.pages.length} Halaman</Text>
            </View>
 
            {chapter.next_chapter_id ? (
              <Pressable
                style={[styles.hudBtn, { backgroundColor: theme.accent }]}
                onPress={() => router.replace(`/chapter/${chapter.next_chapter_id}` as any)}
              >
                <Ionicons name="chevron-forward" size={18} color="#fff" style={{ marginLeft: 2 }} />
              </Pressable>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          {/* Bottom HUD Settings console */}
          <View style={styles.hudBottom}>
            {/* Reading progress slider representation */}
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: theme.accent,
                    width: `${(currentPage / chapter.pages.length) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    fontWeight: '600',
  },
  errorEmoji: {
    fontSize: 54,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  errorText: {
    fontSize: 14,
  },
  backBtn: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
  chapterHeader: {
    padding: Spacing.three,
    alignItems: 'center',
    backgroundColor: '#06060A',
  },
  chapterNum: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pageWrapper: {
    alignItems: 'center',
  },
  pageImage: {
    backgroundColor: '#000',
  },
  footer: {
    padding: Spacing.five,
    backgroundColor: '#06060A',
    alignItems: 'center',
    gap: Spacing.three,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  nextBtn: {
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  backToDetailBtn: {
    borderColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  backToDetailText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  hudContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  hudTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 6, 10, 0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  hudBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  hudBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  hudInfo: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: Spacing.three,
  },
  hudChapterTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  hudPageCount: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  hudBottom: {
    backgroundColor: 'rgba(6, 6, 10, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: 12,
  },

  progressBarBg: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
});
