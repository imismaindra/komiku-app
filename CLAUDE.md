# CLAUDE.md - Komiku App Project Guidelines & Map

This file provides a map of the repository, key commands, architecture guidelines, and rules to prevent agents from searching directories recursively.

---

## 🚀 Key Commands

- **Start Expo Server**: `npm run start` or `npx expo start`
- **Run on Web**: `npm run web` or `npx expo start --web`
- **Run on Android**: `npm run android` or `npx expo start --android`
- **Run on iOS**: `npm run ios` or `npx expo start --ios`
- **Lint Code**: `npm run lint` or `npx expo lint`

---

## 📁 Repository Structure Map

Use this map to find files directly without doing recursive directory searches.

```
komiku-app/
├── assets/                  # App icon, splash screen, and local assets
├── src/
│   ├── app/                 # Expo Router (File-based Routing) Pages
│   │   ├── (auth)/          # Authentication Flow
│   │   │   ├── _layout.tsx  # Auth group layout
│   │   │   ├── login.tsx    # Login screen
│   │   │   └── register.tsx # Register screen
│   │   ├── (tabs)/          # Main Bottom Tabs Navigation
│   │   │   ├── _layout.tsx  # Tabs layout and styling
│   │   │   ├── index.tsx    # Home screen (Manga List, Featured, Ongoing)
│   │   │   ├── explore.tsx  # Explore / Search screen
│   │   │   └── profile.tsx  # Profile, Bookmarks, and Read History screen
│   │   ├── chapter/
│   │   │   └── [id].tsx     # Chapter Viewer screen (manga page reader)
│   │   ├── manga/
│   │   │   └── [id].tsx     # Manga Detail screen (description, chapter list)
│   │   ├── _layout.tsx      # Root layout (Theme & Auth context providers)
│   │   └── index.tsx        # Entry redirect / loading screen
│   │
│   ├── components/          # Reusable React Native components
│   │   ├── ui/              # Generic components (e.g. collapsible)
│   │   ├── themed-text.tsx  # Dark/Light mode aware text component
│   │   ├── themed-view.tsx  # Dark/Light mode aware container view
│   │   ├── loading-skeleton.tsx # Loading placeholders
│   │   ├── manga-card.tsx   # Card component for regular manga items
│   │   ├── manga-featured-card.tsx # Card component for featured/top manga
│   │   ├── app-tabs.tsx     # Custom native tabs implementation
│   │   └── app-tabs.web.tsx # Custom web-specific tabs implementation
│   │
│   ├── constants/           # Styling constants and theme configuration
│   │   └── theme.ts         # Colors and spacing configuration
│   │
│   ├── context/             # React Context Providers
│   │   └── auth-context.tsx # Auth State (login, register, logout, current user)
│   │
│   ├── database/            # Database wrapper
│   │   ├── db.ts            # Native SQLite database (expo-sqlite)
│   │   └── db.web.ts        # Web AsyncStorage database fallback
│   │
│   ├── hooks/               # Custom hooks
│   │   ├── use-theme.ts     # Hook to access the current theme
│   │   └── use-color-scheme.ts # Hook to detect dark/light mode
│   │
│   ├── services/            # API integration services (Base API: https://api.shngm.io/v1)
│   │   ├── authApi.ts       # Auth endpoints
│   │   └── mangaApi.ts      # Manga, chapter details, list retrieval endpoints
│   │
│   └── types/               # TypeScript Definitions
│       └── index.ts         # Types for User, MangaItem, Chapter, Responses
```

---

## 🛠️ Architecture & Conventions

### 1. Imports
- Always use path aliases: `@/...` resolves to `./src/...` (e.g. `import { fetchMangaList } from '@/services/mangaApi'`).
- Avoid relative paths like `../../components/`.

### 2. State & Data Fetching
- **Auth**: Use the context helper from `@/context/auth-context` to access current user status (`useAuth()`).
- **Database**: Check platform support. Use `@/database/db` which automatically imports either the native `expo-sqlite` database (`db.ts`) or web `AsyncStorage` fallback (`db.web.ts`).
- **API**: Fetch manga data through `@/services/mangaApi`. The base endpoint is `https://api.shngm.io/v1`.

### 3. Styling & Theming
- The app uses custom styles backed by `src/constants/theme.ts`.
- Prefer native themed components (`ThemedView`, `ThemedText`) or custom stylesheet objects using colors retrieved from `useTheme()`.

### 4. SDK Version Constraint
- The app runs on **Expo SDK v56.0.0**. Always check official version-specific documentation before using deprecated APIs.

---

## 💡 Guidelines for AI Agents
- **DO NOT** perform recursive searches using `list_dir` or `grep_search` across the entire workspace unless absolutely necessary.
- Refer to the Directory Map above to locate target files immediately.
- Update this map if you add or delete major files.
