import { useQuery, useMutation } from '@tanstack/react-query';
// import { apiClient } from '@/lib/axios';
// import { API_ENDPOINTS } from '@/constants/api-endpoints';

/**
 * Mẫu Hook gọi API cho module Branches (Chưa tích hợp backend)
 * Khi backend sẵn sàng, chỉ cần bỏ comment các hàm bên dưới.
 */

// 1. Hook lấy danh sách chi nhánh của Chủ sân
export function useOwnerBranchesQuery() {
  return useQuery({
    queryKey: ['owner', 'branches'],
    queryFn: async () => {
      // const response = await apiClient.get(API_ENDPOINTS.BRANCHES.OWNER_LIST);
      // return response;
      return []; // Placeholder dữ liệu mẫu
    },
    enabled: false, // Bật lại khi backend sẵn sàng
  });
}

// 2. Hook tạo chi nhánh mới
export function useCreateBranchMutation() {
  return useMutation({
    mutationFn: async (_payload: any) => {
      // return await apiClient.post(API_ENDPOINTS.BRANCHES.CREATE, payload);
      return null;
    },
  });
}

// 3. Hook cập nhật cấu hình VietQR thụ hưởng
export function useUpdateVietQRMutation(branchId: string) {
  return useMutation({
    mutationFn: async (_qrConfig: { bankName: string; accountNo: string; accountHolder: string }) => {
      // return await apiClient.put(API_ENDPOINTS.BRANCHES.CONFIG_VIETQR(branchId), qrConfig);
      return null;
    },
  });
}
