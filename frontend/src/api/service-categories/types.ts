/**
 * DTO và Type cho Danh mục dịch vụ (Service Categories)
 * Khớp CourtBooking.Application.Features.V1.ServiceCategories.Dtos.ServiceCategoryDto
 */
export interface ServiceCategoryDto {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  serviceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceCategoryPayload {
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface UpdateServiceCategoryPayload extends CreateServiceCategoryPayload {
  id: string;
}
