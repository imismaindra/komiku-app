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

async function getBookmarks(): Promise<DbBookmark[]> {
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
  const bookmarks = await getBookmarks();
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
  const bookmarks = await getBookmarks();
  await saveBookmarks(
    bookmarks.filter((b) => !(b.user_id === userId && b.manga_id === mangaId))
  );
}

export async function getBookmarksByUser(userId: number): Promise<DbBookmark[]> {
  const bookmarks = await getBookmarks();
  return bookmarks
    .filter((b) => b.user_id === userId)
    .sort((a, b) => b.added_at.localeCompare(a.added_at));
}

export async function isBookmarked(userId: number, mangaId: string): Promise<boolean> {
  const bookmarks = await getBookmarks();
  return bookmarks.some((b) => b.user_id === userId && b.manga_id === mangaId);
}

// Stub - not needed on web
export async function getDatabase(): Promise<null> {
  return null;
}
