import { z } from 'zod';

/**
 * Zod Schema bắt lỗi cho form đánh giá sân của Người chơi
 * Đồng bộ quy tắc kiểm tra với CreateReviewValidator ở Backend.
 */
export const createReviewSchema = z.object({
  orderId: z
    .string({ required_error: 'Mã đơn đặt sân không được để trống' })
    .min(1, 'Mã đơn đặt sân không được để trống'),

  rating: z
    .number({ required_error: 'Vui lòng chọn số sao đánh giá' })
    .int('Số sao phải là số nguyên')
    .min(1, 'Vui lòng chọn ít nhất 1 sao')
    .max(5, 'Số sao tối đa là 5 sao'),

  comment: z
    .string()
    .trim()
    .max(1000, 'Nội dung nhận xét không được vượt quá 1000 ký tự')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type CreateReviewFormValues = z.infer<typeof createReviewSchema>;
