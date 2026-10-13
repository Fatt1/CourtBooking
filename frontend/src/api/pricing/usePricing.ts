import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type { CourtTypePricingConfigDto } from './types';

/**
 * Lấy toàn bộ cấu hình giá & khung giờ của 1 chi nhánh
 * GET /api/v1/pricing?branchId={branchId}
 */
export async function getBranchPricingConfig(
  branchId: string
): Promise<CourtTypePricingConfigDto[]> {
  const response = await apiClient.get<CourtTypePricingConfigDto[]>(
    API_ENDPOINTS.PRICING.BRANCH_CONFIG,
    {
      params: { branchId },
    }
  );
  return response as unknown as CourtTypePricingConfigDto[];
}

export function useBranchPricingConfigQuery(branchId?: string) {
  return useQuery<CourtTypePricingConfigDto[]>({
    queryKey: ['pricing', 'branch-config', branchId],
    queryFn: () => getBranchPricingConfig(branchId!),
    enabled: Boolean(branchId),
    staleTime: 1000 * 60 * 5, // 5 phút cache
  });
}
