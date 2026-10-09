import { z } from 'zod';

export const userLoginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
});

export const userRegisterSchema = z.object({
  name: z.string().min(2, 'Họ và tên ít nhất 2 ký tự'),
  email: z.string().email('Email không đúng định dạng'),
  phoneNumber: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ (10 số)'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không trùng khớp',
  path: ['confirmPassword'],
});

export type UserLoginValues = z.infer<typeof userLoginSchema>;
export type UserRegisterValues = z.infer<typeof userRegisterSchema>;
