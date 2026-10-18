import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/useAuthStore';
import { refreshAccessToken } from './auth-service';
import type { ProblemDetails } from '@/types/api';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7169/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
  withCredentials: true, // Bắt buộc để trình duyệt tự động gửi và nhận HttpOnly Cookie (Refresh Token)
  paramsSerializer: {
    indexes: null, // Bắt buộc cho ASP.NET Core: serialize array thành key=val1&key=val2 thay vì key[]=val1
  },
});

// Request Interceptor: Tự động gán Bearer JWT Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Khi gửi FormData, xóa Content-Type để trình duyệt tự động gán multipart/form-data kèm boundary hợp lệ
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Quản lý trạng thái Refresh Token đồng thời tránh race-condition
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Bắt 401 để tự động gọi Refresh Token từ HttpOnly Cookie
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error: AxiosError<ProblemDetails>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // Kiểm tra nếu lỗi 401 và không phải là các request login/refresh/logout
    const isAuthRoute =
      originalRequest?.url?.includes('/login') ||
      originalRequest?.url?.includes('/refresh-token') ||
      originalRequest?.url?.includes('/logout');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Nếu đang có một tiến trình refresh token chạy, xếp hàng request này lại
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();
        if (!newAccessToken) {
          throw new Error('Refresh token expired or failed');
        }

        // Giải phóng hàng đợi các request bị hoãn
        processQueue(null, newAccessToken);

        // Gán token mới và gọi lại request ban đầu
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Khi có lỗi, backend ASP.NET Core trả về theo chuẩn RFC ProblemDetails
    const problemDetails: ProblemDetails = error.response?.data || {
      title: error.name || 'Lỗi hệ thống',
      detail: error.message || 'Không thể kết nối đến máy chủ Backend',
      status: error.response?.status || 500,
    };

    return Promise.reject(problemDetails);
  }
);
