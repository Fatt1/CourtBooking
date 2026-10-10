export interface OwnerBranchListItem {
  id: string;
  name: string;
  hotline: string;
  province: string;
  district: string;
  street: string;
  openTime: string;
  closeTime: string;
  isActive: boolean;
  averageRating: number | null;
}

// Alias tương thích với useBranchStore
export type OwnerBranchItem = OwnerBranchListItem;

export interface OwnerBranchDetail {
  id: string;
  name: string;
  hotline: string;
  province: string;
  district: string;
  street: string;
  ggMapUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  openTime: string;
  closeTime: string;
  policy?: string | null;
  isActive: boolean;
  qrImage?: { key: string; id: string };
  accountNumber?: string;
  accountName?: string;
  sports?: Array<{ id: string; name: string }>;
  images?: Array<{ key: string; id: string }>;
  averageRating?: number | null;
}

export interface CreateBranchPayload {
  name: string;
  hotline: string;
  province: string;
  district: string;
  street: string;
  ggMapUrl: string;
  openTime: string;
  closeTime: string;
  qrImageId: string;
  accountNumber: string;
  accountName: string;
  sportTypeIds: string[];
  policy?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageIds: string[];
}

export interface UpdateBranchPayload extends CreateBranchPayload {
  id: string;
}

export interface UpdateBranchStatusPayload {
  id: string;
  isActive: boolean;
}

