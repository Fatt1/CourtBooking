import { z } from 'zod';

export const adminLoginSchema = z.object({
  usernameOrEmail: z.string().min(3, 'Tên đăng nhập hoặc Email không được để trống'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
  twoFactorCode: z.string().length(6, 'Mã xác thực 2FA gồm đúng 6 chữ số').optional().or(z.literal('')),
});

export type AdminLoginValues = z.infer<typeof adminLoginSchema>;
