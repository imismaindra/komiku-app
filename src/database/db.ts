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

