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
  maxCourts: z.coerce
    .number({ invalid_type_error: 'Số lượng sân phải là số nguyên.' })
    .int('Số lượng sân phải là số nguyên.')
    .min(1, 'Số sân tối thiểu là 1 sân.')
    .default(8),
  maxBranches: z.coerce
    .number({ invalid_type_error: 'Số chi nhánh phải là số nguyên.' })
    .int('Số chi nhánh phải là số nguyên.')
    .min(1, 'Số chi nhánh tối thiểu là 1 chi nhánh.')
    .default(2),
  description: z.string().trim().max(500, 'Mô tả không được vượt quá 500 ký tự.').optional().default(''),
});

export type CreateServicePackageFormValues = z.infer<typeof createServicePackageSchema>;

