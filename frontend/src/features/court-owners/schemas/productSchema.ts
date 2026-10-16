import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên sản phẩm').max(255, 'Tên tối đa 255 ký tự'),
  unit: z.string().trim().min(1, 'Vui lòng nhập đơn vị tính').max(50, 'Đơn vị tối đa 50 ký tự'),
  categoryId: z.string().uuid('Vui lòng chọn danh mục'),
  price: z.number({ invalid_type_error: 'Vui lòng nhập giá hợp lệ' }).min(0, 'Giá không được âm')
    .max(9999999999999999, 'Giá vượt quá giới hạn').multipleOf(0.01, 'Giá tối đa 2 chữ số thập phân'),
  isActive: z.boolean(),
  imageId: z.string().uuid().nullable(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
