const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Helper to manually load environment variables from the root .env file
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join('=').trim();
          process.env[key] = value;
        }
      });
      console.log('✅ Loaded environment variables from .env file.');
    } else {
      console.warn('⚠️ No .env file found at project root. Will look at system variables.');
    }
  } catch (err) {
    console.error('Error loading .env file:', err.message);
  }
}

loadEnv();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL or Anon Key is missing. Make sure your .env has EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Manga API endpoint
const MANGA_API_URL = 'https://api.shngm.io/v1/manga/list?page=1&page_size=24&sort=latest&sort_order=desc';

/**
 * Send push notifications to all users registered in the database via Expo's Push API.
 */
async function sendPushNotifications(title, body, mangaId, chapterId) {
  try {
    // 1. Fetch all push tokens from Supabase
    const { data: tokens, error } = await supabase
      .from('user_push_tokens')
      .select('push_token');

    if (error) {
      console.error('Error fetching push tokens from Supabase:', error.message);
      return;
    }

    if (!tokens || tokens.length === 0) {
      console.log('ℹ️ No registered push tokens found. Skipping push delivery.');
      return;
    }

    const uniqueTokens = [...new Set(tokens.map((t) => t.push_token))];
    console.log(`📡 Preparing push notification for ${uniqueTokens.length} devices.`);

    // 2. Format the push messages payload
    const messages = uniqueTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: { manga_id: mangaId, chapter_id: chapterId },
      android: {
        channelId: 'manga-updates',
      },
    }));

    // 3. Post to Expo Push API
    // Expo's push API handles batching, delivery, and queueing to APNs / FCM.
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('🚀 Expo Push Service response:', JSON.stringify(result));
  } catch (err) {
    console.error('Error sending push notifications:', err.message);
  }
}

/**
 * Main checking routine
 */
async function checkUpdates() {
  try {
    console.log('\n🔍 Polling manga catalog API for updates...');
    const apiResponse = await fetch(MANGA_API_URL);
    if (!apiResponse.ok) {
      throw new Error(`API returned status ${apiResponse.status}`);
    }
    const json = await apiResponse.json();
    if (json.retcode !== 0 || !json.data) {
      throw new Error(`API retcode ${json.retcode}`);
    }

    const apiMangas = json.data;

    // Retrieve known mangas on server side
    const { data: serverKnown, error: fetchError } = await supabase
      .from('supabase_known_mangas')
      .select('*');

    if (fetchError) {
      throw new Error(`Failed to fetch known mangas: ${fetchError.message}`);
    }

    const knownMap = new Map(serverKnown.map((m) => [m.manga_id, m.latest_chapter_number]));

    // If server table is empty, seed it first without notifying
    if (serverKnown.length === 0) {
      console.log('🌱 Server known mangas list is empty. Seeding catalog in Supabase...');
      const seedData = apiMangas.map((m) => ({
        manga_id: m.manga_id,
        latest_chapter_number: m.latest_chapter_number,
        title: m.title,
      }));
      const { error: seedError } = await supabase
        .from('supabase_known_mangas')
        .insert(seedData);
      if (seedError) {
        console.error('Error seeding server database:', seedError.message);
      } else {
        console.log('✅ Catalog successfully seeded.');
      }
      return;
    }

    // Compare and process updates
    for (const manga of apiMangas) {
      const cachedChapter = knownMap.get(manga.manga_id);

      if (cachedChapter === undefined) {
        // --- CASE 1: BRAND NEW COMIC ADDED ---
        console.log(`🔥 New Comic Added: "${manga.title}"`);
        const title = 'Komik Baru Rilis! 🔥';
        const body = `"${manga.title}" kini telah tersedia di Komiku App. Mulai membaca sekarang!`;

        // Log in known mangas
        await supabase
          .from('supabase_known_mangas')
          .insert({
            manga_id: manga.manga_id,
            latest_chapter_number: manga.latest_chapter_number,
            title: manga.title,
          });

        // Insert into updates table (triggers realtime event for active users)
        await supabase
          .from('manga_updates')
          .insert({
            manga_id: manga.manga_id,
            title,
            body,
            chapter_id: manga.latest_chapter_id,
          });

        // Deliver actual Push Notification to devices
        await sendPushNotifications(title, body, manga.manga_id, manga.latest_chapter_id);

      } else if (manga.latest_chapter_number > cachedChapter) {
        // --- CASE 2: NEW CHAPTER RELEASED ---
        console.log(`⚡ New Chapter for "${manga.title}": Chapter ${manga.latest_chapter_number}`);
        const title = 'Update Chapter Baru! ⚡';
        const body = `Chapter ${manga.latest_chapter_number} untuk komik "${manga.title}" telah rilis. Baca kelanjutannya!`;

        // Update known chapters
        await supabase
          .from('supabase_known_mangas')
          .update({ latest_chapter_number: manga.latest_chapter_number })
          .eq('manga_id', manga.manga_id);

        // Insert into updates table (triggers realtime event for active users)
        await supabase
          .from('manga_updates')
          .insert({
            manga_id: manga.manga_id,
            title,
            body,
            chapter_id: manga.latest_chapter_id,
          });

        // Deliver actual Push Notification to devices
        await sendPushNotifications(title, body, manga.manga_id, manga.latest_chapter_id);
      }
    }
    console.log('✅ Finished update checks.');
  } catch (err) {
    console.error('❌ Error checking updates:', err.message);
  }
}

// Run the checker
checkUpdates();
