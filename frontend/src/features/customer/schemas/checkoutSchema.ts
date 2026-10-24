import { z } from 'zod';

/**
 * Zod Schema cho Popup Đăng ký nhanh khi đặt sân trực tuyến
 */
export const quickRegisterSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Vui lòng nhập họ và tên')
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên tối đa 100 ký tự'),
  phoneNumber: z
    .string()
    .min(1, 'Vui lòng nhập số điện thoại')
    .refine(
      (val) => {
        const cleaned = val.replace(/[\s.-]/g, '');
        return /^(0|\+84)[35789]\d{8}$/.test(cleaned);
      },
      {
        message: 'Số điện thoại không hợp lệ (10 số, ví dụ: 0912345678)',
      }
    ),
  email: z
    .string()
    .min(1, 'Vui lòng nhập địa chỉ email')
    .email('Địa chỉ email không đúng định dạng')
    .max(100, 'Email tối đa 100 ký tự'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu')
    .min(6, 'Mật khẩu phải từ 6 ký tự trở lên')
    .max(50, 'Mật khẩu tối đa 50 ký tự'),
});

export type QuickRegisterValues = z.infer<typeof quickRegisterSchema>;

/**
 * Zod Schema cho thông tin khách hàng ở trang Checkout
 */
export const checkoutCustomerSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập họ và tên người đặt sân')
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên tối đa 100 ký tự'),
  customerPhone: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập số điện thoại liên hệ')
    .refine(
      (val) => {
        const cleaned = val.replace(/[\s.-]/g, '');
        return /^(0|\+84)[35789]\d{8}$/.test(cleaned);
      },
      {
        message: 'Số điện thoại không hợp lệ (10 số, ví dụ: 0912345678)',
      }
    ),
  customerEmail: z
    .string()
    .trim()
    .email('Địa chỉ email không đúng định dạng')
    .optional()
    .or(z.literal('')),
  customerNote: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
  isPolicyAgreed: z.boolean().refine((val) => val === true, {
    message: 'Vui lòng đồng ý với chính sách của chi nhánh trước khi thanh toán',
  }),
});

export type CheckoutCustomerValues = z.infer<typeof checkoutCustomerSchema>;
