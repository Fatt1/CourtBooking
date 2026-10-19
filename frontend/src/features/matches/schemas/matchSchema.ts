import { z } from 'zod';

/**
 * Zod Schema cho Form Mở kèo mới (/matches/create)
 * 100% validate form tuân thủ chuẩn Zod
 */
export const createMatchSchema = z.object({
  orderId: z.string().min(1, 'Vui lòng chọn một lịch đặt sân đã thanh toán'),
  missingPlayers: z.coerce
    .number({ invalid_type_error: 'Số lượng phải là số' })
    .int('Số người tuyển phải là số nguyên')
    .min(1, 'Cần tuyển ít nhất 1 người')
    .max(30, 'Số lượng người tuyển không vượt quá 30 người'),
  skillLevel: z.string().min(1, 'Vui lòng chọn trình độ mong muốn'),
  feePerPlayer: z.coerce
    .number({ invalid_type_error: 'Phí mỗi người phải là số' })
    .min(0, 'Chi phí không được là số âm'),
  description: z
    .string()
    .max(500, 'Mô tả không được vượt quá 500 ký tự')
    .optional()
    .default(''),
  approvalMode: z.coerce
    .number()
    .refine((val) => val === 0 || val === 1, {
      message: 'Chế độ duyệt chỉ có thể là Tự động (0) hoặc Chủ phòng duyệt (1)',
    }),
});

export type CreateMatchFormValues = z.infer<typeof createMatchSchema>;

/**
 * Zod Schema cho Form Sửa kèo (/matches/:id/edit)
 */
export const updateMatchSchema = z.object({
  missingPlayers: z.coerce
    .number({ invalid_type_error: 'Số lượng phải là số' })
    .int('Số người tuyển phải là số nguyên')
    .min(1, 'Cần tuyển ít nhất 1 người')
    .max(30, 'Số lượng người tuyển không vượt quá 30 người'),
  skillLevel: z.string().min(1, 'Vui lòng chọn trình độ mong muốn'),
  feePerPlayer: z.coerce
    .number({ invalid_type_error: 'Phí mỗi người phải là số' })
    .min(0, 'Chi phí không được là số âm'),
  description: z
    .string()
    .max(500, 'Mô tả không được vượt quá 500 ký tự')
    .optional()
    .default(''),
  approvalMode: z.coerce
    .number()
    .refine((val) => val === 0 || val === 1, {
      message: 'Chế độ duyệt chỉ có thể là Tự động (0) hoặc Chủ phòng duyệt (1)',
    }),
});

export type UpdateMatchFormValues = z.infer<typeof updateMatchSchema>;
