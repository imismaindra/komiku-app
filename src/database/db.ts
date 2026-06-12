import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('komiku.db');
  await initDatabase(db);
  return db;
}

async function initDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      manga_id TEXT NOT NULL,
      manga_title TEXT NOT NULL,
      cover_url TEXT,
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, manga_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS read_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      manga_id TEXT NOT NULL,
      chapter_id TEXT NOT NULL,
      chapter_number INTEGER NOT NULL,
      read_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      manga_id TEXT,
      chapter_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_read INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS known_mangas (
      manga_id TEXT PRIMARY KEY,
      latest_chapter_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      cover_url TEXT
    );
  `);
}

// ====== User Operations ======

export interface DbUser {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  created_at: string;
}

export async function createUser(
  email: string,
  username: string,
  passwordHash: string
): Promise<DbUser | null> {
  const database = await getDatabase();
  try {
    const result = await database.runAsync(
      'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)',
      [email, username, passwordHash]
    );
    const user = await database.getFirstAsync<DbUser>(
      'SELECT * FROM users WHERE id = ?',
      [result.lastInsertRowId]
    );
    return user ?? null;
  } catch {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const database = await getDatabase();
  const user = await database.getFirstAsync<DbUser>(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return user ?? null;
}

export async function getUserById(id: number): Promise<DbUser | null> {
  const database = await getDatabase();
  const user = await database.getFirstAsync<DbUser>(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );
  return user ?? null;
}

// ====== Session Operations ======

export async function createSession(userId: number, token: string): Promise<void> {
  const database = await getDatabase();
  // Delete old sessions for this user
  await database.runAsync('DELETE FROM sessions WHERE user_id = ?', [userId]);
  // Create new session
  await database.runAsync(
    'INSERT INTO sessions (user_id, token) VALUES (?, ?)',
    [userId, token]
  );
}

export interface DbSession {
  id: number;
  user_id: number;
  token: string;
  created_at: string;
}

export async function getSessionByToken(token: string): Promise<DbSession | null> {
  const database = await getDatabase();
  const session = await database.getFirstAsync<DbSession>(
    'SELECT * FROM sessions WHERE token = ?',
    [token]
  );
  return session ?? null;
}

export async function deleteSession(token: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM sessions WHERE token = ?', [token]);
}

// ====== Bookmark Operations ======

export interface DbBookmark {
  id: number;
  user_id: number;
  manga_id: string;
  manga_title: string;
  cover_url: string | null;
  added_at: string;
}

export async function addBookmark(
  userId: number,
  mangaId: string,
  mangaTitle: string,
  coverUrl?: string
): Promise<boolean> {
  const database = await getDatabase();
  try {
    await database.runAsync(
      'INSERT OR IGNORE INTO bookmarks (user_id, manga_id, manga_title, cover_url) VALUES (?, ?, ?, ?)',
      [userId, mangaId, mangaTitle, coverUrl ?? null]
    );
    return true;
  } catch {
    return false;
  }
}

export async function removeBookmark(userId: number, mangaId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'DELETE FROM bookmarks WHERE user_id = ? AND manga_id = ?',
    [userId, mangaId]
  );
}

export async function getBookmarks(userId: number): Promise<DbBookmark[]> {
  const database = await getDatabase();
  const bookmarks = await database.getAllAsync<DbBookmark>(
    'SELECT * FROM bookmarks WHERE user_id = ? ORDER BY added_at DESC',
    [userId]
  );
  return bookmarks;
}

export async function isBookmarked(userId: number, mangaId: string): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ? AND manga_id = ?',
    [userId, mangaId]
  );
  return (result?.count ?? 0) > 0;
}

// ====== Read History Operations ======

export interface DbReadHistory {
  id: number;
  user_id: number;
  manga_id: string;
  chapter_id: string;
  chapter_number: number;
  read_at: string;
}

export async function addReadHistory(
  userId: number,
  mangaId: string,
  chapterId: string,
  chapterNumber: number
): Promise<boolean> {
  const database = await getDatabase();
  try {
    // Upsert: update read_at if already exists, else insert
    const existing = await database.getFirstAsync<{ id: number }>(
      'SELECT id FROM read_history WHERE user_id = ? AND manga_id = ? AND chapter_id = ?',
      [userId, mangaId, chapterId]
    );
    if (existing) {
      await database.runAsync(
        'UPDATE read_history SET read_at = datetime(\'now\'), chapter_number = ? WHERE id = ?',
        [chapterNumber, existing.id]
      );
    } else {
      await database.runAsync(
        'INSERT INTO read_history (user_id, manga_id, chapter_id, chapter_number) VALUES (?, ?, ?, ?)',
        [userId, mangaId, chapterId, chapterNumber]
      );
    }
    return true;
  } catch {
    return false;
  }
}

export async function getReadHistoryCount(userId: number): Promise<number> {
  const database = await getDatabase();
  try {
    const result = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(DISTINCT manga_id) as count FROM read_history WHERE user_id = ?',
      [userId]
    );
    return result?.count ?? 0;
  } catch {
    return 0;
  }
}

export async function getReadHistory(userId: number): Promise<DbReadHistory[]> {
  const database = await getDatabase();
  try {
    const history = await database.getAllAsync<DbReadHistory>(
      'SELECT * FROM read_history WHERE user_id = ? ORDER BY read_at DESC',
      [userId]
    );
    return history;
  } catch {
    return [];
  }
}

export async function getReadHistoryForManga(
  userId: number,
  mangaId: string
): Promise<DbReadHistory | null> {
  const database = await getDatabase();
  try {
    // Return the most recently read chapter for this manga
    const record = await database.getFirstAsync<DbReadHistory>(
      'SELECT * FROM read_history WHERE user_id = ? AND manga_id = ? ORDER BY read_at DESC LIMIT 1',
      [userId, mangaId]
    );
    return record ?? null;
  } catch {
    return null;
  }
}

export async function getReadChapterIds(
  userId: number,
  mangaId: string
): Promise<Set<string>> {
  const database = await getDatabase();
  try {
    const rows = await database.getAllAsync<{ chapter_id: string }>(
      'SELECT chapter_id FROM read_history WHERE user_id = ? AND manga_id = ?',
      [userId, mangaId]
    );
    return new Set(rows.map((r) => r.chapter_id));
  } catch {
    return new Set();
  }
}

// ====== Notification Operations ======

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

export async function createNotification(
  userId: number,
  title: string,
  body: string,
  mangaId?: string,
  chapterId?: string
): Promise<DbNotification | null> {
  const database = await getDatabase();
  try {
    const result = await database.runAsync(
      'INSERT INTO notifications (user_id, title, body, manga_id, chapter_id) VALUES (?, ?, ?, ?, ?)',
      [userId, title, body, mangaId ?? null, chapterId ?? null]
    );
    const notification = await database.getFirstAsync<DbNotification>(
      'SELECT * FROM notifications WHERE id = ?',
      [result.lastInsertRowId]
    );
    return notification ?? null;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

export async function getNotifications(userId: number): Promise<DbNotification[]> {
  const database = await getDatabase();
  try {
    const notifications = await database.getAllAsync<DbNotification>(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return notifications;
  } catch {
    return [];
  }
}

export async function markNotificationAsRead(userId: number, id: number): Promise<void> {
  const database = await getDatabase();
  try {
    await database.runAsync(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
}

export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  const database = await getDatabase();
  try {
    await database.runAsync(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [userId]
    );
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
  }
}

export async function deleteNotification(userId: number, id: number): Promise<void> {
  const database = await getDatabase();
  try {
    await database.runAsync(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  } catch (error) {
    console.error('Failed to delete notification:', error);
  }
}

export async function getUnreadNotificationsCount(userId: number): Promise<number> {
  const database = await getDatabase();
  try {
    const result = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return result?.count ?? 0;
  } catch {
    return 0;
  }
}

// ====== Known Mangas Cache Operations ======

export interface DbKnownManga {
  manga_id: string;
  latest_chapter_number: number;
  title: string;
  cover_url: string | null;
}

export async function getKnownManga(mangaId: string): Promise<DbKnownManga | null> {
  const database = await getDatabase();
  try {
    const row = await database.getFirstAsync<DbKnownManga>(
      'SELECT * FROM known_mangas WHERE manga_id = ?',
      [mangaId]
    );
    return row ?? null;
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
  const database = await getDatabase();
  try {
    await database.runAsync(
      'INSERT OR REPLACE INTO known_mangas (manga_id, latest_chapter_number, title, cover_url) VALUES (?, ?, ?, ?)',
      [mangaId, latestChapterNumber, title, coverUrl ?? null]
    );
  } catch (error) {
    console.error('Failed to save known manga:', error);
  }
}

export async function isKnownMangasEmpty(): Promise<boolean> {
  const database = await getDatabase();
  try {
    const result = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM known_mangas'
    );
    return (result?.count ?? 0) === 0;
  } catch {
    return true;
  }
}



