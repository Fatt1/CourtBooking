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
  if (typeof err === 'string' && err.trim() !== '') return err;

  if (typeof err === 'object') {
    const obj = err as any;

    // Trích xuất dữ liệu lỗi: hỗ trợ cả khi err là ProblemDetails trực tiếp hoặc AxiosError lồng
    const apiError: ProblemDetails =
      obj.response?.data && typeof obj.response.data === 'object'
        ? (obj.response.data as ProblemDetails)
        : (obj as ProblemDetails);

    // 1. Ưu tiên cao nhất: "detail" (thông điệp lỗi nghiệp vụ cụ thể từ backend)
    if (apiError.detail && typeof apiError.detail === 'string' && apiError.detail.trim() !== '') {
      return apiError.detail;
    }

    // 2. Nếu là lỗi Validation (FluentValidation trả về errors: { Field: ["Lỗi 1", "Lỗi 2"] })
    if (apiError.errors && typeof apiError.errors === 'object') {
      const errorArrays = Object.values(apiError.errors);
      const collectedMessages: string[] = [];
      for (const arr of errorArrays) {
        if (Array.isArray(arr)) {
          for (const msg of arr) {
            if (typeof msg === 'string' && msg.trim() !== '') {
              collectedMessages.push(msg.trim());
            }
          }
        }
      }
      if (collectedMessages.length > 0) {
        return collectedMessages.join('; ');
      }
    }

    // 3. Tiêu đề lỗi (title) nếu có và không phải title mặc định của ASP.NET
    if (
      apiError.title &&
      typeof apiError.title === 'string' &&
      apiError.title.trim() !== '' &&
      !apiError.title.toLowerCase().includes('one or more validation errors')
    ) {
      return apiError.title;
    }

    // 4. Nếu có thuộc tính message thông thường
    if ('message' in obj && typeof obj.message === 'string' && obj.message.trim() !== '') {
      return obj.message;
    }
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return defaultMessage;
}

/**
 * Chuẩn hóa đối tượng lỗi bất kỳ (ProblemDetails, AxiosError, Error) về ProblemDetails chuẩn
 */
export function toProblemDetails(err: unknown): ProblemDetails {
  if (!err) {
    return { title: 'Lỗi', detail: 'Đã có lỗi xảy ra', status: 500 };
  }
  if (typeof err === 'string') {
    return { title: 'Lỗi', detail: err, status: 500 };
  }
  if (typeof err === 'object') {
    const obj = err as any;
    if (obj.response?.data && typeof obj.response.data === 'object') {
      return obj.response.data as ProblemDetails;
    }
    return {
      type: obj.type,
      title: obj.title,
      status: obj.status,
      detail: obj.detail || obj.message,
      instance: obj.instance,
      errors: obj.errors,
      ...obj,
    };
  }
  if (err instanceof Error) {
    return { title: 'Lỗi', detail: err.message, status: 500 };
  }
  return { title: 'Lỗi', detail: 'Đã có lỗi xảy ra', status: 500 };
}
