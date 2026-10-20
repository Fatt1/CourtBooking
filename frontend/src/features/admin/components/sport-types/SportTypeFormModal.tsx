import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UploadCloud,
  X,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { uploadImageApi, getImageUrl } from '@/api/storage';
import {
  sportTypeFormSchema,
  type SportTypeFormValues,
} from '../../schemas/sportTypeSchema';
import type { AdminSportTypeDto } from '@/api/sport-types';

interface SportTypeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: AdminSportTypeDto | null;
  onSubmit: (values: SportTypeFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function SportTypeFormModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isSubmitting = false,
}: SportTypeFormModalProps) {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SportTypeFormValues>({
    resolver: zodResolver(sportTypeFormSchema),
    defaultValues: {
      name: '',
      imageId: '',
    },
  });

  // Đồng bộ dữ liệu khi mở modal hoặc thay đổi initialData
  useEffect(() => {
    if (open) {
      if (initialData) {
        const existingImageId = initialData.imageId || initialData.image?.id || '';
        form.reset({
          name: initialData.name,
          imageId: existingImageId,
        });
        setImagePreviewUrl(
          initialData.image?.key ? getImageUrl(initialData.image.key) : null
        );
      } else {
        form.reset({
          name: '',
          imageId: '',
        });
        setImagePreviewUrl(null);
      }
    }
  }, [open, initialData, form]);

  // Upload file: Gọi API Storage trước để upload và lấy ImageId
  const handleUploadFile = async (file: File) => {
    // Validate dung lượng tối đa 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh vượt quá dung lượng cho phép', {
        description: 'Vui lòng chọn hình ảnh có dung lượng tối đa 5MB.',
      });
      return;
    }

    // Validate định dạng ảnh
    if (!file.type.startsWith('image/')) {
      toast.error('Định dạng tệp không hợp lệ', {
        description: 'Chỉ chấp nhận các tệp hình ảnh (PNG, JPG, WEBP, GIF...).',
      });
      return;
    }

    // Tạo preview tức thì cho người dùng
    const localBlobUrl = URL.createObjectURL(file);
    setImagePreviewUrl(localBlobUrl);
    setIsUploadingImage(true);

    try {
      // 1. Gọi API Storage upload hình ảnh trước (POST /api/v1/storage/upload)
      const res = await uploadImageApi(file);

      // 2. Lưu ImageId trả về vào form để sẵn sàng submit
      form.setValue('imageId', res.id, { shouldValidate: true });
      setImagePreviewUrl(getImageUrl(res.url));
      toast.success('Đã tải ảnh lên máy chủ lưu trữ thành công!');
    } catch (err: unknown) {
      console.error('Lỗi khi gọi API Storage upload:', err);
      const msg =
        (err as { detail?: string })?.detail ||
        (err as { message?: string })?.message ||
        (err instanceof Error ? err.message : 'Tải ảnh lên máy chủ thất bại');
      toast.error('Lỗi khi tải ảnh', { description: msg });
      
      // Khôi phục trạng thái nếu upload thất bại
      if (initialData?.imageId || initialData?.image?.id) {
        const oldId = initialData.imageId || initialData.image?.id || '';
        form.setValue('imageId', oldId, { shouldValidate: true });
        setImagePreviewUrl(
          initialData.image?.key ? getImageUrl(initialData.image.key) : null
        );
      } else {
        form.setValue('imageId', '', { shouldValidate: true });
        setImagePreviewUrl(null);
      }
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  const handleRemoveImage = () => {
    form.setValue('imageId', '', { shouldValidate: true });
    setImagePreviewUrl(null);
  };

  const handleFormSubmit = async (values: SportTypeFormValues) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch {
      // Error handling is handled in parent with toast
    }
  };

  const isEditing = Boolean(initialData);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-[#0f2218] border border-[#1a3828] text-zinc-100 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-[#162e21]">
          <div className="text-[10px] font-mono font-extrabold tracking-widest text-emerald-400 uppercase">
            {isEditing ? 'UPDATE SPORT TYPE' : 'NEW SPORT TYPE'}
          </div>
          <DialogTitle className="text-xl font-extrabold text-white">
            {isEditing ? 'Chỉnh sửa môn thể thao' : 'Thêm môn thể thao mới'}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            {isEditing
              ? 'Cập nhật tên và biểu tượng đại diện của môn thể thao trong hệ thống.'
              : 'Tạo môn thể thao mới để các chủ sân có thể tạo cụm sân và phân loại.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-5 pt-3"
          >
            {/* Tên môn thể thao */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-zinc-300">
                    Tên môn thể thao <span className="text-emerald-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Cầu lông, Bóng đá mini, Pickleball..."
                      className="h-10 rounded-xl bg-[#0c1a12] border border-[#1a3828] text-xs text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[11px] text-red-400" />
                </FormItem>
              )}
            />

            {/* Upload hình ảnh đại diện */}
            <FormField
              control={form.control}
              name="imageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                    <span>
                      Biểu tượng / Ảnh đại diện <span className="text-emerald-400">*</span>
                    </span>
                    <span className="text-[10px] font-normal text-zinc-500">
                      Tối đa 5MB (PNG, JPG, SVG, WebP)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />

                      {imagePreviewUrl ? (
                        /* Đã có ảnh preview */
                        <div className="relative group rounded-xl border border-[#1a3828] bg-[#0c1a12] p-3 flex items-center gap-4">
                          <div className="size-16 rounded-lg bg-[#16271e] border border-emerald-500/30 overflow-hidden flex items-center justify-center shrink-0 shadow-inner relative">
                            <img
                              src={imagePreviewUrl}
                              alt="Xem trước"
                              className="size-full object-cover"
                            />
                            {isUploadingImage && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                                <Loader2 className="size-5 text-emerald-400 animate-spin" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {isUploadingImage ? (
                              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 truncate">
                                <Loader2 className="size-3.5 animate-spin" />
                                <span>Đang tải lên Cloud Storage...</span>
                              </div>
                            ) : (
                              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 truncate">
                                <Sparkles className="size-3.5" />
                                <span>Hình ảnh sẵn sàng</span>
                              </div>
                            )}
                            <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {isUploadingImage
                                ? 'Đang cấp phát mã ImageId...'
                                : `Mã ảnh: ${field.value ? `${field.value.substring(0, 12)}...` : 'Chưa lưu'}`}
                            </div>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploadingImage}
                              className="mt-1 text-[11px] font-semibold text-zinc-400 hover:text-white underline underline-offset-2 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Tải ảnh khác thay thế
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="size-8 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors cursor-pointer"
                            title="Xóa ảnh"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ) : (
                        /* Chưa có ảnh -> Hộp kéo thả */
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                          }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                            dragOver
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-[#1a3828] bg-[#0c1a12]/80 hover:border-emerald-500/40 hover:bg-[#0c1a12]'
                          }`}
                        >
                          {isUploadingImage ? (
                            <div className="flex flex-col items-center gap-2 py-2">
                              <Loader2 className="size-7 text-emerald-400 animate-spin" />
                              <span className="text-xs text-zinc-400 font-medium">
                                Đang tải ảnh lên Cloud Storage...
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="size-11 rounded-xl bg-[#132c20] text-emerald-400 flex items-center justify-center mb-2.5 border border-emerald-500/20">
                                <UploadCloud className="size-5" />
                              </div>
                              <div className="text-xs font-bold text-zinc-200">
                                Nhấp để chọn ảnh hoặc kéo thả vào đây
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-1 max-w-[280px]">
                                Khuyến nghị ảnh vuông tỉ lệ 1:1, phông nền trong suốt hoặc hình phẳng để hiển thị đẹp nhất.
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px] text-red-400" />
                </FormItem>
              )}
            />

            {/* Gợi ý nhanh */}
            <div className="p-3 rounded-xl bg-[#0c1a12] border border-[#1a3828] flex items-start gap-2.5 text-[11px] text-zinc-400">
              <AlertCircle className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                Tên môn thể thao phải là duy nhất trên hệ thống. Sau khi tạo, chủ sân có thể liên kết môn thể thao này với chi nhánh và cụm sân của họ.
              </div>
            </div>

            <DialogFooter className="pt-2 sm:justify-end gap-2 border-t border-[#162e21]">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 px-4 rounded-xl border-[#1a3828] bg-[#0c1a12] text-zinc-300 hover:bg-[#142e20] hover:text-white text-xs cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploadingImage}
                className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-2 transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>{isEditing ? 'Lưu thay đổi' : 'Tạo môn thể thao'}</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
