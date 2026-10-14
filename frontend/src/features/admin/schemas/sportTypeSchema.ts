import { z } from 'zod';

export const sportTypeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên môn thể thao không được để trống.')
    .max(100, 'Tên môn thể thao không được vượt quá 100 ký tự.'),
  imageId: z
    .string()
    .min(1, 'Vui lòng tải lên ảnh biểu tượng của môn thể thao.'),
});

export type SportTypeFormValues = z.infer<typeof sportTypeFormSchema>;
