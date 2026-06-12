import { fetchMangaList } from './mangaApi';
import { showLocalNotification } from './notificationService';
import * as db from '../database/db';

/**
 * Periodically checks the Manga API for updates.
 * - Triggers notification for any NEW comic added to the catalog.
 * - Triggers notification for NEW chapters on BOOKMARKED comics.
 */
export async function checkForApiUpdates(
  userId: number,
  onNotificationSaved: (savedNotification: any) => void
): Promise<void> {
  try {
    console.log('[API Poller] Checking for updates from mangaApi...');
    
    // 1. Fetch first page of manga from the API
    const response = await fetchMangaList(1, 24);
    if (response.retcode !== 0 || !response.data) {
      console.warn('[API Poller] Failed to fetch manga list, retcode:', response.retcode);
      return;
    }

    const apiMangas = response.data;
    const isCacheEmpty = await db.isKnownMangasEmpty();
    const bookmarks = await db.getBookmarks(userId);
    const bookmarkedIds = new Set(bookmarks.map((b) => b.manga_id));

    // 2. If the cache is completely empty, populate it and stop (prevents bulk spam on first run)
    if (isCacheEmpty) {
      console.log('[API Poller] Cache is empty. Initializing cache with', apiMangas.length, 'mangas.');
      for (const manga of apiMangas) {
        await db.saveKnownManga(
          manga.manga_id,
          manga.latest_chapter_number,
          manga.title,
          manga.cover_image_url
        );
      }
      return;
    }

    // 3. Compare API manga list with our cached known_mangas
    for (const manga of apiMangas) {
      const cached = await db.getKnownManga(manga.manga_id);

      if (!cached) {
        // --- CASE 1: NEW COMIC IN THE CATALOG ---
        const title = 'Komik Baru Rilis! 🔥';
        const body = `"${manga.title}" kini telah tersedia di Komiku App. Mulai membaca sekarang!`;

        console.log(`[API Poller] New comic detected: ${manga.title}`);

        // Save notification locally
        const saved = await db.createNotification(
          userId,
          title,
          body,
          manga.manga_id,
          manga.latest_chapter_id
        );

        // Show push notification
        await showLocalNotification(title, body, {
          manga_id: manga.manga_id,
          chapter_id: manga.latest_chapter_id,
        });

        // Save to cache so we don't notify again
        await db.saveKnownManga(
          manga.manga_id,
          manga.latest_chapter_number,
          manga.title,
          manga.cover_image_url
        );

        // Trigger UI callback
        if (saved && onNotificationSaved) {
          onNotificationSaved(saved);
        }
      } else if (manga.latest_chapter_number > cached.latest_chapter_number) {
        // --- CASE 2: NEW CHAPTER AVAILABLE ---
        // Save to cache immediately to prevent duplicate runs
        await db.saveKnownManga(
          manga.manga_id,
          manga.latest_chapter_number,
          manga.title,
          manga.cover_image_url
        );

        // Check if user has bookmarked this manga
        const isBookmarked = bookmarkedIds.has(manga.manga_id);
        
        if (isBookmarked) {
          const title = 'Update Chapter Baru! ⚡';
          const body = `Chapter ${manga.latest_chapter_number} untuk komik "${manga.title}" telah rilis. Baca kelanjutannya!`;

          console.log(`[API Poller] New chapter for bookmark detected: ${manga.title} ch ${manga.latest_chapter_number}`);

          // Save notification locally
          const saved = await db.createNotification(
            userId,
            title,
            body,
            manga.manga_id,
            manga.latest_chapter_id
          );

          // Show push notification
          await showLocalNotification(title, body, {
            manga_id: manga.manga_id,
            chapter_id: manga.latest_chapter_id,
          });

          // Trigger UI callback
          if (saved && onNotificationSaved) {
            onNotificationSaved(saved);
          }
        }
      }
    }
  } catch (error) {
    console.error('[API Poller] Error during update check:', error);
  }
}
