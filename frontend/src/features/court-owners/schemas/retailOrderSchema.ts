import { z } from 'zod';

export const retailOrderSchema = z.object({
  branchId: z.string().uuid(),
  discountAmount: z.number().finite().nonnegative('Giảm giá không được âm').multipleOf(0.01, 'Giảm giá tối đa 2 chữ số thập phân'),
  items: z.array(z.object({ serviceId: z.string().uuid(), quantity: z.number().int().min(1).max(9999) }))
    .min(1, 'Vui lòng chọn sản phẩm'),
});

export const posDraftSchema = z.object({
  lines: z.array(z.object({ serviceId: z.string().uuid(), name: z.string(), unit: z.string(),
    unitPrice: z.number().finite().nonnegative(), quantity: z.number().int().min(1).max(9999) })),
  discount: z.string(),
});

export type PosDraft = z.infer<typeof posDraftSchema>;
