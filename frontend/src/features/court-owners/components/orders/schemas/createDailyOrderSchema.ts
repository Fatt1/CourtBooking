import { z } from 'zod';
import { PaymentMethod } from '@/api/orders';

/**
 * Zod Schema bắt lỗi cho form tạo đơn đặt sân ngày tại quầy của Chủ sân (CreateDailyOrder)
 * Đồng bộ quy tắc kiểm tra với FluentValidation ở Backend (CreateOrderByOwnerValidator).
 */
export const createDailyOrderSchema = z.object({
  branchId: z
    .string({ required_error: 'Vui lòng chọn chi nhánh' })
    .min(1, 'Vui lòng chọn chi nhánh trước khi đặt sân'),

  customerName: z
    .string({ required_error: 'Tên khách hàng không được để trống' })
    .trim()
    .min(1, 'Tên khách hàng không được để trống')
    .max(255, 'Tên khách hàng không được vượt quá 255 ký tự'),

  customerPhone: z
    .string({ required_error: 'Số điện thoại không được để trống' })
    .trim()
    .min(1, 'Số điện thoại không được để trống')
    .regex(/^(0|\+84)[0-9]{9,10}$/, 'Số điện thoại không đúng định dạng hợp lệ (10 chữ số bắt đầu bằng 0)'),

  note: z
    .string()
    .max(500, 'Ghi chú không được vượt quá 500 ký tự')
    .optional()
    .nullable(),

  paymentMethod: z.nativeEnum(PaymentMethod, {
    required_error: 'Vui lòng chọn phương thức thanh toán',
  }),

  slots: z
    .array(z.any())
    .min(1, 'Vui lòng bấm vào icon lịch để chọn ít nhất 1 ca sân')
    .refine((slots) => {
      const dates = new Set(slots.map((s: any) => s.date?.split('T')[0]));
      return dates.size <= 1;
    }, 'Đơn hàng ngày chỉ được đặt trong 1 ngày duy nhất.'),
});

export type CreateDailyOrderFormValues = z.infer<typeof createDailyOrderSchema>;

// Alias tương thích
export const createOrderSchema = createDailyOrderSchema;
export type CreateOrderFormValues = CreateDailyOrderFormValues;
