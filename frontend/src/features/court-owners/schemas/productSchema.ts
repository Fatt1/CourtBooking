import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên sản phẩm').max(255, 'Tên tối đa 255 ký tự'),
  unit: z.string().trim().min(1, 'Vui lòng nhập đơn vị tính').max(50, 'Đơn vị tối đa 50 ký tự'),
  categoryId: z.string().uuid('Vui lòng chọn danh mục'),
  imageId: z.string().uuid().nullable(),
  branches: z.array(z.object({
    branchId: z.string().uuid(), selected: z.boolean(), price: z.union([z.number(), z.nan()]), isActive: z.boolean(),
  })),
}).superRefine((value, context) => {
  if (!value.branches.some((branch) => branch.selected)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['branches'], message: 'Chọn ít nhất một chi nhánh.' });
  }
  const seen = new Set<string>();
  value.branches.forEach((branch, index) => {
    if (seen.has(branch.branchId)) context.addIssue({ code: z.ZodIssueCode.custom,
      path: ['branches', index, 'branchId'], message: 'Chi nhánh bị trùng.' });
    seen.add(branch.branchId);
    if (branch.selected && (!Number.isFinite(branch.price) || branch.price < 0 || branch.price > 9999999999999999
      || Math.abs(Math.round(branch.price * 100) - branch.price * 100) > 0.00001)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['branches', index, 'price'],
        message: 'Nhập giá hợp lệ, từ 0 VNĐ và tối đa 2 chữ số thập phân.' });
    }
  });
});

export type ProductFormValues = z.infer<typeof productSchema>;
