/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/auth-context';
import { addBookmark, removeBookmark, isBookmarked, getReadHistoryForManga, getReadChapterIds } from '@/database/db';
import { fetchMangaDetail, formatViewCount, getMangaStatusLabel, getCountryFlag, fetchMangaChapters, fetchMangaComments } from '@/services/mangaApi';
import type { DbReadHistory } from '@/database/db';
import { Spacing } from '@/constants/theme';
import type { MangaItem, ChapterListItem, CommentItem } from '@/types';

export default function MangaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mangaId = Array.isArray(id) ? id[0] : id;
  const theme = useTheme();
  const { state: authState } = useAuth();
  const userId = authState.user?.id;

  const [manga, setManga] = useState<MangaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [readHistory, setReadHistory] = useState<DbReadHistory | null>(null);
  const [firstChapterId, setFirstChapterId] = useState<string | null>(null);
  const [readChapterIds, setReadChapterIds] = useState<Set<string>>(new Set());

  const [chapters, setChapters] = useState<ChapterListItem[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersPage, setChaptersPage] = useState(1);
  const [hasMoreChapters, setHasMoreChapters] = useState(false);

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  const loadChapters = async (pageNum: number, reset = false) => {
    if (!mangaId) return;
    setChaptersLoading(true);
    try {
      const res = await fetchMangaChapters(mangaId, pageNum, 24);
      if (res.retcode === 0) {
        setChapters(prev => reset ? res.data : [...prev, ...res.data]);
        setHasMoreChapters(res.meta.page < res.meta.total_page);
        setChaptersPage(pageNum);
      }
    } catch (e) {
      console.warn('Error loading chapters:', e);
    } finally {
      setChaptersLoading(false);
    }
  };

  const loadComments = async (pageNum: number, reset = false) => {
    if (!mangaId) return;
    setCommentsLoading(true);
    try {
      const res = await fetchMangaComments(mangaId, pageNum, 10);
      if (res.errno === 0 && res.data) {
        setComments(prev => reset ? res.data.data : [...prev, ...res.data.data]);
        setHasMoreComments(res.data.page < res.data.totalPages);
        setCommentsCount(res.data.count);
        setCommentsPage(pageNum);
      }
    } catch (e) {
      console.warn('Error loading comments:', e);
    } finally {
      setCommentsLoading(false);
    }
  };

  const scrollY = useSharedValue(0);
  const bookmarkScale = useSharedValue(1);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const heroStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [-200, 0], [1.3, 1], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [0, 200], [0, 80], Extrapolation.CLAMP);
    return { transform: [{ scale }, { translateY }] };
  });

  const bookmarkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
  }));

  useEffect(() => {
    if (!mangaId) return;
    (async () => {
      try {
        const res = await fetchMangaDetail(mangaId);
        if (res.retcode === 0) {
          setManga(res.data);
          if (userId) {
            const [active, history, readIds] = await Promise.all([
              isBookmarked(userId, mangaId),
              getReadHistoryForManga(userId, mangaId),
              getReadChapterIds(userId, mangaId),
            ]);
            setBookmarked(active);
            setReadHistory(history);
            setReadChapterIds(readIds);
          }
          // Load chapters ascending to get first chapter
          const firstPageRes = await fetchMangaChapters(mangaId, 1, 24, 'asc');
          if (firstPageRes.retcode === 0 && firstPageRes.data.length > 0) {
            setFirstChapterId(firstPageRes.data[0].chapter_id);
          }
          loadChapters(1, true);
          loadComments(1, true);
        } else {
          setError('Manga tidak ditemukan');
        }
      } catch {
        setError('Gagal memuat detail manga');
      } finally {
        setLoading(false);
      }
    })();
  }, [mangaId, userId]);

  const toggleBookmark = async () => {
    if (!userId || !mangaId || !manga) return;
    setBookmarkLoading(true);
    bookmarkScale.value = withSpring(0.85, { damping: 10 }, () => {
      bookmarkScale.value = withSpring(1.15, { damping: 10 }, () => {
        bookmarkScale.value = withSpring(1, { damping: 10 });
      });
    });
    try {
      if (bookmarked) {
        await removeBookmark(userId, mangaId);
        setBookmarked(false);
      } else {
        await addBookmark(userId, mangaId, manga.title, manga.cover_portrait_url || manga.cover_image_url);
        setBookmarked(true);
      }
    } catch (e) {
      console.warn('Bookmark error:', e);
    } finally {
      setBookmarkLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: '#4A4A4A' }]}>Memuat...</Text>
      </View>
    );
  }

  if (error || !manga) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorTitle, { color: theme.text }]}>TIDAK DITEMUKAN</Text>
        <Text style={{ color: '#4A4A4A', fontSize: 13 }}>{error ?? 'Manga tidak ditemukan'}</Text>
        <Pressable
          style={[styles.errorBackBtn, { backgroundColor: theme.accent }]}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/');
          }}
        >
          <Text style={[styles.errorBackText, { color: theme.background }]}>KEMBALI</Text>
        </Pressable>
      </View>
    );
  }

  const genres = manga.taxonomy?.Genre ?? [];
  const authors = manga.taxonomy?.Author ?? [];
  const format = manga.taxonomy?.Format?.[0]?.name ?? 'Manga';
  const description = manga.description ?? 'Tidak ada deskripsi.';
  const originLabel =
    manga.country_id === 'KR' ? 'MANHWA' :
    manga.country_id === 'CN' ? 'MANHUA' :
    'MANGA';

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ── */}
        <View style={styles.hero}>
          <Animated.View style={[StyleSheet.absoluteFill, heroStyle]}>
            <Image
              source={{ uri: manga.cover_portrait_url || manga.cover_image_url }}
              style={styles.heroCover}
              contentFit="cover"
              transition={300}
            />
          </Animated.View>
          <LinearGradient
            colors={['transparent', 'rgba(13,13,13,0.4)', theme.background]}
            style={styles.heroGradient}
            locations={[0, 0.55, 1]}
          />
          <SafeAreaView style={styles.heroOverlay} edges={['top']}>
            <Pressable
              style={[styles.heroBackBtn, { backgroundColor: 'rgba(13,13,13,0.7)', borderColor: '#2A2A2A' }]}
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace('/');
              }}
            >
              <Ionicons name="arrow-back" size={18} color="#F0F0F0" />
            </Pressable>
          </SafeAreaView>
        </View>

        {/* ── CONTENT ── */}
        <View style={styles.content}>

          {/* Origin + Featured row */}
          <View style={styles.badgeRow}>
            <View style={[styles.originBadge, { backgroundColor: theme.accent }]}>
              <Text style={[styles.originText, { color: theme.background }]}>{originLabel}</Text>
            </View>
            {manga.is_recommended && (
              <View style={[styles.featuredBadge, { borderColor: '#FF3B3B' }]}>
                <Text style={[styles.featuredText, { color: '#FF3B3B' }]}>FEATURED</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>{manga.title}</Text>
          {manga.alternative_title ? (
            <Text style={styles.altTitle} numberOfLines={1}>{manga.alternative_title}</Text>
          ) : null}

          {/* ── STATS — big numbers ── */}
          <View style={[styles.statsRow, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
            {[
              { icon: 'star', value: String(manga.user_rate ?? 0), label: 'RATING', color: '#E8FF00' },
              { icon: 'eye-outline', value: formatViewCount(manga.view_count), label: 'VIEWS', color: '#F0F0F0' },
              { icon: 'bookmark-outline', value: formatViewCount(manga.bookmark_count), label: 'SIMPAN', color: '#F0F0F0' },
              { icon: 'list-outline', value: String(manga.latest_chapter_number), label: 'BAB', color: '#F0F0F0' },
            ].map((s, i) => (
              <View
                key={s.label}
                style={[styles.statCell, i < 3 && { borderRightWidth: 1, borderRightColor: theme.border }]}
              >
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* ── GENRE TAGS ── */}
          {genres.length > 0 && (
            <View style={styles.genreRow}>
              {genres.map((g) => (
                <View key={g.slug} style={[styles.genreTag, { borderColor: theme.border }]}>
                  <Text style={styles.genreTagText}>{g.name.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── SPEC GRID ── */}
          <View style={[styles.specGrid, { borderColor: theme.border }]}>
            {[
              { label: 'STATUS', value: getMangaStatusLabel(manga.status) },
              { label: 'RILIS', value: manga.release_year },
              { label: 'FORMAT', value: format.toUpperCase() },
              { label: 'NEGARA', value: manga.country_id === 'KR' ? 'Korea' : manga.country_id === 'CN' ? 'China' : 'Jepang' },
            ].map((item, i) => (
              <View
                key={item.label}
                style={[
                  styles.specItem,
                  { borderColor: theme.border },
                  i % 2 === 0 && { borderRightWidth: 1 },
                  i < 2 && { borderBottomWidth: 1 },
                ]}
              >
                <Text style={styles.specLabel}>{item.label}</Text>
                <Text style={[styles.specValue, { color: theme.text }]}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* ── AUTHORS ── */}
          {authors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionEyebrow}>KREATOR</Text>
              <Text style={[styles.sectionValue, { color: theme.text }]}>
                {authors.map((a) => a.name).join(', ')}
              </Text>
            </View>
          )}

          {/* ── SYNOPSIS ── */}
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>SINOPSIS</Text>
            <Text
              style={[styles.description, { color: '#6B6B6B' }]}
              numberOfLines={descExpanded ? undefined : 4}
            >
              {description}
            </Text>
            <Pressable onPress={() => setDescExpanded(!descExpanded)} style={styles.expandBtn}>
              <Text style={[styles.expandText, { color: theme.accent }]}>
                {descExpanded ? '— SEMBUNYIKAN' : '+ BACA SELENGKAPNYA'}
              </Text>
            </Pressable>
          </View>

          {/* ── ACTION BUTTONS ── */}
          <View style={styles.actionRow}>
            <Pressable
              id="read-manga-btn"
              style={({ pressed }) => [
                styles.readBtn,
                { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => {
                if (readHistory) {
                  // Continue from last read chapter
                  router.push(`/chapter/${readHistory.chapter_id}` as any);
                } else if (firstChapterId) {
                  // Start from first chapter
                  router.push(`/chapter/${firstChapterId}` as any);
                } else if (manga.latest_chapter_id) {
                  // Fallback to latest
                  router.push(`/chapter/${manga.latest_chapter_id}` as any);
                }
              }}
            >
              {readHistory ? (
                <Text style={[styles.readBtnText, { color: theme.background }]}>
                  LANJUTKAN Ch.{readHistory.chapter_number}
                </Text>
              ) : (
                <Text style={[styles.readBtnText, { color: theme.background }]}>
                  MULAI BACA
                </Text>
              )}
            </Pressable>

            <Animated.View style={bookmarkAnimStyle}>
              <Pressable
                style={[
                  styles.bookmarkBtn,
                  {
                    borderColor: bookmarked ? '#FF3B3B' : theme.border,
                    backgroundColor: bookmarked ? 'rgba(255,59,59,0.08)' : 'transparent',
                  },
                ]}
                onPress={toggleBookmark}
                disabled={bookmarkLoading}
              >
                <Ionicons
                  name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={16}
                  color={bookmarked ? '#FF3B3B' : '#4A4A4A'}
                />
              </Pressable>
            </Animated.View>
          </View>

          {/* ── CHAPTERS ── */}
          <View style={[styles.section, { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: Spacing.three }]}>
            <Text style={styles.sectionEyebrow}>DAFTAR BAB</Text>
            {chapters.length === 0 ? (
              chaptersLoading ? (
                <ActivityIndicator size="small" color={theme.accent} style={{ marginVertical: 20 }} />
              ) : (
                <Text style={{ color: '#4A4A4A', fontSize: 13, marginTop: 10 }}>Tidak ada chapter tersedia.</Text>
              )
            ) : (
              <View>
                {chapters.map((ch) => (
                  <ChapterRow
                    key={ch.chapter_id}
                    item={ch}
                    theme={theme}
                    isRead={readChapterIds.has(ch.chapter_id)}
                    isLastRead={readHistory?.chapter_id === ch.chapter_id}
                  />
                ))}
                {hasMoreChapters && (
                  <Pressable
                    style={[styles.loadMoreBtn, { borderColor: theme.border }]}
                    onPress={() => loadChapters(chaptersPage + 1)}
                    disabled={chaptersLoading}
                  >
                    {chaptersLoading ? (
                      <ActivityIndicator size="small" color={theme.accent} />
                    ) : (
                      <Text style={[styles.loadMoreText, { color: '#4A4A4A' }]}>
                        MUAT LEBIH BANYAK
                      </Text>
                    )}
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* ── COMMENTS ── */}
          <View style={[styles.section, { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: Spacing.three }]}>
            <Text style={styles.sectionEyebrow}>KOMENTAR ({commentsCount})</Text>
            {comments.length === 0 ? (
              commentsLoading ? (
                <ActivityIndicator size="small" color={theme.accent} style={{ marginVertical: 20 }} />
              ) : (
                <Text style={{ color: '#4A4A4A', fontSize: 13, marginTop: 10 }}>
                  Belum ada komentar. Jadilah yang pertama!
                </Text>
              )
            ) : (
              <View>
                {comments.map((comment) => (
                  <CommentCard key={comment.objectId} item={comment} theme={theme} />
                ))}
                {hasMoreComments && (
                  <Pressable
                    style={[styles.loadMoreBtn, { borderColor: theme.border }]}
                    onPress={() => loadComments(commentsPage + 1)}
                    disabled={commentsLoading}
                  >
                    {commentsLoading ? (
                      <ActivityIndicator size="small" color={theme.accent} />
                    ) : (
                      <Text style={[styles.loadMoreText, { color: '#4A4A4A' }]}>
                        TAMPILKAN LEBIH BANYAK
                      </Text>
                    )}
                  </Pressable>
                )}
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

function ChapterRow({
  item,
  theme,
  isRead = false,
  isLastRead = false,
}: {
  item: ChapterListItem;
  theme: any;
  isRead?: boolean;
  isLastRead?: boolean;
}) {
  const formattedDate = new Date(item.release_date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const numColor = isRead ? '#3A3A3A' : theme.accent;
  const titleColor = isRead ? '#4A4A4A' : theme.text;
  const rowBg = isRead ? 'rgba(0,0,0,0.0)' : 'transparent';

  return (
    <Pressable
      style={({ pressed }) => [
        chapterStyles.row,
        {
          borderBottomColor: theme.border,
          backgroundColor: pressed ? theme.backgroundSelected : rowBg,
        },
      ]}
      onPress={() => router.push(`/chapter/${item.chapter_id}` as any)}
    >
      {/* Leftmost: Chapter Cover/Thumbnail */}
      {item.thumbnail_image_url ? (
        <Image
          source={{ uri: item.thumbnail_image_url }}
          style={chapterStyles.thumbnail}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[chapterStyles.thumbnailPlaceholder, { backgroundColor: theme.border }]}>
          <Ionicons name="book-outline" size={16} color={isRead ? '#3A3A3A' : '#6B6B6B'} />
        </View>
      )}

      {/* Left: chapter number */}
      <View style={chapterStyles.left}>
        <Text style={[chapterStyles.chapterNum, { color: numColor }]}>
          {item.chapter_number}
        </Text>
        <Text style={[chapterStyles.chapterUnit, { color: isRead ? '#3A3A3A' : '#4A4A4A' }]}>BAB</Text>
      </View>

      {/* Middle: title + meta + badges */}
      <View style={chapterStyles.middle}>
        <View style={chapterStyles.badgeRow}>
          {isLastRead && (
            <View style={[chapterStyles.lastReadBadge, { backgroundColor: theme.accent }]}>
              <Text style={[chapterStyles.lastReadText, { color: theme.background }]}>TERAKHIR</Text>
            </View>
          )}
          {isRead && !isLastRead && (
            <View style={chapterStyles.readBadge}>
              <Text style={chapterStyles.readBadgeText}>DIBACA</Text>
            </View>
          )}
        </View>
        {item.chapter_title ? (
          <Text style={[chapterStyles.chapterTitle, { color: titleColor }]} numberOfLines={1}>
            {item.chapter_title}
          </Text>
        ) : null}
        <Text style={[chapterStyles.meta, { color: isRead ? '#3A3A3A' : '#4A4A4A' }]}>
          {formattedDate}  ·  {formatViewCount(item.view_count)} views
        </Text>
      </View>

      {/* Right: icon */}
      {isRead ? (
        <Ionicons name="checkmark-circle" size={16} color="#3A3A3A" />
      ) : (
        <Ionicons name="chevron-forward" size={14} color="#2A2A2A" />
      )}
    </Pressable>
  );
}

function parseCommentText(text: string) {
  const segments: { type: 'text' | 'image'; content: string }[] = [];
  const regex = /!\[(.*?)\]\((.*?)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index);
    if (textBefore) segments.push({ type: 'text', content: textBefore });
    segments.push({ type: 'image', content: match[2] });
    lastIndex = regex.lastIndex;
  }

  const textAfter = text.slice(lastIndex);
  if (textAfter) segments.push({ type: 'text', content: textAfter });
  return segments;
}

function renderCommentBody(text: string, theme: any) {
  const segments = parseCommentText(text);
  return (
    <View style={{ gap: 4 }}>
      {segments.map((seg, idx) => {
        if (seg.type === 'image') {
          return (
            <Image
              key={idx}
              source={{ uri: seg.content }}
              style={commentStyles.commentImage}
              contentFit="contain"
            />
          );
        }
        const contentTrimmed = seg.content.trim();
        if (contentTrimmed === '') return null;
        return (
          <Text key={idx} style={[commentStyles.commentText, { color: '#6B6B6B' }]}>
            {seg.content}
          </Text>
        );
      })}
    </View>
  );
}

function CommentCard({ item, theme }: { item: CommentItem; theme: any }) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const hasSpoiler = item.orig.includes('[spoiler]') && item.orig.includes('[/spoiler]');
  const cleanText = item.orig
    .replace(/\[spoiler\]/gi, '')
    .replace(/\[\/spoiler\]/gi, '')
    .trim();

  const formattedDate = new Date(item.time).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={[commentStyles.card, { borderBottomColor: theme.border }]}>
      <View style={commentStyles.header}>
        <Image
          source={{ uri: item.avatar || 'https://profilestorage.shngm.id/profile/default.jpg' }}
          style={[commentStyles.avatar, { borderColor: theme.border }]}
          contentFit="cover"
        />
        <View style={commentStyles.userInfo}>
          <Text style={[commentStyles.nick, { color: theme.text }]}>{item.nick}</Text>
          <Text style={commentStyles.time}>{formattedDate}</Text>
        </View>
        <View style={commentStyles.likeBadge}>
          <Ionicons name="chevron-up" size={11} color="#4A4A4A" />
          <Text style={commentStyles.likeCount}>{item.like}</Text>
        </View>
      </View>

      {item.reply_user && (
        <Text style={[commentStyles.replyTag, { color: theme.accent }]}>
          ↩ {item.reply_user.nick}
        </Text>
      )}

      <View style={commentStyles.body}>
        {hasSpoiler ? (
          spoilerRevealed ? (
            <View>
              {renderCommentBody(cleanText, theme)}
              <Pressable onPress={() => setSpoilerRevealed(false)}>
                <Text style={{ color: '#4A4A4A', fontSize: 10, fontWeight: '700', marginTop: 6, letterSpacing: 1 }}>
                  — SEMBUNYIKAN SPOILER
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setSpoilerRevealed(true)}
              style={[commentStyles.spoilerCover, { borderColor: theme.border }]}
            >
              <Ionicons name="eye-off-outline" size={13} color="#4A4A4A" />
              <Text style={commentStyles.spoilerText}>Konten spoiler. Ketuk untuk lihat.</Text>
            </Pressable>
          )
        ) : (
          renderCommentBody(item.orig, theme)
        )}
      </View>
    </View>
  );
}

const chapterStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    width: 56,
  },
  chapterNum: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  chapterUnit: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  middle: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  lastReadBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  lastReadText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
  },
  readBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  readBadgeText: {
    color: '#3A3A3A',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  chapterTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  meta: {
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  thumbnail: {
    width: 72,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#1C1C1E',
  },
  thumbnailPlaceholder: {
    width: 72,
    height: 48,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const commentStyles = StyleSheet.create({
  card: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderWidth: 1,
  },
  userInfo: {
    flex: 1,
  },
  nick: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  time: {
    color: '#4A4A4A',
    fontSize: 10,
    marginTop: 1,
  },
  likeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  likeCount: {
    color: '#4A4A4A',
    fontSize: 11,
    fontWeight: '600',
  },
  replyTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  body: {
    marginTop: 2,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
  },
  spoilerCover: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 10,
  },
  spoilerText: {
    color: '#4A4A4A',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  commentImage: {
    maxWidth: '100%',
    width: 150,
    height: 150,
    marginVertical: 6,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  loadingText: {
    marginTop: Spacing.two,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  errorBackBtn: {
    marginTop: Spacing.two,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  errorBackText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  hero: {
    height: 340,
    position: 'relative',
    overflow: 'hidden',
  },
  heroCover: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: Spacing.three,
  },
  heroBackBtn: {
    width: 40,
    height: 40,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    marginTop: -Spacing.five,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  originBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  originText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  featuredBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  featuredText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  altTitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#4A4A4A',
    marginTop: -8,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statCell: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#4A4A4A',
    letterSpacing: 1,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  genreTag: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  genreTagText: {
    color: '#4A4A4A',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  specGrid: {
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specItem: {
    width: '50%',
    padding: 12,
    gap: 4,
  },
  specLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#4A4A4A',
    letterSpacing: 1.5,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    gap: 8,
  },
  sectionEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4A4A4A',
    letterSpacing: 2,
    marginBottom: 2,
  },
  sectionValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  expandBtn: {
    marginTop: 2,
  },
  expandText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  readBtn: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  readBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  bookmarkBtn: {
    width: 50,
    height: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loadMoreText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
