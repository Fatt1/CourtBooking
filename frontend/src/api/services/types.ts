/**
 * DTO và Type cho Dịch vụ tại sân (Services)
 * Khớp CourtBooking.Application.Features.V1.Services.Dtos.ServiceDtos
 */

export interface ServiceImageDto {
  id?: string;
  key?: string;
  url?: string;
}

/**
 * Dịch vụ theo chi nhánh (GET /api/v1/services/{branchId})
 */
export interface ServiceByBranchDto {
  id: string;
  name: string;
  unit: string;
  categoryId: string;
  categoryName?: string;
  image?: ServiceImageDto | null;
  branchId: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerServiceBranchDto {
  branchId: string;
  branchName: string;
  price: number;
  isActive: boolean;
}

/**
 * Dịch vụ phía chủ sân (GET /api/v1/owner/services)
 */
export interface OwnerServiceDto {
  id: string;
  name: string;
  unit: string;
  categoryId: string;
  categoryName?: string;
  image?: ServiceImageDto | null;
  createdAt: string;
  updatedAt: string;
  branches: OwnerServiceBranchDto[];
}

export interface GetServicesByBranchParams {
  branchId?: string | null;
  search?: string;
  categoryId?: string;
}

export interface GetOwnerServicesParams {
  search?: string;
  categoryId?: string;
  branchId?: string;
  page?: number;
  pageSize?: number;
  isActive?: boolean;
}

export interface ServiceBranchPayload {
  branchId: string;
  price: number;
  isActive: boolean;
}

export interface CreateServicePayload {
  name: string;
  unit: string;
  categoryId: string;
  imageId: string | null;
  branches: ServiceBranchPayload[];
}

export interface UpdateServicePayload extends CreateServicePayload {
  id: string;
}
