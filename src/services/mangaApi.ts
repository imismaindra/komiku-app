/**
 * Manga API Service
 * Base: https://api.shngm.io/v1
 */

import type {
  ChapterDetailResponse,
  MangaDetailResponse,
  MangaListResponse,
} from '@/types';

const BASE_URL = 'https://api.shngm.io/v1';

// ===== MANGA LIST =====
export async function fetchMangaList(
  page: number = 1,
  pageSize: number = 24
): Promise<MangaListResponse> {
  const url = `${BASE_URL}/manga/list?page=${page}&page_size=${pageSize}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch manga list: ${response.status}`);
  }
  const data: MangaListResponse = await response.json();
  return data;
}

// ===== MANGA DETAIL =====
export async function fetchMangaDetail(mangaId: string): Promise<MangaDetailResponse> {
  const url = `${BASE_URL}/manga/detail/${mangaId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch manga detail: ${response.status}`);
  }
  const data: MangaDetailResponse = await response.json();
  return data;
}

// ===== CHAPTER DETAIL =====
export async function fetchChapterDetail(chapterId: string): Promise<ChapterDetailResponse> {
  const url = `${BASE_URL}/chapter/detail/${chapterId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch chapter detail: ${response.status}`);
  }
  const json = await response.json();

  if (json.retcode === 0 && json.data) {
    const raw = json.data;
    const pages = (raw.chapter?.data || []).map((filename: string, index: number) => ({
      page_number: index + 1,
      image_url: `${raw.base_url || ''}${raw.chapter?.path || ''}${filename}`
    }));

    json.data = {
      chapter_id: raw.chapter_id,
      chapter_number: raw.chapter_number,
      manga_id: raw.manga_id,
      title: raw.chapter_title || '',
      pages: pages,
      prev_chapter_id: raw.prev_chapter_id || undefined,
      next_chapter_id: raw.next_chapter_id || undefined,
    };
  }

  return json;
}

// ===== HELPERS =====
export function getMangaStatusLabel(status: number): string {
  switch (status) {
    case 1:
      return 'Ongoing';
    case 2:
      return 'Completed';
    default:
      return 'Unknown';
  }
}

export function formatViewCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

export function getCountryFlag(countryId: string): string {
  const flags: Record<string, string> = {
    KR: '🇰🇷',
    CN: '🇨🇳',
    JP: '🇯🇵',
  };
  return flags[countryId] ?? '🌏';
}
