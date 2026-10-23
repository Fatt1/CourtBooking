import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { isGuid } from '@/lib/utils';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import type {
  CourtTypePricingConfigDto,
  CreatePriceTablePayload,
  UpdatePriceTablePayload,
  DeletePriceTablePayload,
  CreatePriceTableRulePayload,
  UpdatePriceTableRulePayload,
  DeletePriceTableRulePayload,
  CreateFixedTimeBlockPayload,
  UpdateFixedTimeBlockPayload,
  DeleteFixedTimeBlockPayload,
} from './types';

// ── QUERIES ──

/**
 * 1. Lấy toàn bộ cấu hình giá & khung giờ theo Loại sân cụ thể của Chủ sân
 * GET /api/v1/owner/pricing?branchId={branchId}&courtTypeId={courtTypeId}
 */
export async function getCourtTypePricingConfig(
  branchId: string,
  courtTypeId: string
): Promise<CourtTypePricingConfigDto> {
  const response = await apiClient.get<CourtTypePricingConfigDto>(
    API_ENDPOINTS.PRICING.OWNER_CONFIG,
    {
      params: { branchId, courtTypeId },
    }
  );
  return response as unknown as CourtTypePricingConfigDto;
}

export function useCourtTypePricingQuery(
  branchId?: string | null,
  courtTypeId?: string | null
) {
  return useQuery<CourtTypePricingConfigDto>({
    queryKey: ['owner', 'pricing', branchId, courtTypeId],
    queryFn: () => getCourtTypePricingConfig(branchId!, courtTypeId!),
    enabled: Boolean(branchId) && isGuid(courtTypeId),
    staleTime: 1000 * 60 * 3, // 3 phút cache
  });
}

/**
 * 2. Lấy toàn bộ cấu hình giá của chi nhánh công khai
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

export function useBranchPricingConfigQuery(branchId?: string | null) {
  return useQuery<CourtTypePricingConfigDto[]>({
    queryKey: ['pricing', 'branch-config', branchId],
    queryFn: () => getBranchPricingConfig(branchId!),
    enabled: Boolean(branchId),
    staleTime: 1000 * 60 * 3,
  });
}

// ── MUTATIONS: BẢNG GIÁ (PRICE TABLE) ──

/**
 * Tạo mới bảng giá cho loại sân
 * POST /api/v1/owner/pricing/price-tables?branchId={branchId}
 */
export function useCreatePriceTableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ branchId, ...body }: CreatePriceTablePayload) => {
      const response = await apiClient.post<{ id: string }>(
        API_ENDPOINTS.PRICING.PRICE_TABLES,
        body,
        {
          params: { branchId },
        }
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['owner', 'pricing', variables.branchId],
      });
      queryClient.invalidateQueries({
        queryKey: ['pricing', 'branch-config', variables.branchId],
      });
    },
  });
}

/**
 * Cập nhật thông tin bảng giá
 * PUT /api/v1/owner/pricing/price-tables/{priceTableId}?branchId={branchId}
 */
export function useUpdatePriceTableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ branchId, priceTableId, ...body }: UpdatePriceTablePayload) => {
      const response = await apiClient.put(
        API_ENDPOINTS.PRICING.PRICE_TABLE_DETAIL(priceTableId),
        body,
        {
          params: { branchId },
        }
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['owner', 'pricing', variables.branchId],
      });
    },
  });
}

/**
 * Xóa bảng giá
 * DELETE /api/v1/owner/pricing/price-tables/{priceTableId}?branchId={branchId}
 */
export function useDeletePriceTableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ branchId, priceTableId }: DeletePriceTablePayload) => {
      const response = await apiClient.delete(
        API_ENDPOINTS.PRICING.PRICE_TABLE_DETAIL(priceTableId),
        {
          params: { branchId },
        }
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['owner', 'pricing', variables.branchId],
      });
    },
  });
}

// ── MUTATIONS: QUY TẮC GIÁ (PRICE TABLE RULE) ──

/**
 * Thêm quy tắc giá vào bảng giá
 * POST /api/v1/owner/pricing/price-tables/{priceTableId}/rules?branchId={branchId}
 */
export function useCreatePriceTableRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ branchId, priceTableId, ...body }: CreatePriceTableRulePayload) => {
      const response = await apiClient.post<{ id: string }>(
        API_ENDPOINTS.PRICING.PRICE_RULES(priceTableId),
        body,
        {
          params: { branchId },
        }
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['owner', 'pricing', variables.branchId],
      });
      queryClient.invalidateQueries({
        queryKey: ['pricing', 'branch-config', variables.branchId],
      });
    },
  });
}

/**
 * Cập nhật quy tắc tính giá
 * PUT /api/v1/owner/pricing/price-tables/{priceTableId}/rules/{ruleId}?branchId={branchId}
 */
export function useUpdatePriceTableRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      branchId,
      priceTableId,
      ruleId,
      ...body
    }: UpdatePriceTableRulePayload) => {
      const response = await apiClient.put(
        API_ENDPOINTS.PRICING.PRICE_RULE_DETAIL(priceTableId, ruleId),
        body,
        {
          params: { branchId },
        }
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['owner', 'pricing', variables.branchId],
      });
    },
  });
}

/**
 * Xóa quy tắc tính giá
 * DELETE /api/v1/owner/pricing/price-tables/{priceTableId}/rules/{ruleId}?branchId={branchId}
 */
export function useDeletePriceTableRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ branchId, priceTableId, ruleId }: DeletePriceTableRulePayload) => {
      const response = await apiClient.delete(
        API_ENDPOINTS.PRICING.PRICE_RULE_DETAIL(priceTableId, ruleId),
        {
          params: { branchId },
        }
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['owner', 'pricing', variables.branchId],
      });
    },
  });
}

// ── MUTATIONS: KHUNG GIỜ BẮT BUỘC (FIXED TIME BLOCK) ──

/**
 * Tạo khung giờ bắt buộc liền mạch
 * POST /api/v1/owner/pricing/fixed-time-blocks?branchId={branchId}
 */
export function useCreateFixedTimeBlockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ branchId, ...body }: CreateFixedTimeBlockPayload) => {
      const response = await apiClient.post<{ id: string }>(
        API_ENDPOINTS.PRICING.FIXED_TIME_BLOCKS,
        body,
        {
          params: { branchId },
        }
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['owner', 'pricing', variables.branchId],
      });
      queryClient.invalidateQueries({
        queryKey: ['pricing', 'branch-config', variables.branchId],
      });
    },
  });
}

/**
 * Cập nhật khung giờ bắt buộc liền mạch
 * PUT /api/v1/owner/pricing/fixed-time-blocks/{blockId}?branchId={branchId}
 */
export function useUpdateFixedTimeBlockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ branchId, blockId, ...body }: UpdateFixedTimeBlockPayload) => {
      const response = await apiClient.put(
        API_ENDPOINTS.PRICING.FIXED_TIME_BLOCK_DETAIL(blockId),
        body,
        {
          params: { branchId },
        }
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['owner', 'pricing', variables.branchId],
      });
      queryClient.invalidateQueries({
        queryKey: ['pricing', 'branch-config', variables.branchId],
      });
    },
  });
}

/**
 * Xóa khung giờ bắt buộc
 * DELETE /api/v1/owner/pricing/fixed-time-blocks/{blockId}?branchId={branchId}
 */
export function useDeleteFixedTimeBlockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ branchId, blockId }: DeleteFixedTimeBlockPayload) => {
      const response = await apiClient.delete(
        API_ENDPOINTS.PRICING.FIXED_TIME_BLOCK_DETAIL(blockId),
        {
          params: { branchId },
        }
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['owner', 'pricing', variables.branchId],
      });
    },
  });
}
