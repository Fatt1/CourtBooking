import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/useAuthStore';
import type { ProblemDetails } from '@/types/api';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7169/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

// Request Interceptor: Tự động gán Bearer JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Trả thẳng values từ backend và format lỗi theo ProblemDetails
apiClient.interceptors.response.use(
  (response) => {
    // Trả thẳng về value dữ liệu thực, không bọc wrapper
    return response.data;
  },
  async (error: AxiosError<ProblemDetails>) => {
    if (error.response?.status === 401) {
      // Tự động logout khi phiên đăng nhập hết hạn hoặc không hợp lệ
      useAuthStore.getState().logout();
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
