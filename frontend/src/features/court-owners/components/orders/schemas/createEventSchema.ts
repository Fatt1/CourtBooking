import { z } from 'zod';

/**
 * Zod Schema xác thực dữ liệu khi tạo sự kiện mới (CreateEventModal)
 */
export const createEventSchema = z
  .object({
    branchId: z
      .string({ required_error: 'Vui lòng chọn chi nhánh' })
      .min(1, 'Vui lòng chọn chi nhánh'),

    title: z
      .string({ required_error: 'Tên sự kiện không được để trống' })
      .trim()
      .min(1, 'Tên sự kiện không được để trống')
      .max(255, 'Tên sự kiện tối đa 255 ký tự'),

    sportTypeId: z
      .string({ required_error: 'Vui lòng chọn môn thể thao' })
      .min(1, 'Vui lòng chọn môn thể thao'),

    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),

    ticketPrice: z
      .number({ invalid_type_error: 'Giá vé phải là số' })
      .min(0, 'Giá vé không được là số âm'),

    slots: z
      .number({ invalid_type_error: 'Số lượng vé tối đa phải là số' })
      .int('Số lượng vé phải là số nguyên')
      .min(1, 'Số lượng vé tối đa phải lớn hơn 0'),

    skillLevelFrom: z.string().optional().nullable(),
    skillLevelTo: z.string().optional().nullable(),
    description: z.string().optional().nullable(),

    customerName: z.string().max(255).optional().nullable(),
    customerPhone: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => !val || /^(0|\+84)[0-9]{9,10}$/.test(val),
        'Số điện thoại không đúng định dạng hợp lệ (10 chữ số bắt đầu bằng 0)'
      ),
    note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional().nullable(),

    courtSlots: z
      .array(z.any())
      .min(1, 'Vui lòng chọn ít nhất một ca sân để khóa lịch cho sự kiện'),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.endDate) > new Date(data.startDate);
    },
    {
      message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
      path: ['endDate'],
    }
  );

export type CreateEventFormValues = z.infer<typeof createEventSchema>;

/**
 * Zod Schema xác thực dữ liệu khi chỉnh sửa sự kiện (EventDetailModal)
 */
export const updateEventSchema = z
  .object({
    title: z
      .string({ required_error: 'Tên sự kiện không được để trống' })
      .trim()
      .min(1, 'Tên sự kiện không được để trống')
      .max(255, 'Tên sự kiện tối đa 255 ký tự'),

    sportTypeId: z
      .string({ required_error: 'Vui lòng chọn môn thể thao' })
      .min(1, 'Vui lòng chọn môn thể thao'),

    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),

    ticketPrice: z
      .number({ invalid_type_error: 'Giá vé phải là số' })
      .min(0, 'Giá vé không được là số âm'),

    slots: z
      .number({ invalid_type_error: 'Số lượng vé tối đa phải là số' })
      .int('Số lượng vé phải là số nguyên')
      .min(1, 'Số lượng vé tối đa phải lớn hơn 0'),

    status: z.number().int().min(0).max(3),

    skillLevelFrom: z.string().optional().nullable(),
    skillLevelTo: z.string().optional().nullable(),
    description: z.string().optional().nullable(),

    customerName: z.string().max(255).optional().nullable(),
    customerPhone: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => !val || /^(0|\+84)[0-9]{9,10}$/.test(val),
        'Số điện thoại không đúng định dạng hợp lệ (10 chữ số bắt đầu bằng 0)'
      ),
    note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.endDate) > new Date(data.startDate);
    },
    {
      message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
      path: ['endDate'],
    }
  );

export type UpdateEventFormValues = z.infer<typeof updateEventSchema>;
