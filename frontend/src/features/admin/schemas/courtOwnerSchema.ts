import { z } from 'zod';

export const createCourtOwnerSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự').max(50),
  email: z.string().email('Email không đúng định dạng'),
  phoneNumber: z.string().min(10, 'Số điện thoại không hợp lệ').max(15),
  businessName: z.string().optional().or(z.literal('')),
  password: z.string().min(6, 'Mật khẩu khởi tạo tối thiểu 6 ký tự').default('Owner@123456'),
  packageId: z.string().default('499.000 đ/tháng'),
  mustChangePwd: z.boolean().default(true),
});

export type CreateCourtOwnerValues = z.infer<typeof createCourtOwnerSchema>;

export const changePackageSchema = z.object({
  newPackageId: z.string().min(1, 'Vui lòng chọn gói dịch vụ mới'),
});

export type ChangePackageValues = z.infer<typeof changePackageSchema>;

export const extendSubscriptionSchema = z.object({
  durationMonths: z.coerce.number().min(1, 'Thời gian gia hạn tối thiểu 1 tháng'),
});

export type ExtendSubscriptionValues = z.infer<typeof extendSubscriptionSchema>;
