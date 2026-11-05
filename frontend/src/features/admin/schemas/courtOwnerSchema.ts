import { z } from 'zod';

export const createCourtOwnerSchema = z.object({
  fullName: z
    .string({ required_error: 'Vui lòng nhập họ và tên chủ sân' })
    .trim()
    .min(1, 'Họ và tên không được để trống')
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(50, 'Họ và tên không vượt quá 50 ký tự')
    .superRefine((val, ctx) => {
      if (/\d/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Họ và tên không được chứa chữ số.',
        });
      }
    }),
  email: z
    .string({ required_error: 'Vui lòng nhập email đăng nhập' })
    .trim()
    .min(1, 'Email không được để trống')
    .email('Địa chỉ email không đúng định dạng'),
  phoneNumber: z
    .string({ required_error: 'Vui lòng nhập số điện thoại' })
    .trim()
    .min(1, 'Số điện thoại không được để trống')
    .superRefine((val, ctx) => {
      // 1. Kiểm tra chứa chữ hoặc ký tự đặc biệt
      if (/[^\d]/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Số điện thoại không được chứa chữ hoặc ký tự đặc biệt.',
        });
        return;
      }
      // 2. Kiểm tra quá 10 số
      if (val.length > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Số điện thoại không được vượt quá 10 số.',
        });
        return;
      }
      // 3. Kiểm tra bắt đầu bằng số 0
      if (!val.startsWith('0')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Số điện thoại phải bắt đầu bằng số 0.',
        });
        return;
      }
      // 4. Kiểm tra thiếu số (< 10 số)
      if (val.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Số điện thoại phải có đủ 10 số.',
        });
        return;
      }
    }),
  businessName: z.string().trim().optional().or(z.literal('')),
  password: z
    .string({ required_error: 'Vui lòng nhập mật khẩu khởi tạo' })
    .trim()
    .min(1, 'Mật khẩu khởi tạo không được để trống')
    .min(6, 'Mật khẩu khởi tạo tối thiểu 6 ký tự'),
  packageId: z
    .string({ required_error: 'Vui lòng chọn 1 gói cước dịch vụ' })
    .trim()
    .min(1, 'Vui lòng chọn 1 gói cước dịch vụ'),
  mustChangePwd: z.boolean().default(true),
});

export type CreateCourtOwnerValues = z.infer<typeof createCourtOwnerSchema>;

export const changePackageSchema = z.object({
  newPackageId: z.string().min(1, 'Vui lòng chọn 1 gói cước dịch vụ để áp dụng'),
});

export type ChangePackageValues = z.infer<typeof changePackageSchema>;

export const extendSubscriptionSchema = z.object({
  durationMonths: z.coerce
    .number({ invalid_type_error: 'Vui lòng chọn thời gian gia hạn hợp lệ' })
    .int('Thời gian gia hạn phải là số tháng nguyên')
    .min(1, 'Thời gian gia hạn tối thiểu 1 tháng')
    .max(36, 'Thời gian gia hạn tối đa 36 tháng'),
});

export type ExtendSubscriptionValues = z.infer<typeof extendSubscriptionSchema>;
