export interface SportTypeImage {
  id?: string;
  key?: string;
  url?: string;
}

/**
 * Kiểu dữ liệu môn thể thao dùng chung toàn hệ thống
 */
export interface SportTypeItem {
  id: string;
  name: string;
  imageId?: string | null;
  image?: SportTypeImage | null;
  branchCount?: number;
}

// Alias tương thích với các component dùng SportTypeDto
export type SportTypeDto = SportTypeItem;

/**
 * Kiểu dữ liệu môn thể thao dành cho Quản trị viên
 */
export interface AdminSportTypeDto {
  id: string;
  name: string;
  imageId?: string | null;
  image?: {
    id: string;
    key: string;
  } | null;
  branchCount: number;
}

/**
 * Payload tạo mới môn thể thao
 */
export interface CreateSportTypeRequest {
  name: string;
  imageId: string;
}

/**
 * Payload cập nhật môn thể thao
 */
export interface UpdateSportTypeRequest {
  name: string;
  imageId: string;
}
