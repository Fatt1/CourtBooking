import axios from 'axios';
import { useAuthStore } from '@/stores/useAuthStore';

let refreshPromise: Promise<string | null> | null = null;

/**
 * Gọi API làm mới Access Token từ HttpOnly Refresh Token cookie.
 * Cơ chế singleton / in-flight promise locking giúp tránh race-condition
 * khi nhiều request hoặc component cùng phát hiện token hết hạn tại cùng một thời điểm.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7169/api/v1';

  refreshPromise = (async () => {
    try {
      const response = await axios.post<{ accessToken: string }>(
        `${baseURL}/identity/refresh-token`,
        {},
        { withCredentials: true }
      );

      const newAccessToken = response.data?.accessToken;
      if (newAccessToken) {
        useAuthStore.getState().setAccessToken(newAccessToken);
        return newAccessToken;
      }

      useAuthStore.getState().logout();
      return null;
    } catch {
      useAuthStore.getState().logout();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
