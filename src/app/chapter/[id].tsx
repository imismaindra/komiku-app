import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchChapterDetail } from '@/services/mangaApi';
import { Spacing } from '@/constants/theme';
import type { ChapterDetail, ChapterPage } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function MangaPage({ item }: { item: ChapterPage }) {
  const [aspectRatio, setAspectRatio] = useState(0.7);

  return (
    <Image
      source={{ uri: item.image_url }}
      style={[styles.pageImage, { aspectRatio }]}
      contentFit="contain"
      onLoad={(e) => {
        const { width, height } = e.source;
        if (width && height) {
          setAspectRatio(width / height);
        }
      }}
      transition={200}
    />
  );
}

export default function ChapterReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUI, setShowUI] = useState(true);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetchChapterDetail(id);
        if (res.retcode === 0) {
          setChapter(res.data);
        } else {
          setError('Chapter tidak ditemukan');
        }
      } catch {
        setError('Gagal memuat chapter');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Memuat chapter...</Text>
      </View>
    );
  }

  if (error || !chapter) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>😵</Text>
        <Text style={styles.errorTitle}>Gagal Memuat</Text>
        <Text style={styles.errorText}>{error ?? 'Chapter tidak ditemukan'}</Text>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
        >
          <Text style={styles.backBtnText}>← Kembali</Text>
        </Pressable>
      </View>
    );
  }

  const renderPage = ({ item }: { item: ChapterPage }) => (
    <MangaPage item={item} />
  );

  return (
    <View style={styles.root}>
      <Pressable
        style={{ flex: 1 }}
        onPress={() => setShowUI(!showUI)}
      >
        <FlatList
          ref={flatRef}
          data={chapter.pages}
          renderItem={renderPage}
          keyExtractor={(item) => item.page_number.toString()}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={7}
          ListHeaderComponent={
            <View style={styles.chapterHeader}>
              <Text style={styles.chapterNum}>Chapter {chapter.chapter_number}</Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.footerText}>✅ Selesai membaca Chapter {chapter.chapter_number}</Text>
              {chapter.next_chapter_id && (
                <Pressable
                  style={styles.nextBtn}
                   onPress={() => router.replace(`/chapter/${chapter.next_chapter_id}` as any)}
                >
                  <Text style={styles.nextBtnText}>Chapter Berikutnya →</Text>
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
                <Text style={styles.backToDetailText}>← Kembali ke Detail</Text>
              </Pressable>
            </View>
          }
        />
      </Pressable>

      {/* Floating Nav */}
      {showUI && (
        <SafeAreaView style={styles.floatingNav} pointerEvents="box-none">
          <Pressable
            style={styles.navBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace(`/manga/${chapter.manga_id}` as any);
              }
            }}
          >
            <Text style={styles.navBtnText}>← Kembali</Text>
          </Pressable>
          <View style={styles.navInfo}>
            <Text style={styles.navChapter}>Chapter {chapter.chapter_number}</Text>
            <Text style={styles.navPages}>{chapter.pages.length} halaman</Text>
          </View>
          {chapter.next_chapter_id && (
            <Pressable
              style={[styles.navBtn, { backgroundColor: '#FF6B35' }]}
              onPress={() => router.replace(`/chapter/${chapter.next_chapter_id}` as any)}
            >
              <Text style={[styles.navBtnText, { color: '#fff' }]}>Next →</Text>
            </Pressable>
          )}
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    color: '#9CA3AF',
  },
  errorEmoji: {
    fontSize: 48,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  backBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  chapterHeader: {
    padding: Spacing.three,
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
  },
  chapterNum: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '700',
  },
  pageImage: {
    width: SCREEN_WIDTH,
    aspectRatio: 0.7,
    backgroundColor: '#111',
  },
  footer: {
    padding: Spacing.four,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    gap: Spacing.two,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  nextBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  backToDetailBtn: {
    borderColor: '#2D2D3D',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  backToDetailText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  floatingNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,15,0.9)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2E',
  },
  navBtn: {
    backgroundColor: '#1E1E2E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  navInfo: {
    alignItems: 'center',
    gap: 2,
  },
  navChapter: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  navPages: {
    color: '#6B7280',
    fontSize: 11,
  },
});
