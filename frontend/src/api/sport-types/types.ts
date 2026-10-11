/**
 * Kiểu dữ liệu môn thể thao dùng chung toàn hệ thống
 */
export interface SportTypeItem {
  id: string;
  name: string;
  image?: {
    id?: string;
    key?: string;
    url?: string;
  } | null;
  branchCount?: number;
}

// Alias tương thích với các component dùng SportTypeDto
export type SportTypeDto = SportTypeItem;
