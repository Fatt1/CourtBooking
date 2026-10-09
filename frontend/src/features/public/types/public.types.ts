export interface SportTypeDto {
  id: string;
  name: string;
  image?: {
    id: string;
    url: string;
  } | null;
  branchCount: number;
}

export interface BranchSportDto {
  id: string;
  name: string;
}

export interface PublicBranchListItemDto {
  id: string;
  name: string;
  province: string;
  district: string;
  street: string;
  latitude?: number | null;
  longitude?: number | null;
  coverImage?: {
    id: string;
    url: string;
  } | null;
  sports: BranchSportDto[];
  openTime: string;
  closeTime: string;
  reviewAverage: number;
  distanceKm?: number | null;
  availableCourtCount?: number | null; // Nullable if backend doesn't calculate or no slot
  minPrice: number;
  maxPrice: number;
}

export type { PagedList } from '@/types/api';

export interface SearchBranchesParams {
  search?: string;
  province?: string;
  district?: string;
  sportTypeIds?: string[];
  date?: string;
  startTime?: string;
  endTime?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort?: string;
  latitude?: number;
  longitude?: number;
  page?: number;
  pageSize?: number;
}
