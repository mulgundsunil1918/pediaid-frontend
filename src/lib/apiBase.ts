// Single source of truth for the backend base URL.
// In dev: empty string → Vite proxy handles /api → localhost:3002
// In production: set VITE_API_URL=https://your-backend.onrender.com
export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
