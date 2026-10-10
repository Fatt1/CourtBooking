import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

export interface UploadImageResponse {
  id: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
}

/**
 * Base URL của Object Storage (SeaweedFS / S3)
 * Lấy từ .env: VITE_STORAGE_BASE_URL
 */
export const STORAGE_BASE_URL: string =
  (import.meta.env.VITE_STORAGE_BASE_URL as string) || 'http://localhost:8888/courtbooking';

/**
 * Ghép đường dẫn hình ảnh từ Storage Key hoặc trả về URL hoàn chỉnh
 * - Nếu key đã là URL đầy đủ (http://, https://, blob:, data:), giữ nguyên
 * - Nếu key là path trong storage (ví dụ 'images/abc.jpg'), ghép với STORAGE_BASE_URL
 * - Nếu rỗng / null, trả về chuỗi fallback
 */
export function getImageUrl(keyOrUrl?: string | null, fallback = ''): string {
  if (!keyOrUrl) return fallback;

  const trimmed = keyOrUrl.trim();
  if (!trimmed) return fallback;

  // Giữ nguyên xem trước cục bộ dạng blob: hoặc base64 data:
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const baseUrl = STORAGE_BASE_URL.replace(/\/+$/, '');

  // Nếu là URL trỏ tới SeaweedFS/S3 localhost (port 8333 hoặc 8888) của bucket courtbooking,
  // chuẩn hóa lại về baseUrl hiện tại và lược bỏ query string chữ ký S3 nếu có
  const localMatch = trimmed.match(/^https?:\/\/localhost:(?:8333|8888)\/courtbooking\/?([^?]*)/i);
  if (localMatch) {
    const cleanKey = localMatch[1].replace(/^\/+/, '');
    return `${baseUrl}/${cleanKey}`;
  }

  // Nếu là URL bên ngoài (CDN, Google, Unsplash...), giữ nguyên
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const cleanKey = trimmed.replace(/^\/+/, '');
  return `${baseUrl}/${cleanKey}`;
}

/**
 * Hàm upload ảnh dùng chung cho cả Owner và Admin
 * Gửi multipart/form-data với field 'file'
 */
export async function uploadImageApi(file: File): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<UploadImageResponse>(
    API_ENDPOINTS.STORAGE.UPLOAD,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response as unknown as UploadImageResponse;
}

/**
 * Hook Mutation upload ảnh dùng chung cho toàn bộ ứng dụng
 */
export function useUploadImageMutation() {
  return useMutation({
    mutationFn: (file: File) => uploadImageApi(file),
  });
}
