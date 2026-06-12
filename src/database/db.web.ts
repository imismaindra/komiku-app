/**
 * Web-safe database fallback using AsyncStorage.
 * On web, expo-sqlite requires special bundler setup.
 * This module provides the same interface using AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ====== Types (same as db.ts) ======

export interface DbUser {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface DbSession {
  id: number;
  user_id: number;
  token: string;
  created_at: string;
}

export interface DbBookmark {
  id: number;
  user_id: number;
  manga_id: string;
  manga_title: string;
  cover_url: string | null;
  added_at: string;
}

export interface DbReadHistory {
  id: number;
  user_id: number;
  manga_id: string;
  chapter_id: string;
  chapter_number: number;
  read_at: string;
}

// ====== Internal helpers ======

async function getUsers(): Promise<DbUser[]> {
  const raw = await AsyncStorage.getItem('db_users');
  return raw ? JSON.parse(raw) : [];
}

async function saveUsers(users: DbUser[]): Promise<void> {
  await AsyncStorage.setItem('db_users', JSON.stringify(users));
}

async function getSessions(): Promise<DbSession[]> {
  const raw = await AsyncStorage.getItem('db_sessions');
  return raw ? JSON.parse(raw) : [];
}

async function saveSessions(sessions: DbSession[]): Promise<void> {
  await AsyncStorage.setItem('db_sessions', JSON.stringify(sessions));
}

async function getBookmarksInternal(): Promise<DbBookmark[]> {
  const raw = await AsyncStorage.getItem('db_bookmarks');
  return raw ? JSON.parse(raw) : [];
}

async function saveBookmarks(bookmarks: DbBookmark[]): Promise<void> {
  await AsyncStorage.setItem('db_bookmarks', JSON.stringify(bookmarks));
}

// ====== User Operations ======

export async function createUser(
  email: string,
  username: string,
  passwordHash: string
): Promise<DbUser | null> {
  const users = await getUsers();
  const exists = users.find((u) => u.email === email);
  if (exists) return null;

  const newUser: DbUser = {
    id: Date.now(),
    email,
    username,
    password_hash: passwordHash,
    created_at: new Date().toISOString(),
  };
  users.push(newUser);
  await saveUsers(users);
  return newUser;
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const users = await getUsers();
  return users.find((u) => u.email === email) ?? null;
}

export async function getUserById(id: number): Promise<DbUser | null> {
  const users = await getUsers();
  return users.find((u) => u.id === id) ?? null;
}

// ====== Session Operations ======

export async function createSession(userId: number, token: string): Promise<void> {
  const sessions = await getSessions();
  const filtered = sessions.filter((s) => s.user_id !== userId);
  filtered.push({
    id: Date.now(),
    user_id: userId,
    token,
    created_at: new Date().toISOString(),
  });
  await saveSessions(filtered);
}

export async function getSessionByToken(token: string): Promise<DbSession | null> {
  const sessions = await getSessions();
  return sessions.find((s) => s.token === token) ?? null;
}

export async function deleteSession(token: string): Promise<void> {
  const sessions = await getSessions();
  await saveSessions(sessions.filter((s) => s.token !== token));
}

// ====== Bookmark Operations ======

export async function addBookmark(
  userId: number,
  mangaId: string,
  mangaTitle: string,
  coverUrl?: string
): Promise<boolean> {
  const bookmarks = await getBookmarksInternal();
  const exists = bookmarks.find((b) => b.user_id === userId && b.manga_id === mangaId);
  if (exists) return false;

  bookmarks.push({
    id: Date.now(),
    user_id: userId,
    manga_id: mangaId,
    manga_title: mangaTitle,
    cover_url: coverUrl ?? null,
    added_at: new Date().toISOString(),
  });
  await saveBookmarks(bookmarks);
  return true;
}

export async function removeBookmark(userId: number, mangaId: string): Promise<void> {
  const bookmarks = await getBookmarksInternal();
  await saveBookmarks(
    bookmarks.filter((b) => !(b.user_id === userId && b.manga_id === mangaId))
  );
}

export async function getBookmarks(userId: number): Promise<DbBookmark[]> {
  const bookmarks = await getBookmarksInternal();
  return bookmarks
    .filter((b) => b.user_id === userId)
    .sort((a, b) => b.added_at.localeCompare(a.added_at));
}

export async function getBookmarksByUser(userId: number): Promise<DbBookmark[]> {
  return getBookmarks(userId);
}

export async function isBookmarked(userId: number, mangaId: string): Promise<boolean> {
  const bookmarks = await getBookmarksInternal();
  return bookmarks.some((b) => b.user_id === userId && b.manga_id === mangaId);
}

// ====== Read History Helper Operations (Web) ======

async function getReadHistoryItems(): Promise<DbReadHistory[]> {
  const raw = await AsyncStorage.getItem('db_read_history');
  return raw ? JSON.parse(raw) : [];
}

async function saveReadHistoryItems(history: DbReadHistory[]): Promise<void> {
  await AsyncStorage.setItem('db_read_history', JSON.stringify(history));
}

export async function addReadHistory(
  userId: number,
  mangaId: string,
  chapterId: string,
  chapterNumber: number
): Promise<boolean> {
  try {
    const history = await getReadHistoryItems();
    const existingIdx = history.findIndex(
      (h) => h.user_id === userId && h.manga_id === mangaId && h.chapter_id === chapterId
    );
    if (existingIdx >= 0) {
      // Update read_at for existing entry
      history[existingIdx].read_at = new Date().toISOString();
      history[existingIdx].chapter_number = chapterNumber;
    } else {
      history.push({
        id: Date.now(),
        user_id: userId,
        manga_id: mangaId,
        chapter_id: chapterId,
        chapter_number: chapterNumber,
        read_at: new Date().toISOString(),
      });
    }
    await saveReadHistoryItems(history);
    return true;
  } catch {
    return false;
  }
}

export async function getReadHistoryCount(userId: number): Promise<number> {
  try {
    const history = await getReadHistoryItems();
    const userHistory = history.filter((h) => h.user_id === userId);
    const uniqueMangas = new Set(userHistory.map((h) => h.manga_id));
    return uniqueMangas.size;
  } catch {
    return 0;
  }
}

export async function getReadHistory(userId: number): Promise<DbReadHistory[]> {
  try {
    const history = await getReadHistoryItems();
    return history
      .filter((h) => h.user_id === userId)
      .sort((a, b) => b.read_at.localeCompare(a.read_at));
  } catch {
    return [];
  }
}

export async function getReadHistoryForManga(
  userId: number,
  mangaId: string
): Promise<DbReadHistory | null> {
  try {
    const history = await getReadHistoryItems();
    const record = history
      .filter((h) => h.user_id === userId && h.manga_id === mangaId)
      .sort((a, b) => b.read_at.localeCompare(a.read_at))[0];
    return record ?? null;
  } catch {
    return null;
  }
}

export async function getReadChapterIds(
  userId: number,
  mangaId: string
): Promise<Set<string>> {
  try {
    const history = await getReadHistoryItems();
    const ids = history
      .filter((h) => h.user_id === userId && h.manga_id === mangaId)
      .map((h) => h.chapter_id);
    return new Set(ids);
  } catch {
    return new Set();
  }
}

// ====== Notification Operations (Web) ======

export interface DbNotification {
  id: number;
  user_id: number;
  title: string;
  body: string;
  manga_id: string | null;
  chapter_id: string | null;
  created_at: string;
  is_read: number;
}

async function getNotificationsItems(): Promise<DbNotification[]> {
  const raw = await AsyncStorage.getItem('db_notifications');
  return raw ? JSON.parse(raw) : [];
}

async function saveNotificationsItems(items: DbNotification[]): Promise<void> {
  await AsyncStorage.setItem('db_notifications', JSON.stringify(items));
}

export async function createNotification(
  userId: number,
  title: string,
  body: string,
  mangaId?: string,
  chapterId?: string
): Promise<DbNotification | null> {
  try {
    const items = await getNotificationsItems();
    const newNotification: DbNotification = {
      id: Date.now(),
      user_id: userId,
      title,
      body,
      manga_id: mangaId ?? null,
      chapter_id: chapterId ?? null,
      created_at: new Date().toISOString(),
      is_read: 0,
    };
    items.push(newNotification);
    await saveNotificationsItems(items);
    return newNotification;
  } catch (error) {
    console.error('Failed to create notification on web:', error);
    return null;
  }
}

export async function getNotifications(userId: number): Promise<DbNotification[]> {
  try {
    const items = await getNotificationsItems();
    return items
      .filter((n) => n.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch {
    return [];
  }
}

export async function markNotificationAsRead(userId: number, id: number): Promise<void> {
  try {
    const items = await getNotificationsItems();
    const updated = items.map((n) =>
      n.id === id && n.user_id === userId ? { ...n, is_read: 1 } : n
    );
    await saveNotificationsItems(updated);
  } catch (error) {
    console.error('Failed to mark notification as read on web:', error);
  }
}

export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  try {
    const items = await getNotificationsItems();
    const updated = items.map((n) =>
      n.user_id === userId ? { ...n, is_read: 1 } : n
    );
    await saveNotificationsItems(updated);
  } catch (error) {
    console.error('Failed to mark all notifications as read on web:', error);
  }
}

export async function deleteNotification(userId: number, id: number): Promise<void> {
  try {
    const items = await getNotificationsItems();
    const filtered = items.filter((n) => !(n.id === id && n.user_id === userId));
    await saveNotificationsItems(filtered);
  } catch (error) {
    console.error('Failed to delete notification on web:', error);
  }
}

export async function getUnreadNotificationsCount(userId: number): Promise<number> {
  try {
    const items = await getNotificationsItems();
    return items.filter((n) => n.user_id === userId && n.is_read === 0).length;
  } catch {
    return 0;
  }
}

// ====== Known Mangas Cache Operations (Web) ======

export interface DbKnownManga {
  manga_id: string;
  latest_chapter_number: number;
  title: string;
  cover_url: string | null;
}

async function getKnownMangasItems(): Promise<DbKnownManga[]> {
  const raw = await AsyncStorage.getItem('db_known_mangas');
  return raw ? JSON.parse(raw) : [];
}

async function saveKnownMangasItems(items: DbKnownManga[]): Promise<void> {
  await AsyncStorage.setItem('db_known_mangas', JSON.stringify(items));
}

export async function getKnownManga(mangaId: string): Promise<DbKnownManga | null> {
  try {
    const items = await getKnownMangasItems();
    return items.find((m) => m.manga_id === mangaId) ?? null;
  } catch {
    return null;
  }
}

export async function saveKnownManga(
  mangaId: string,
  latestChapterNumber: number,
  title: string,
  coverUrl?: string
): Promise<void> {
  try {
    const items = await getKnownMangasItems();
    const filtered = items.filter((m) => m.manga_id !== mangaId);
    filtered.push({
      manga_id: mangaId,
      latest_chapter_number: latestChapterNumber,
      title,
      cover_url: coverUrl ?? null,
    });
    await saveKnownMangasItems(filtered);
  } catch (error) {
    console.error('Failed to save known manga on web:', error);
  }
}

export async function isKnownMangasEmpty(): Promise<boolean> {
  try {
    const items = await getKnownMangasItems();
    return items.length === 0;
  } catch {
    return true;
  }
}

// Stub - not needed on web
export async function getDatabase(): Promise<null> {
  return null;
}


