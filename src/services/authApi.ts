/**
 * Auth API Service
 *
 * Primary auth: SQLite lokal (users, sessions)
 * Secondary/demo networking: reqres.in (opsional, tidak blocking)
 *   - Endpoint: POST https://reqres.in/api/register
 *   - Endpoint: POST https://reqres.in/api/login
 *   - Catatan: reqres.in sekarang memerlukan API key, sehingga
 *     panggilan ini bersifat fire-and-forget (logging saja).
 *     Auth utama tetap menggunakan SQLite lokal.
 */

import {
  createSession,
  createUser,
  getUserByEmail,
} from '@/database/db';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types';

const REQRES_BASE = 'https://reqres.in/api';

// Simple hash (demo only — gunakan bcrypt di production)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function generateToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Fire-and-forget REST API call untuk demo networking.
 * Hasilnya diabaikan — tidak mempengaruhi auth lokal.
 */
function pingRemoteApi(endpoint: string, body: object): void {
  fetch(`${REQRES_BASE}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
    .then((r) => r.json())
    .then((json) => console.log(`[RemoteAPI] ${endpoint}:`, json))
    .catch((err) => console.log(`[RemoteAPI] ${endpoint} error (ignored):`, err));
}

// ===== REGISTER =====
export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  try {
    // 1. Cek apakah email sudah ada di SQLite
    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
      return { success: false, message: 'Email sudah terdaftar' };
    }

    // 2. Simpan user baru ke SQLite
    const passwordHash = simpleHash(data.password);
    const newUser = await createUser(data.email, data.username, passwordHash);

    if (!newUser) {
      return { success: false, message: 'Gagal menyimpan data pengguna' };
    }

    // 3. Buat session token
    const token = generateToken();
    await createSession(newUser.id, token);

    // 4. Demo: ping REST API (fire-and-forget, tidak blocking)
    pingRemoteApi('register', { email: data.email, password: data.password });

    return {
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        createdAt: newUser.created_at,
      },
    };
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, message: 'Terjadi kesalahan, coba lagi' };
  }
}

// ===== LOGIN =====
export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  try {
    // 1. Cari user di SQLite
    const user = await getUserByEmail(data.email);
    if (!user) {
      return { success: false, message: 'Email atau password salah' };
    }

    // 2. Verifikasi password
    const passwordHash = simpleHash(data.password);
    if (user.password_hash !== passwordHash) {
      return { success: false, message: 'Email atau password salah' };
    }

    // 3. Buat session token baru
    const token = generateToken();
    await createSession(user.id, token);

    // 4. Demo: ping REST API (fire-and-forget, tidak blocking)
    pingRemoteApi('login', { email: data.email, password: data.password });

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.created_at,
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Terjadi kesalahan, coba lagi' };
  }
}
