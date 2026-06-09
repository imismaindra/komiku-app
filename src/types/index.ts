// ==================== AUTH TYPES ====================
export interface User {
  id: number;
  email: string;
  username: string;
  token: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  message?: string;
  user?: Omit<User, 'token'>;
}

// ==================== MANGA TYPES ====================
export interface TaxonomyItem {
  name: string;
  slug: string;
}

export interface Taxonomy {
  Artist?: TaxonomyItem[];
  Author?: TaxonomyItem[];
  Format?: TaxonomyItem[];
  Genre?: TaxonomyItem[];
  Type?: TaxonomyItem[];
}

export interface MangaItem {
  manga_id: string;
  title: string;
  alternative_title: string;
  description: string;
  cover_image_url: string;
  cover_portrait_url: string;
  country_id: string;
  status: number; // 1 = ongoing, 2 = completed
  release_year: string;
  user_rate: number;
  view_count: number;
  bookmark_count: number;
  is_recommended: boolean;
  latest_chapter_id: string;
  latest_chapter_number: number;
  latest_chapter_time: string;
  rank: number;
  taxonomy: Taxonomy;
  created_at: string;
  updated_at: string;
}

export interface ApiMeta {
  request_id: string;
  timestamp: number;
  process_time: string;
  page: number;
  page_size: number;
  total_page: number;
  total_record: number;
}

export interface MangaListResponse {
  retcode: number;
  message: string;
  meta: ApiMeta;
  data: MangaItem[];
}

// ==================== MANGA DETAIL TYPES ====================
export interface MangaDetailResponse {
  retcode: number;
  message: string;
  data: MangaItem;
}

// ==================== CHAPTER TYPES ====================
export interface ChapterPage {
  page_number: number;
  image_url: string;
}

export interface ChapterDetail {
  chapter_id: string;
  chapter_number: number;
  manga_id: string;
  title?: string;
  pages: ChapterPage[];
  prev_chapter_id?: string;
  next_chapter_id?: string;
}

export interface ChapterDetailResponse {
  retcode: number;
  message: string;
  data: ChapterDetail;
}

// ==================== CHAPTER LIST TYPES ====================
export interface ChapterListItem {
  chapter_id: string;
  manga_id: string;
  chapter_title: string;
  chapter_number: number;
  thumbnail_image_url: string;
  view_count: number;
  release_date: string;
}

export interface ChapterListResponse {
  retcode: number;
  message: string;
  meta: ApiMeta;
  data: ChapterListItem[];
}

// ==================== COMMENT TYPES ====================
export interface CommentUser {
  nick: string;
  link?: string;
  avatar?: string;
}

export interface CommentItem {
  status: string;
  comment: string;
  link?: string;
  nick: string;
  pid?: number;
  rid?: number;
  user_id: number;
  sticky?: any;
  like: number;
  objectId: number;
  level: number;
  type: string;
  avatar?: string;
  orig: string;
  time: number;
  reply_user?: CommentUser;
}

export interface CommentsData {
  page: number;
  totalPages: number;
  pageSize: number;
  count: number;
  data: CommentItem[];
}

export interface CommentResponse {
  errno: number;
  errmsg: string;
  data: CommentsData;
}
