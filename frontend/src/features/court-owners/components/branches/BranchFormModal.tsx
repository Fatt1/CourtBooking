import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Clock,
  QrCode,
  CreditCard,
  X,
  Loader2,
  CheckCircle2,
  Building2,
  MapPin,
  ExternalLink,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

import { OwnerModal } from '@/features/court-owners/components/shared/OwnerModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LocationSelectGroup,
  TimeSelect,
  SportTypeMultiSelect,
} from '@/components/common';
import { uploadImageApi, getImageUrl } from '@/api/storage';
import {
  getProvinces,
  getWardsByProvince,
  findProvinceByName,
  findWardByName,
  extractLatLngFromGoogleMapsUrl,
} from '@/lib/vietnamLocations';
import {
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useOwnerBranchDetailQuery,
} from '../../api/useBranches';
import { useSportTypesQuery } from '../../api/useSportTypes';
import type {
  OwnerBranchListItem,
  CreateBranchPayload,
  UpdateBranchPayload,
} from '../../types/branch';

interface ImageItem {
  id: string; // Storage Guid
  url: string; // Preview URL
  name?: string;
}

interface BranchFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchToEdit?: OwnerBranchListItem | null; // Nếu có => Mode Edit, nếu null => Mode Create
  onSuccess?: () => void;
}

export function BranchFormModal({
  open,
  onOpenChange,
  branchToEdit,
  onSuccess,
}: BranchFormModalProps) {
  const isEditMode = Boolean(branchToEdit);
  const branchId = branchToEdit?.id;

  // Lấy chi tiết chi nhánh nếu đang ở chế độ chỉnh sửa
  const { data: branchDetail, isLoading: isLoadingDetail } = useOwnerBranchDetailQuery(
    isEditMode ? branchId || null : null
  );

  // Danh sách các môn thể thao từ hệ thống
  const { data: sportTypes = [] } = useSportTypesQuery();

  // Mutations
  const { mutateAsync: createBranch, isPending: isCreating } = useCreateBranchMutation();
  const { mutateAsync: updateBranch, isPending: isUpdating } = useUpdateBranchMutation();
  const isSubmitting = isCreating || isUpdating;

  // Form states
  const [name, setName] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [ggMapUrl, setGgMapUrl] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [hotline, setHotline] = useState('');
  const [openTime, setOpenTime] = useState('06:00');
  const [closeTime, setCloseTime] = useState('23:00');
  const [policy, setPolicy] = useState('');

  // VietQR states
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [qrImage, setQrImage] = useState<ImageItem | null>(null);
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  // Gallery images states (Aspect ratio 3/2, drag & drop)
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  // Selected Sport Types
  const [selectedSportIds, setSelectedSportIds] = useState<string[]>([]);

  // Drag & drop state for gallery reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // File input refs
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const qrInputRef = useRef<HTMLInputElement | null>(null);

  // Danh sách tỉnh thành & quận huyện theo tỉnh đã chọn
  const provinces = useMemo(() => getProvinces(), []);
  const wards = useMemo(
    () => (provinceCode ? getWardsByProvince(provinceCode) : []),
    [provinceCode]
  );

  // Tên tỉnh hiện tại được chọn
  const selectedProvinceName = useMemo(() => {
    return provinces.find((p) => p.code === provinceCode)?.name || '';
  }, [provinces, provinceCode]);

  // Khởi tạo / Đồng bộ dữ liệu khi mở popup hoặc chuyển mode
  useEffect(() => {
    if (!open) return;

    if (isEditMode && branchDetail) {
      setName(branchDetail.name || '');

      // Tìm mã tỉnh từ tên tỉnh đã lưu
      const prov = findProvinceByName(branchDetail.province);
      if (prov) {
        setProvinceCode(prov.code);
        // Tìm quận/huyện
        const ward = findWardByName(prov.code, branchDetail.district);
        setDistrict(ward?.name || branchDetail.district || '');
      } else {
        setProvinceCode('');
        setDistrict(branchDetail.district || '');
      }

      setStreet(branchDetail.street || '');
      setGgMapUrl(branchDetail.ggMapUrl || '');
      setLatitude(branchDetail.latitude ?? null);
      setLongitude(branchDetail.longitude ?? null);
      setHotline(branchDetail.hotline || '');
      setOpenTime(branchDetail.openTime ? branchDetail.openTime.slice(0, 5) : '06:00');
      setCloseTime(branchDetail.closeTime ? branchDetail.closeTime.slice(0, 5) : '23:00');
      setPolicy(branchDetail.policy || '');
      setAccountNumber(branchDetail.accountNumber || '');
      setAccountName(branchDetail.accountName || '');

      // QR Image
      if (branchDetail.qrImage) {
        setQrImage({
          id: branchDetail.qrImage.id,
          url: getImageUrl(branchDetail.qrImage.key),
        });
      } else {
        setQrImage(null);
      }

      // Gallery Images
      if (branchDetail.images && branchDetail.images.length > 0) {
        setImages(
          branchDetail.images.map((img) => ({
            id: img.id,
            url: getImageUrl(img.key),
          }))
        );
      } else {
        setImages([]);
      }

      // Sports
      if (branchDetail.sports) {
        setSelectedSportIds(branchDetail.sports.map((s) => s.id));
      } else {
        setSelectedSportIds([]);
      }
    } else if (!isEditMode) {
      // Chế độ tạo mới: Đặt giá trị mặc định
      setName('');
      // Mặc định chọn Hồ Chí Minh (code "12") nếu có
      const hcm = provinces.find((p) => p.name.includes('Hồ Chí Minh'));
      if (hcm) {
        setProvinceCode(hcm.code);
      } else if (provinces.length > 0) {
        setProvinceCode(provinces[0].code);
      }
      setDistrict('');
      setStreet('');
      setGgMapUrl('');
      setLatitude(null);
      setLongitude(null);
      setHotline('');
      setOpenTime('06:00');
      setCloseTime('23:00');
      setPolicy('Khách hàng được hủy miễn phí trước 24h so với giờ bắt đầu thi đấu.');
      setAccountNumber('');
      setAccountName('');
      setQrImage(null);
      setImages([]);
      setSelectedSportIds(sportTypes.length > 0 ? [sportTypes[0].id] : []);
    }
  }, [open, isEditMode, branchDetail, provinces, sportTypes]);

  // Xử lý khi paste / thay đổi Google Maps URL => Tự động bóc tách Latitude & Longitude
  const handleGgMapUrlChange = (val: string) => {
    setGgMapUrl(val);
    const coords = extractLatLngFromGoogleMapsUrl(val);
    if (coords) {
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
      toast.success(
        `Đã trích xuất tọa độ: [${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}]`
      );
    }
  };

  // Xử lý upload ảnh thư viện (Cho phép chọn nhiều ảnh, aspect ratio 3/2, tối đa 5MB)
  const handleUploadGalleryFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Kiểm tra dung lượng tối đa 5MB mỗi ảnh
    const invalidFiles = fileArray.filter((f) => f.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error('Một số ảnh vượt quá kích thước cho phép', {
        description: 'Vui lòng chỉ tải ảnh có dung lượng tối đa 5MB.',
      });
      return;
    }

    setIsUploadingGallery(true);
    let successCount = 0;

    for (const file of fileArray) {
      try {
        const uploadRes = await uploadImageApi(file);
        setImages((prev) => [
          ...prev,
          {
            id: uploadRes.id,
            url: getImageUrl(uploadRes.url),
            name: uploadRes.originalFileName,
          },
        ]);
        successCount++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Tải ảnh thất bại';
        toast.error(`Lỗi khi tải ảnh "${file.name}": ${message}`);
      }
    }

    setIsUploadingGallery(false);
    if (successCount > 0) {
      toast.success(`Đã tải lên thành công ${successCount} ảnh chi nhánh.`);
    }
  };

  // Xử lý kéo thả ảnh để sắp xếp thứ tự (HTML5 Drag & Drop)
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    const sourceIndex = parseInt(sourceIndexStr, 10);

    if (!isNaN(sourceIndex) && sourceIndex !== dropIndex) {
      setImages((prev) => {
        const next = [...prev];
        const [moved] = next.splice(sourceIndex, 1);
        next.splice(dropIndex, 0, moved);
        return next;
      });
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Xóa 1 ảnh trong gallery
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload mã VietQR (Tách riêng biệt)
  const handleUploadQrFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh mã QR không được vượt quá 5MB.');
      return;
    }

    try {
      setIsUploadingQr(true);
      const res = await uploadImageApi(file);
      setQrImage({
        id: res.id,
        url: getImageUrl(res.url),
        name: res.originalFileName,
      });
      toast.success('Đã tải lên ảnh mã QR thanh toán!');
    } catch {
      toast.error('Không thể tải lên ảnh mã QR.');
    } finally {
      setIsUploadingQr(false);
      if (qrInputRef.current) qrInputRef.current.value = '';
    }
  };

  // Toggle môn thể thao
  const toggleSport = (sportId: string) => {
    setSelectedSportIds((prev) =>
      prev.includes(sportId) ? prev.filter((id) => id !== sportId) : [...prev, sportId]
    );
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Kiểm tra validation cơ bản
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên chi nhánh');
      return;
    }

    if (!selectedProvinceName) {
      toast.error('Vui lòng chọn Tỉnh/Thành phố');
      return;
    }

    if (!district.trim()) {
      toast.error('Vui lòng chọn hoặc nhập Quận/Huyện');
      return;
    }

    if (!street.trim()) {
      toast.error('Vui lòng nhập địa chỉ chi tiết (Số nhà, tên đường)');
      return;
    }

    if (!hotline.trim()) {
      toast.error('Vui lòng nhập số Hotline');
      return;
    }

    if (!ggMapUrl.trim()) {
      toast.error('Vui lòng nhập liên kết Google Maps của chi nhánh');
      return;
    }

    // Yêu cầu bắt buộc tải ít nhất 1 ảnh chi nhánh
    if (images.length === 0) {
      toast.error('Yêu cầu phải tải lên ít nhất 1 tấm ảnh cho chi nhánh!');
      return;
    }

    // Yêu cầu ảnh mã QR thanh toán
    if (!qrImage?.id) {
      toast.error('Vui lòng tải lên ảnh mã QR thanh toán cho chi nhánh!');
      return;
    }

    if (!accountNumber.trim() || !accountName.trim()) {
      toast.error('Vui lòng nhập số tài khoản và tên chủ tài khoản thụ hưởng');
      return;
    }

    if (selectedSportIds.length === 0) {
      toast.error('Chi nhánh phải có ít nhất một môn thể thao hoạt động.');
      return;
    }

    // Đảm bảo URL Google Maps không vượt quá 255 ký tự (ràng buộc của Database)
    // Nếu URL dài hơn 255 và đã có tọa độ, rút gọn về định dạng chuẩn maps?q=lat,lng
    let cleanGgMapUrl = ggMapUrl.trim();
    if (cleanGgMapUrl.length > 255 && latitude && longitude) {
      cleanGgMapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    }

    const payload: CreateBranchPayload = {
      name: name.trim(),
      hotline: hotline.trim(),
      province: selectedProvinceName,
      district: district.trim(),
      street: street.trim(),
      ggMapUrl: cleanGgMapUrl,
      openTime: openTime.length === 5 ? `${openTime}:00` : openTime,
      closeTime: closeTime.length === 5 ? `${closeTime}:00` : closeTime,
      qrImageId: qrImage.id,
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim().toUpperCase(),
      sportTypeIds: selectedSportIds,
      policy: policy.trim() || null,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      imageIds: images.map((img) => img.id),
    };

    try {
      if (isEditMode && branchId) {
        const updatePayload: UpdateBranchPayload = {
          ...payload,
          id: branchId,
        };
        await updateBranch(updatePayload);
        toast.success(`Cập nhật chi nhánh "${name}" thành công!`);
      } else {
        await createBranch(payload);
        toast.success(`Tạo mới chi nhánh "${name}" thành công!`);
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const message =
        (err as { detail?: string })?.detail ||
        (err as Error)?.message ||
        'Đã có lỗi xảy ra khi lưu chi nhánh. Vui lòng kiểm tra lại thông tin!';
      toast.error(message);
    }
  };

  return (
    <OwnerModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Cập nhật thông tin chi nhánh' : 'Thông tin chi nhánh'}
      description={
        isEditMode
          ? 'Chỉnh sửa cơ sở sân bãi, ảnh đại diện và tọa độ bản đồ.'
          : 'Điền đầy đủ thông tin để thêm cơ sở mới vào hệ thống quản lý.'
      }
      icon={<Building2 className="size-5" />}
      maxWidth="max-w-5xl"
      hideFooter
    >

        {isEditMode && isLoadingDetail ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-[#a3e635]" />
            <span className="text-xs">Đang tải thông tin chi nhánh...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            {/* 2 Cột Bố Cục Chính như bản thiết kế */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CỘT TRÁI: Tên chi nhánh, Tỉnh/Huyện, Thư viện ảnh (3/2), Địa chỉ */}
              <div className="space-y-4">
                {/* 1. Tên chi nhánh */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200">
                    Tên chi nhánh <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Matchday Quận 7"
                    className="h-11 rounded-xl bg-[#111c33] border-border/60 text-white placeholder:text-muted-foreground/60 focus-visible:ring-[#a3e635]"
                  />
                </div>

                {/* 2. Tỉnh/Thành phố & Quận/Huyện từ JSON (Hỗ trợ tìm kiếm theo tên) */}
                <LocationSelectGroup
                  selectedProvinceCode={provinceCode}
                  onProvinceChange={(code) => {
                    setProvinceCode(code);
                  }}
                  selectedWard={district}
                  onWardChange={(wardVal) => setDistrict(wardVal)}
                  required
                />

                {/* 3. Thư viện ảnh chi nhánh (Aspect Ratio 3/2, Kéo thả sắp xếp, upload API) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200">
                      Thư viện ảnh chi nhánh (Cho phép chọn nhiều ảnh){' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground">Tối đa 5MB/ảnh</span>
                  </div>

                  {/* Vùng Dropzone tải ảnh */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files) {
                        handleUploadGalleryFiles(e.dataTransfer.files);
                      }
                    }}
                    className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/70 bg-[#0d162b]/80 p-6 text-center hover:border-[#a3e635]/60 hover:bg-[#111d38] transition-all"
                  >
                    <input
                      ref={galleryInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) handleUploadGalleryFiles(e.target.files);
                        if (galleryInputRef.current) galleryInputRef.current.value = '';
                      }}
                      className="hidden"
                    />

                    {isUploadingGallery ? (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground py-2">
                        <Loader2 className="size-7 animate-spin text-[#a3e635]" />
                        <span className="text-xs text-white">Đang tải và xử lý hình ảnh...</span>
                      </div>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => galleryInputRef.current?.click()}
                          className="h-10 rounded-xl bg-[#1b2742] text-white hover:bg-[#233355] border border-border/60 font-semibold px-5 cursor-pointer"
                        >
                          <Upload className="size-4 mr-2" />
                          <span>Tải ảnh lên</span>
                        </Button>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Hoặc kéo thả ảnh vào đây
                        </p>
                      </>
                    )}
                  </div>

                  {/* Danh sách ảnh đã tải - Hiển thị tỉ lệ 3/2 và cho phép kéo qua lại */}
                  {images.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Đã tải {images.length} ảnh (Kéo thả để sắp xếp thứ tự)</span>
                        <span className="text-[#a3e635] font-semibold">Ảnh đầu tiên là ảnh bìa</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {images.map((img, index) => (
                          <div
                            key={img.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`group relative aspect-[3/2] rounded-xl overflow-hidden border bg-slate-900 cursor-grab active:cursor-grabbing transition-all select-none ${
                              draggedIndex === index
                                ? 'opacity-40 scale-95 border-amber-400'
                                : dragOverIndex === index
                                ? 'border-[#a3e635] scale-105 shadow-md'
                                : 'border-border/60 hover:border-slate-500'
                            }`}
                          >
                            <img
                              src={img.url}
                              alt={`Branch ${index + 1}`}
                              className="w-full h-full object-cover"
                            />

                            {/* Badge thứ tự */}
                            <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/75 text-[10px] font-bold text-white backdrop-blur-xs">
                              {index === 0 ? '★ Ảnh bìa' : `#${index + 1}`}
                            </div>

                            {/* Nút xóa ảnh */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(index);
                              }}
                              className="absolute top-1.5 right-1.5 size-6 rounded-md bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 cursor-pointer"
                              title="Xóa ảnh"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Địa chỉ chi tiết */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200">
                    Địa chỉ chi tiết (Số nhà, Tên đường, Phường/Xã){' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Ví dụ: 123 Nguyễn Văn Linh, P. Tân Phong"
                    className="h-11 rounded-xl bg-[#111c33] border-border/60 text-white placeholder:text-muted-foreground/60 focus-visible:ring-[#a3e635]"
                  />
                </div>
              </div>

              {/* CỘT PHẢI: Google Maps URL + Lat/Lng (readonly), Hotline, Giờ, Chính sách, VietQR */}
              <div className="space-y-4">
                {/* 1. Tọa độ GPS / Google Maps URL */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200">
                      Tọa độ GPS / Google Maps URL <span className="text-rose-500">*</span>
                    </label>
                    {latitude && longitude && (
                      <span className="text-[11px] text-[#a3e635] flex items-center gap-1 font-medium">
                        <CheckCircle2 className="size-3" />
                        Đã xác định tọa độ
                      </span>
                    )}
                  </div>
                  <Input
                    required
                    value={ggMapUrl}
                    onChange={(e) => handleGgMapUrlChange(e.target.value)}
                    placeholder="Dán link Google Maps vào đây (https://www.google.com/maps/...)"
                    className="h-11 rounded-xl bg-[#111c33] border-border/60 text-white placeholder:text-muted-foreground/60 focus-visible:ring-[#a3e635]"
                  />
                </div>

                {/* 2. Trường Vĩ độ & Kinh độ (Read-only, không được nhập tay) */}
                <div className="space-y-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Vĩ độ (Latitude)
                      </label>
                      <Input
                        disabled
                        readOnly
                        value={latitude !== null ? latitude.toString() : ''}
                        placeholder="Tự động bóc tách"
                        className="h-10 rounded-xl bg-[#090f1d] border-border/40 text-slate-300 font-mono text-xs cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Kinh độ (Longitude)
                      </label>
                      <Input
                        disabled
                        readOnly
                        value={longitude !== null ? longitude.toString() : ''}
                        placeholder="Tự động bóc tách"
                        className="h-10 rounded-xl bg-[#090f1d] border-border/40 text-slate-300 font-mono text-xs cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-0.5">
                    <Info className="size-3 text-sky-400" />
                    <span>Tọa độ được tự động lấy từ đường dẫn Google Maps, không cho phép nhập tay.</span>
                  </p>
                </div>

                {/* 3. Hotline & Khung giờ mở cửa */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-xs font-semibold text-slate-200">
                      Hotline <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      value={hotline}
                      onChange={(e) => setHotline(e.target.value)}
                      placeholder="090..."
                      className="h-11 rounded-xl bg-[#111c33] border-border/60 text-white placeholder:text-muted-foreground/60 focus-visible:ring-[#a3e635]"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <TimeSelect
                      label="Giờ mở cửa"
                      required
                      value={openTime}
                      onChange={setOpenTime}
                      stepMinutes={30}
                      startHour={0}
                      endHour={24}
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <TimeSelect
                      label="Giờ đóng cửa"
                      required
                      value={closeTime}
                      onChange={setCloseTime}
                      stepMinutes={30}
                      startHour={0}
                      endHour={24}
                    />
                  </div>
                </div>

                {/* 4. Điều khoản hủy đặt sân */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200">
                    Điều khoản hủy đặt sân
                  </label>
                  <textarea
                    rows={2}
                    value={policy}
                    onChange={(e) => setPolicy(e.target.value)}
                    placeholder="Khách hàng được hủy miễn phí trước 24h..."
                    className="w-full rounded-xl bg-[#111c33] border border-border/60 p-3 text-xs text-white placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-[#a3e635] resize-none"
                  />
                </div>

                {/* 5. TÁCH RIÊNG: Thông tin VietQR thanh toán */}
                <div className="rounded-2xl border border-border/60 bg-[#0d162b] p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                    <CreditCard className="size-4 text-[#a3e635]" />
                    <span>Thông tin thanh toán VietQR (Tách riêng biệt)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-300">
                        Số tài khoản <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Số tài khoản ngân hàng"
                        className="h-10 rounded-xl bg-[#111c33] border-border/60 text-white font-mono text-xs focus-visible:ring-[#a3e635]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-300">
                        Tên chủ tài khoản <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        required
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="NGUYEN VAN A"
                        className="h-10 rounded-xl bg-[#111c33] border-border/60 text-white uppercase text-xs focus-visible:ring-[#a3e635]"
                      />
                    </div>
                  </div>

                  {/* Upload Ảnh QR Code riêng */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-medium text-slate-300">
                      Ảnh mã QR thanh toán <span className="text-rose-500">*</span>
                    </label>

                    <input
                      ref={qrInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadQrFile}
                      className="hidden"
                    />

                    {qrImage ? (
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#111c33] border border-border/60">
                        <img
                          src={qrImage.url}
                          alt="VietQR Code"
                          className="size-14 rounded-lg object-contain bg-white p-1 border border-border/50"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {qrImage.name || 'Mã QR thanh toán'}
                          </p>
                          <span className="text-[10px] text-[#a3e635]">✓ Đã tải lên sẵn sàng</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setQrImage(null)}
                          className="size-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        onClick={() => qrInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border/70 bg-[#111c33]/60 hover:bg-[#15233f] cursor-pointer transition-colors"
                      >
                        {isUploadingQr ? (
                          <>
                            <Loader2 className="size-4 animate-spin text-[#a3e635]" />
                            <span className="text-xs text-muted-foreground">Đang tải mã QR...</span>
                          </>
                        ) : (
                          <>
                            <QrCode className="size-4 text-[#a3e635]" />
                            <span className="text-xs font-medium text-slate-200">
                              Bấm để tải ảnh mã QR VietQR (PNG, JPG)
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Môn thể thao tại cơ sở (Multi-select) */}
                <SportTypeMultiSelect
                  selectedIds={selectedSportIds}
                  onChange={setSelectedSportIds}
                  variant="pills"
                  required
                />
              </div>
            </div>

            {/* Footer Cụm Nút Hành Động */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="h-11 rounded-xl border border-border/60 bg-[#131d31] px-6 text-sm font-bold text-white hover:bg-[#1a2742] transition-colors cursor-pointer"
              >
                Hủy
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-xl bg-[#a3e635] px-6 text-sm font-bold text-black hover:bg-[#8ece28] shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    <span>Đang lưu chi nhánh...</span>
                  </div>
                ) : isEditMode ? (
                  'Lưu chi nhánh'
                ) : (
                  'Tạo chi nhánh'
                )}
              </Button>
            </div>
          </form>
        )}
    </OwnerModal>
  );
}
