import { z } from 'zod';

export const courtOwnerLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập địa chỉ email')
    .email('Định dạng email không hợp lệ'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự'),
  rememberMe: z.boolean().default(false),
});

export type CourtOwnerLoginValues = z.infer<typeof courtOwnerLoginSchema>;

export const courtOwnerForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập địa chỉ email liên kết với tài khoản Chủ sân')
    .email('Định dạng email không hợp lệ'),
});

export type CourtOwnerForgotPasswordValues = z.infer<typeof courtOwnerForgotPasswordSchema>;

export const courtOwnerResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự'),
    confirmPassword: z
      .string()
      .min(1, 'Vui lòng xác nhận lại mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp',
    path: ['confirmPassword'],
  });

export type CourtOwnerResetPasswordValues = z.infer<typeof courtOwnerResetPasswordSchema>;
