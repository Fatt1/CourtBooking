import { z } from 'zod';

export const userFormSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(50),
  email: z.string().email('Email không đúng định dạng'),
  phoneNumber: z.string().optional(),
  role: z.enum(['SystemAdmin', 'CourtOwner', 'Staff', 'Player'], {
    required_error: 'Vui lòng chọn vai trò',
  }),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
