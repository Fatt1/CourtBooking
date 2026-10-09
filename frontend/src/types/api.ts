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
