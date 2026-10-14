/**
 * Chuẩn lỗi ProblemDetails theo chuẩn RFC 7807 / RFC 9110 trả về từ Backend ASP.NET Core
 */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  [key: string]: any;
}

/**
 * Cấu trúc phân trang chuẩn từ Backend PagedList<T>
 * Tùy thuộc vào model T mà items sẽ chứa các thuộc tính tương ứng
 */
export interface PagedList<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

// Alias tương thích
export type PaginatedResponse<T> = PagedList<T>;
export type ApiError = ProblemDetails;

/**
 * Trích xuất câu thông báo lỗi chính xác nhất từ Backend (RFC ProblemDetails) hoặc lỗi client
 */
export function getApiErrorMessage(err: unknown, defaultMessage = 'Đã có lỗi xảy ra'): string {
  if (!err) return defaultMessage;
  if (typeof err === 'string') return err;

  if (typeof err === 'object') {
    const apiError = err as ProblemDetails;

    // 1. Ưu tiên "detail" (thông điệp lỗi nghiệp vụ cụ thể từ backend)
    if (apiError.detail && typeof apiError.detail === 'string') {
      return apiError.detail;
    }

    // 2. Nếu là lỗi Validation (FluentValidation trả về errors: { Field: ["Lỗi 1"] })
    if (apiError.errors && typeof apiError.errors === 'object') {
      const errorArrays = Object.values(apiError.errors);
      for (const arr of errorArrays) {
        if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'string') {
          return arr[0];
        }
      }
    }

    // 3. Tiêu đề lỗi (title)
    if (apiError.title && typeof apiError.title === 'string') {
      return apiError.title;
    }

    // 4. Nếu có thuộc tính message thông thường
    if ('message' in apiError && typeof apiError.message === 'string') {
      return apiError.message;
    }
  }

  if (err instanceof Error) {
    return err.message;
  }

  return defaultMessage;
}
