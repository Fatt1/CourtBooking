import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type { UploadImageResponse } from './types';

/**
 * Base URL của Object Storage (SeaweedFS / S3)
 * Lấy từ .env: VITE_STORAGE_BASE_URL
 */
export const STORAGE_BASE_URL: string =
  (import.meta.env.VITE_STORAGE_BASE_URL as string) || 'http://localhost:8888/buckets/courtbooking';

/**
 * Ghép đường dẫn hình ảnh từ Storage Key hoặc trả về URL hoàn chỉnh
 * - Nếu key đã là URL đầy đủ (http://, https://, blob:, data:):
 *   + Nếu là URL trỏ tới bucket courtbooking (dù là SeaweedFS nội bộ, Docker, Cloudflare Tunnel cũ hay IP):
 *     tự động chuyển hướng về VITE_STORAGE_BASE_URL hiện tại để trình duyệt tải được ảnh.
 *   + Nếu là URL bên ngoài (CDN, Unsplash, Google...), giữ nguyên.
 * - Nếu key là path tương đối trong storage (ví dụ 'images/abc.jpg'), ghép với STORAGE_BASE_URL
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

  let baseUrl = STORAGE_BASE_URL.replace(/\/+$/, '');
  // Đảm bảo baseUrl trỏ tới cổng 8888 luôn có tiền tố /buckets/courtbooking
  if (baseUrl.includes('localhost:8888') && !baseUrl.includes('/buckets/')) {
    baseUrl = baseUrl.replace('/courtbooking', '/buckets/courtbooking');
  }

  // Nếu chuỗi chứa path của bucket courtbooking (dù là URL đầy đủ hay path tương đối)
  // Trích xuất path thực tế sau courtbooking/ để chuẩn hóa theo baseUrl hiện tại và lược bỏ query string
  const courtbookingMatch = trimmed.match(/(?:buckets\/)?courtbooking(?:\/([^?#]*))?(?:[?#].*)?$/i);
  if (courtbookingMatch && courtbookingMatch[1] !== undefined) {
    const cleanKey = (courtbookingMatch[1] || '').replace(/^\/+/, '');
    return cleanKey ? `${baseUrl}/${cleanKey}` : baseUrl;
  }

  // Nếu là URL bên ngoài khác (CDN, Google, Unsplash...), giữ nguyên
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Key dạng tương đối (ví dụ 'images/branches/saigon-star-1.webp')
  const cleanKey = trimmed
    .replace(/^\/+/, '')
    .replace(/^buckets\/courtbooking\//i, '')
    .replace(/^courtbooking\//i, '');

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
    formData
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
