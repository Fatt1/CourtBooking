import { z } from 'zod';

export const createCourtOwnerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(50, 'Họ và tên không vượt quá 50 ký tự'),
  email: z
    .string()
    .trim()
    .email('Địa chỉ email không đúng định dạng'),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ (cần 10 chữ số, ví dụ 0912345678)'),
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
