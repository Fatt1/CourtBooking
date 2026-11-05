import { z } from 'zod';

export const servicePackageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên gói dịch vụ không được để trống.')
    .max(50, 'Tên gói dịch vụ không quá 50 ký tự.'),
  badge: z.string().trim().max(30, 'Huy hiệu không quá 30 ký tự.').optional(),
  price: z.coerce
    .number({ invalid_type_error: 'Vui lòng nhập giá hợp lệ.' })
    .min(0, 'Giá gói dịch vụ phải lớn hơn hoặc bằng 0.'),
  durationMonths: z.coerce
    .number({ invalid_type_error: 'Vui lòng nhập số tháng hợp lệ.' })
    .min(1, 'Thời hạn tối thiểu là 1 tháng.')
    .default(1),
  description: z.string().trim().max(200).optional().default(''),
  features: z.array(z.string().trim().min(1, 'Tính năng không được để trống')).default([]),
  isActive: z.boolean().default(true),
});

export type ServicePackageFormValues = z.infer<typeof servicePackageSchema>;

export const createServicePackageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Tên gói dịch vụ phải có ít nhất 2 ký tự.')
    .max(50, 'Tên gói dịch vụ không vượt quá 50 ký tự.'),
  price: z.coerce
    .number({ invalid_type_error: 'Vui lòng nhập giá tiền hợp lệ.' })
    .min(0, 'Giá cước không được là số âm.'),
  durationMonths: z.coerce
    .number({ invalid_type_error: 'Vui lòng chọn chu kỳ thanh toán.' })
    .min(1, 'Thời hạn tối thiểu là 1 tháng.')
    .max(36, 'Thời hạn tối đa là 36 tháng.'),
});

export type CreateServicePackageFormValues = z.infer<typeof createServicePackageSchema>;

