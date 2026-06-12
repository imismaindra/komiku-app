import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MANGA_API_URL = 'https://api.shngm.io/v1/manga/list?page=1&page_size=24&sort=latest&sort_order=desc';

Deno.serve(async (req) => {
  // Add simple security header check if you want to prevent unauthorized manual hits (optional)
  // For cron trigger, we can authorize it via Service Role key or secret headers
  
  try {
    console.log("Starting manga updates check from Edge Function...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Initialize Supabase Client with Service Role key to bypass RLS for server-side updates
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch from Manga API
    const apiResponse = await fetch(MANGA_API_URL);
    if (!apiResponse.ok) {
      throw new Error(`Manga API returned status: ${apiResponse.status}`);
    }
    const json = await apiResponse.json();
    if (json.retcode !== 0 || !json.data) {
      throw new Error(`Manga API error code: ${json.retcode}`);
    }
    const apiMangas = json.data;

    // 2. Fetch known mangas from database
    const { data: serverKnown, error: fetchError } = await supabase
      .from('supabase_known_mangas')
      .select('*');

    if (fetchError) {
      throw new Error(`Failed to fetch known mangas from DB: ${fetchError.message}`);
    }

    const knownMap = new Map(serverKnown.map((m: any) => [m.manga_id, m.latest_chapter_number]));

    // 3. Seed database if it is empty (first run)
    if (serverKnown.length === 0) {
      console.log("Database cache is empty. Seeding database with current catalog...");
      const seedData = apiMangas.map((m: any) => ({
        manga_id: m.manga_id,
        latest_chapter_number: m.latest_chapter_number,
        title: m.title,
      }));
      const { error: seedError } = await supabase
        .from('supabase_known_mangas')
        .insert(seedData);
      
      if (seedError) {
        throw new Error(`Failed to seed catalog: ${seedError.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Database seeded successfully." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const updates = [];

    // 4. Compare API with known database
    for (const manga of apiMangas) {
      const cachedChapter = knownMap.get(manga.manga_id);

      if (cachedChapter === undefined) {
        // --- CASE 1: BRAND NEW COMIC ADDED ---
        console.log(`🔥 New Comic Added: "${manga.title}"`);
        const title = 'Komik Baru Rilis! 🔥';
        const body = `"${manga.title}" kini telah tersedia di Komiku App. Mulai membaca sekarang!`;

        // Save to known list
        await supabase
          .from('supabase_known_mangas')
          .insert({
            manga_id: manga.manga_id,
            latest_chapter_number: manga.latest_chapter_number,
            title: manga.title,
          });

        // Insert into updates table (triggers realtime for active users)
        await supabase
          .from('manga_updates')
          .insert({
            manga_id: manga.manga_id,
            title,
            body,
            chapter_id: manga.latest_chapter_id,
          });

        updates.push({ title, body, mangaId: manga.manga_id, chapterId: manga.latest_chapter_id });

      } else if (manga.latest_chapter_number > cachedChapter) {
        // --- CASE 2: NEW CHAPTER RELEASED ---
        console.log(`⚡ New Chapter for "${manga.title}": Chapter ${manga.latest_chapter_number}`);
        const title = 'Update Chapter Baru! ⚡';
        const body = `Chapter ${manga.latest_chapter_number} untuk komik "${manga.title}" telah rilis. Baca kelanjutannya!`;

        // Update known chapter
        await supabase
          .from('supabase_known_mangas')
          .update({ latest_chapter_number: manga.latest_chapter_number })
          .eq('manga_id', manga.manga_id);

        // Insert into updates table (triggers realtime for active users)
        await supabase
          .from('manga_updates')
          .insert({
            manga_id: manga.manga_id,
            title,
            body,
            chapter_id: manga.latest_chapter_id,
          });

        updates.push({ title, body, mangaId: manga.manga_id, chapterId: manga.latest_chapter_id });
      }
    }

    // 5. If updates were found, send push notifications to registered Expo push tokens
    if (updates.length > 0) {
      // Fetch all push tokens
      const { data: tokens, error: tokensError } = await supabase
        .from('user_push_tokens')
        .select('push_token');

      if (tokensError) {
        console.error('Failed to retrieve push tokens:', tokensError.message);
      } else if (tokens && tokens.length > 0) {
        const uniqueTokens = [...new Set(tokens.map((t: any) => t.push_token))];
        console.log(`Sending notifications to ${uniqueTokens.length} devices...`);

        const messages: any[] = [];
        for (const update of updates) {
          uniqueTokens.forEach((token) => {
            messages.push({
              to: token,
              sound: 'default',
              title: update.title,
              body: update.body,
              data: { manga_id: update.mangaId, chapter_id: update.chapterId },
              android: {
                channelId: 'manga-updates',
              },
            });
          });
        }

        // Send to Expo Push API
        const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messages),
        });

        const pushResult = await pushResponse.json();
        console.log('Expo Push result:', JSON.stringify(pushResult));
      }
    }

    return new Response(
      JSON.stringify({ success: true, processedCount: apiMangas.length, updatesCount: updates.length }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Cron function failed:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
