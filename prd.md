# Product Requirement Document (PRD) - Komiku App

| Dokumen | Deskripsi |
| :--- | :--- |
| **Nama Produk** | Komiku App |
| **Status** | Aktif / Versi 1.2.0 (Cyber Edition) |
| **Platform** | Cross-Platform (Android, iOS, Web) |
| **Teknologi Utama** | React Native, Expo SDK 56, TypeScript, SQLite, AsyncStorage |
| **Penulis** | Antigravity AI |

---

## 1. Pendahuluan & Visi Produk

### 1.1 Latar Belakang
Membaca komik digital (manga, manhwa, manhua) telah menjadi aktivitas hiburan utama bagi jutaan orang. Namun, banyak platform pembaca komik memiliki antarmuka yang lambat, penuh dengan iklan yang mengganggu, atau tidak mendukung kustomisasi membaca yang nyaman di kondisi cahaya rendah. 

**Komiku App** hadir untuk memberikan solusi pembaca komik yang cepat, modern, dan sangat nyaman. Dengan mengusung tema **"Midnight Cyber"** (desain gelap beraksen neon), aplikasi ini dioptimalkan untuk kinerja performa tinggi, navigasi yang mulus, dan fitur ramah mata.

### 1.2 Visi Produk
Menjadi aplikasi pembaca komik universal yang menawarkan pengalaman membaca yang imersif, memiliki fitur gamifikasi untuk meningkatkan retensi pengguna, serta memiliki kapabilitas *offline-first* untuk penyimpanan data profil dan riwayat baca secara lokal.

---

## 2. Sasaran Pengguna (Target Audience)

1. **Pembaca Komik Kasual (Casual Readers):** Pengguna yang mencari komik populer dan ingin membaca dengan cepat tanpa hambatan pendaftaran yang rumit.
2. **Pembaca Komik Setia (Hardcore/Enthusiast Readers):** Pengguna yang melacak ratusan judul, mengoleksi bookmark, memperhatikan statistik membaca mereka, dan aktif berinteraksi di kolom komentar.
3. **Pembaca Malam Hari (Night Readers):** Pengguna yang sering membaca komik sebelum tidur, membutuhkan filter pelindung mata (*eye shield*) agar mata tidak lelah.

---

## 3. Fitur Utama & Alur Fungsional (Functional Requirements)

Aplikasi Komiku terbagi menjadi beberapa konsol fungsional utama:

### 3.1 Modul Autentikasi & Keamanan (Auth Console)
Sistem autentikasi menggunakan pendekatan hibrida: basis data **SQLite lokal** sebagai penyimpanan utama kredensial dan sesi aktif untuk performa cepat dan kemampuan luring, serta **REST API Reqres.in** untuk sinkronisasi sekunder (uji coba jaringan).

*   **Pendaftaran Akun (Register):**
    *   Input: Email (unik), Username, Password.
    *   Validasi: Memastikan email belum terdaftar di SQLite lokal.
    *   Proses: Enkripsi password menggunakan hash sederhana (`simpleHash`) dan penyimpanan data user baru ke tabel `users`.
    *   Output: Token sesi dihasilkan otomatis (`generateToken`) dan disimpan di `sessions` database lokal serta `AsyncStorage`.
*   **Masuk Sesi (Login):**
    *   Input: Email, Password.
    *   Proses: Pencocokan email dan verifikasi password hash pada tabel `users`.
    *   Output: Jika berhasil, session token dibuat dan disimpan ke tabel `sessions` serta caching lokal di `AsyncStorage` untuk menjaga login tetap aktif saat aplikasi dibuka kembali (*Auto-login*).
*   **Keluar Sesi (Logout):**
    *   Proses: Menghapus token dari tabel `sessions` lokal dan membersihkan `AsyncStorage`, lalu mengembalikan pengguna ke layar login.

### 3.2 Katalog & Eksplorasi Komik (Home & Explore Console)
Layar katalog dirancang untuk menyajikan data secara cepat dengan optimasi rendering grid dan pembagian kategori.

*   **Beranda Utama (Home Tab):**
    *   *Greeting Card:* Sapaan personal yang menampilkan username pengguna beserta inisial avatar.
    *   *Featured Slider:* Rekomendasi Terpopuler yang diambil dari daftar komik berlabel `is_recommended`.
    *   *Genre Filter Chips:* Kategori filter instan horizontal (Semua, Action, Fantasy, Adventure, Romance, Comedy, Drama).
    *   *Manga Collection Grid:* Grid dua kolom yang menampilkan kartu komik secara responsif. Dilengkapi fitur *infinite scroll* (memuat 24 judul per halaman) dan penanda visual untuk komik yang direkomendasikan.
    *   *Refresh Control:* Menarik layar ke bawah untuk memuat ulang daftar katalog teranyar.
*   **Pencarian & Penyaringan (Explore Tab):**
    *   *Search Bar:* Pencarian kata kunci real-time berdasarkan judul utama komik atau judul alternatif.
    *   *Format Filter:* Penyaringan berdasarkan jenis format komik (Semua, Manhwa, Manhua, Manga).
    *   *Country Filter:* Penyaringan berdasarkan negara asal komik dengan ikon bendera visual (🇰🇷 Korea, 🇨🇳 China, 🇯🇵 Jepang).
    *   *Result Counter:* Indikator jumlah komik yang sesuai dengan filter aktif.
    *   *Empty State Handling:* Desain ramah yang muncul jika tidak ada komik yang cocok dengan kueri pencarian pengguna.

### 3.3 Detail Komik & Komunitas (Manga Detail Console)
Menyajikan informasi menyeluruh tentang komik yang dipilih, manajemen bookmark, navigasi bab, dan fitur diskusi komunitas.

*   **Parallax Hero Cover:** Animasi header bertekstur memudar (*gradient fade*) yang membesar atau mengecil secara mulus ketika layar digulirkan (menggunakan *React Native Reanimated*).
*   **Cyber Stats Panel:** Ringkasan statistik komik: Rating (Skor Pengguna), Total Views (diubah format ke M/K secara pintar), Total Bookmark, dan Jumlah Bab Terbaru.
*   **Detail Kategori & Kreator:** Tag genre komik berwarna neon, status (Ongoing/Completed), tahun rilis, negara, dan daftar nama kreator/penulis.
*   **Sinopsis Accordion:** Ringkasan cerita komik dengan tombol "Baca selengkapnya" / "Sembunyikan" agar antarmuka tetap bersih.
*   **Bookmark Toggle:** Tombol interaktif untuk menyimpan/menghapus komik dari daftar favorit di SQLite lokal. Dilengkapi dengan animasi pantulan spring (*scale bounce feedback*).
*   **Daftar Bab (Chapter List):** Menampilkan nomor bab, judul bab, jumlah penonton, tanggal rilis, dan tombol navigasi langsung ke bab tersebut.
*   **Kolom Komentar Terintegrasi:**
    *   Menampilkan daftar komentar beserta avatar pembaca, tanggal posting, dan tombol suka (*likes*).
    *   *Spoiler Protection:* Menyembunyikan teks komentar di balik panel peringatan merah jika mendeteksi tag `[spoiler]`. Pengguna dapat mengetuk panel untuk membacanya.
    *   *Markdown Image Rendering:* Otomatis mem-parsing format gambar `![alt](url)` di dalam teks komentar agar tampil sebagai gambar yang valid.
    *   *Reply Indicator:* Tag visual "Membalas @username" untuk komentar balasan.

### 3.4 Mesin Pembaca Bab (Chapter Reader Engine)
Modul paling krusial yang menyajikan gambar bab secara lancar dengan kustomisasi kontrol pembaca yang melimpah.

*   **Mode Tampilan Fleksibel:**
    *   *Mode Vertikal (Webtoon style):* Gambar disusun memanjang ke bawah secara kontinu. Sangat cocok untuk komik manhwa/manhua modern.
    *   *Mode Horizontal (Manga style):* Halaman disajikan per slide horizontal, memungkinkan navigasi geser kiri-kanan secara teratur.
*   **Immersive Eye Shield Filter (Pelindung Mata):**
    *   *Filter Normal:* Layar bawaan tanpa filter tambahan.
    *   *Filter Kuning (Warm mode):* Overlay kuning transparan (opacity 8%) untuk mengurangi radiasi sinar biru saat malam hari.
    *   *Filter Redup (Dim mode):* Overlay hitam transparan (opacity 45%) untuk mengurangi kecerahan layar di bawah standar bawaan sistem operasi.
*   **HUD Controller Mengambang:**
    *   Dapat dimunculkan/disembunyikan dengan satu ketukan di tengah layar.
    *   Menampilkan judul bab, indikator halaman aktif (`Halaman X / Y`), opsi orientasi, dan opsi filter pelindung mata.
    *   *Progress Bar:* Indikator garis di bagian bawah layar yang menunjukkan persentase halaman yang sudah dibaca.
*   **Riwayat Membaca Otomatis:** Saat bab dibuka, sistem langsung mencatat log bacaan (User ID, Manga ID, Chapter ID, Chapter Number, Tanggal Baca) ke tabel `read_history` secara asinkron.
*   **Navigasi Akhir Bab:** Di ujung halaman vertikal, terdapat pemberitahuan penyelesaian bab dan tombol cepat untuk berpindah ke "Chapter Berikutnya" atau "Kembali ke Detail".

### 3.5 Konsol Profil & Gamifikasi (Profile Console)
Layar pusat data pengguna yang menggabungkan statistik membaca, pintasan bookmark, informasi akun, dan sistem tingkatan (*rank*).

*   **Dashboard Statistik:** Menampilkan tiga metrik utama secara real-time dari database SQLite:
    1.  *Komik Dibaca:* Jumlah judul unik yang pernah dibaca.
    2.  *Bookmark:* Jumlah judul komik yang tersimpan di favorit.
    3.  *Total Bab:* Akumulasi total bab yang telah selesai dibaca.
*   **Bookmarks Carousel:** Baris horizontal gambar sampul komik favorit untuk akses masuk cepat.
*   **Sistem Pangkat Pembaca (Gamification):**
    Aplikasi secara dinamis menghitung dan memberikan gelar pangkat pembaca berdasarkan akumulasi bab yang telah selesai dibaca:
    
    | Jumlah Bab Dibaca | Gelar Pangkat | Ikon Lencana | Warna Tema |
    | :--- | :--- | :--- | :--- |
    | 0 bab | **Calon Legenda** | `medal-outline` | Abu-abu (`#64748B`) |
    | 1 - 4 bab | **Pembaca Aktif** | `book-outline` | Oranye (`#FF6B35`) |
    | 5 - 10 bab | **Pecinta Manga** | `shield-checkmark-outline` | Ungu (`#6C63FF`) |
    | > 10 bab | **Kaisar Komik** | `trophy-outline` | Emas (`#F59E0B`) |

*   **Konsol Akun & Sistem:** Menampilkan data detail profil (Email, Username, Tanggal Bergabung) dan data sistem (Versi Aplikasi: `1.2.0 (Cyber)`, Domain API Server: `api.shngm.io`).

---

## 4. Arsitektur Teknis & Skema Data

### 4.1 Desain Basis Data (SQLite Schema)
Sistem basis data lokal didesain menggunakan SQLite native melalui library `expo-sqlite` dengan konfigurasi Write-Ahead Logging (`PRAGMA journal_mode = WAL`) untuk performa baca/tulis konkuren yang optimal.

```sql
-- Tabel Pengguna (Users)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabel Sesi Aktif (Sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel Bookmark Favorit (Bookmarks)
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

-- Tabel Riwayat Membaca (Read History)
CREATE TABLE IF NOT EXISTS read_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  manga_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  read_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

> [!NOTE]
> Pada platform Web, aplikasi secara otomatis beralih menggunakan fallback database berbasis **AsyncStorage** (`db.web.ts`) dengan skema JSON terstruktur untuk mensimulasikan fungsionalitas SQLite di atas.

### 4.2 Integrasi API Luar (External API Integration)
Layanan integrasi API komik dipisahkan dalam modul `services/mangaApi.ts` dengan basis server endpoint `https://api.shngm.io/v1`.

1.  **Daftar Komik:** `GET /manga/list?page={page}&page_size={page_size}`
2.  **Detail Komik:** `GET /manga/detail/{manga_id}`
3.  **Detail Bab & Gambar:** `GET /chapter/detail/{chapter_id}`
    *   *Proses:* URL gambar bab disusun secara dinamis dengan menggabungkan `base_url`, `path` folder bab, dan nama file gambar halaman.
4.  **Daftar Bab Komik:** `GET /chapter/{manga_id}/list?page={page}&sort_by=chapter_number&sort_order=desc`
5.  **Komentar Diskusi:** `GET https://commento.shngm.io/api/comment?path=series/{manga_id}&pageSize={pageSize}&page={page}&sortBy=like_desc`

---

## 5. Parameter Desain & Estetika (Midnight Cyber Design System)

Komiku App mengadopsi identitas visual futuristik, gelap, dan bernuansa neon cyber. Token warna didefinisikan secara modular di `src/constants/theme.ts`.

### 5.1 Skema Warna (Midnight Cyber Theme)
Aplikasi mendukung peralihan mode Gelap/Terang secara dinamis mengikuti sistem perangkat pengguna, namun sangat dioptimalkan untuk mode Gelap.

*   **Mode Gelap (Cyber Main Theme):**
    *   `background`: `#06060A` (Hitam pekat bernuansa luar angkasa)
    *   `backgroundElement`: `#0E0F17` (Abu-abu gelap untuk container input/layout)
    *   `cardBackground`: `rgba(14, 15, 23, 0.75)` (Glassmorphism semi-transparan)
    *   `accent` (Warna Aksen Utama): `#FF6B35` (Oranye Neon / Cyber Flame)
    *   `accentSecondary` (Warna Aksen Sekunder): `#6C63FF` (Biru Indigo Cyber / Purple Neon)
    *   `text`: `#F8FAFC` (Putih salju)
    *   `textSecondary`: `#94A3B8` (Abu-abu Slate redup)
    *   `border`: `#1E1F30` (Garis tepi tipis beraksen metalik)
*   **Elemen Dekoratif Visual:**
    *   *Glow Blobs:* Blob bercahaya neon berwarna oranye dan ungu dengan efek blur intensitas tinggi (`blur(80px)` hingga `blur(100px)`) yang diposisikan di sudut latar belakang layar untuk memberikan kedalaman visual 3D yang modern.

### 5.2 Tipografi & Tata Letak
*   **Fonts:** Menggunakan sistem font default platform dengan penyesuaian CSS khusus pada Web menggunakan variabel `--font-display`.
*   **Layout:** Grid responsif dengan batas lebar konten maksimal (`MaxContentWidth = 800`) untuk menjamin kenyamanan membaca baik di layar smartphone kecil maupun di tablet dan web browser layar lebar.

---

## 6. Persyaratan Non-Fungsional (Non-Functional Requirements)

1.  **Performa Pengguliran Halaman:** Gambar komik dalam bab harus di-load secara malas (*lazy-loaded*) menggunakan library `expo-image` yang mengadopsi kompresi cache memori cepat untuk mencegah crash out-of-memory.
2.  **Optimasi Batas Memori:** Properti FlatList pada pembaca bab (`removeClippedSubviews`, `initialNumToRender: 2`, `maxToRenderPerBatch: 3`, `windowSize: 5`) dikonfigurasi secara ketat untuk membatasi konsumsi RAM saat rendering gambar bab beresolusi tinggi.
3.  **Transisi Responsif:** Tombol bookmark harus segera merespons ketukan dengan animasi spring, sementara data disimpan ke SQLite secara asinkron tanpa memblokir thread UI utama.
4.  **Kompatibilitas Lintas Platform:** Kode harus berjalan lancar di browser (Chrome/Safari), Android emulator, dan iOS simulator tanpa memerlukan konfigurasi build terpisah.

---

## 7. Rencana Pengembangan Masa Depan (Roadmap)

1.  **Online Account Sync:** Sinkronisasi cloud untuk bookmark dan riwayat baca agar tidak hilang saat aplikasi di-unistall atau saat berganti perangkat.
2.  **Offline Downloading Mode:** Memungkinkan pengguna mengunduh bab komik secara offline ke direktori lokal perangkat agar dapat dibaca di pesawat atau tempat tanpa sinyal.
3.  **Sistem Notifikasi Push:** Memberi tahu pengguna saat komik di bookmark mereka mendapatkan rilis bab baru.
4.  **Editor Komentar Lanjutan:** Mendukung input emoji picker langsung, rich text formatting, dan fitur unggah gambar sebagai komentar reaksi.
