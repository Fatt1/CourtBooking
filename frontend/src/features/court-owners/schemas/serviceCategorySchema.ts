import { z } from 'zod';

export const serviceCategorySchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên danh mục').max(150, 'Tên không được vượt quá 150 ký tự'),
  description: z.string().trim().max(300, 'Mô tả không được vượt quá 300 ký tự'),
  isActive: z.boolean(),
});

export type ServiceCategoryFormValues = z.infer<typeof serviceCategorySchema>;
