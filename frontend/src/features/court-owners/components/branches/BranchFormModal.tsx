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
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

import { OwnerModal } from '@/features/court-owners/components/shared/OwnerModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TipTapEditor } from '@/components/ui/tiptap-editor';
import {
  LocationSelectGroup,
  TimeSelect,
  SportTypeMultiSelect,
  BankSelect,
} from '@/components/common';
import { uploadImageApi, getImageUrl } from '@/api/storage';
import {
  getProvinces,
  getWardsByProvince,
  findProvinceByName,
  findWardByName,
  extractLatLngFromGoogleMapsUrl,
} from '@/lib/vietnamLocations';
import { findBankByCodeOrName } from '@/lib/vietnamBanks';
import {
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useOwnerBranchDetailQuery,
  type OwnerBranchListItem,
  type CreateBranchPayload,
  type UpdateBranchPayload,
} from '@/api/branches';
import { useSportTypesQuery } from '@/api/sport-types';

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
  const [description, setDescription] = useState('');

  // VietQR states
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [qrImage, setQrImage] = useState<ImageItem | null>(null);
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  // Thông tin ngân hàng hoặc ví điện tử được chọn
  const selectedReceiverBank = useMemo(() => {
    return findBankByCodeOrName(bankCode || bankName);
  }, [bankCode, bankName]);

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
      setDescription(branchDetail.description || '');
      setAccountNumber(branchDetail.accountNumber || '');
      setAccountName(branchDetail.accountName || '');
      setBankCode(branchDetail.bankCode || '');
      setBankName(branchDetail.bankName || '');

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
      setDescription('');
      setAccountNumber('');
      setAccountName('');
      setBankCode('');
      setBankName('');
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

    if (!bankName.trim() && !bankCode.trim()) {
      toast.error('Vui lòng chọn ngân hàng nhận thụ hưởng');
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
      ggMapUrl: cleanGgMapUrl || (latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : undefined),
      openTime: openTime.length === 5 ? `${openTime}:00` : openTime,
      closeTime: closeTime.length === 5 ? `${closeTime}:00` : closeTime,
      qrImageId: qrImage.id,
      bankName: bankName.trim() || null,
      bankCode: bankCode.trim() || null,
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim().toUpperCase(),
      sportTypeIds: selectedSportIds,
      policy: policy.trim() || null,
      description: description.trim() || null,
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
            <Loader2 className="size-8 animate-spin text-emerald-700 dark:text-[#a3e635]" />
            <span className="text-xs">Đang tải thông tin chi nhánh...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-1">
            {/* 1. THÔNG TIN CƠ SỞ & ĐỊA CHỈ */}
            <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-border/40 text-foreground font-bold text-xs">
                <Building2 className="size-4 text-emerald-700 dark:text-[#a3e635]" />
                <span>1. Thông tin cơ sở & Địa chỉ hoạt động</span>
              </div>

              {/* Tên chi nhánh & Hotline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Tên chi nhánh <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Matchday Quận 7"
                    className="h-10 rounded-xl bg-background border-border/60 text-foreground placeholder:text-muted-foreground/60 text-xs focus-visible:ring-[#a3e635]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Hotline liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={hotline}
                    onChange={(e) => setHotline(e.target.value)}
                    placeholder="090..."
                    className="h-10 rounded-xl bg-background border-border/60 text-foreground placeholder:text-muted-foreground/60 text-xs focus-visible:ring-[#a3e635]"
                  />
                </div>
              </div>

              {/* Tỉnh/Thành phố & Quận/Huyện */}
              <LocationSelectGroup
                selectedProvinceCode={provinceCode}
                onProvinceChange={(code) => setProvinceCode(code)}
                selectedWard={district}
                onWardChange={(wardVal) => setDistrict(wardVal)}
                required
              />

              {/* Địa chỉ chi tiết */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Địa chỉ chi tiết (Số nhà, Tên đường, Phường/Xã) <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Ví dụ: 123 Nguyễn Văn Linh, P. Tân Phong"
                  className="h-10 rounded-xl bg-background border-border/60 text-foreground placeholder:text-muted-foreground/60 text-xs focus-visible:ring-[#a3e635]"
                />
              </div>

              {/* Google Maps URL & Tọa độ bóc tách */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-0.5">
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Tọa độ GPS / Google Maps URL
                    </label>
                    {latitude && longitude && (
                      <span className="text-[11px] text-emerald-700 dark:text-[#a3e635] flex items-center gap-1 font-medium">
                        <CheckCircle2 className="size-3" />
                        Đã bóc tách tọa độ
                      </span>
                    )}
                  </div>
                  <Input
                    value={ggMapUrl}
                    onChange={(e) => handleGgMapUrlChange(e.target.value)}
                    placeholder="Dán link Google Maps vào đây (https://www.google.com/maps/...)"
                    className="h-10 rounded-xl bg-background border-border/60 text-foreground placeholder:text-muted-foreground/60 text-xs focus-visible:ring-[#a3e635]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Tọa độ GPS trích xuất
                  </label>
                  <div className="h-10 rounded-xl bg-muted/40 border border-border/40 px-3 flex items-center text-xs font-mono text-foreground">
                    {latitude && longitude ? (
                      <span className="text-emerald-700 dark:text-[#a3e635]">
                        {latitude.toFixed(6)}, {longitude.toFixed(6)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50 italic text-[11px]">
                        Tự động bóc tách từ URL
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Khung giờ mở/đóng cửa & Bộ môn hoạt động */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-0.5">
                <div className="space-y-1.5">
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

                <div className="space-y-1.5">
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

                <div className="space-y-1.5">
                  <SportTypeMultiSelect
                    selectedIds={selectedSportIds}
                    onChange={setSelectedSportIds}
                    variant="dropdown"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 2. GIỚI THIỆU & CHÍNH SÁCH QUY ĐỊNH (FULL-WIDTH) */}
            <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-border/40">
                <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                  <FileText className="size-4 text-emerald-700 dark:text-[#a3e635]" />
                  <span>2. Giới thiệu chi nhánh & Chính sách quy định</span>
                </div>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  Hỗ trợ định dạng văn bản TipTap Rich Text (tiêu đề, in đậm, danh sách...)
                </span>
              </div>

              {/* TipTap Rich Text Editor */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Mô tả & Giới thiệu chi nhánh
                </label>
                <TipTapEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="Nhập thông tin giới thiệu chi nhánh, quy mô, cơ sở vật chất, tiện ích (wifi, giữ xe, phòng tắm, căn tin, điều hòa...)..."
                  minHeight="160px"
                />
              </div>

              {/* Chính sách & Quy định chi nhánh */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Chính sách & Quy định chi nhánh
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Xuống dòng để tạo các mục quy định
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={policy}
                  onChange={(e) => setPolicy(e.target.value)}
                  placeholder="Ví dụ:&#10;- Vui lòng có mặt trước giờ chơi 10 phút để xác nhận sân.&#10;- Khách hàng được hủy miễn phí trước 24h so với giờ bắt đầu thi đấu.&#10;- Mang giày thể thao chuyên dụng phù hợp và không mang thức ăn có mùi vào sân thi đấu."
                  className="w-full rounded-xl bg-background border border-border/60 p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-[#a3e635] resize-y"
                />
              </div>
            </div>

            {/* 3. HÌNH THỨC & THANH TOÁN (2 CỘT CÂN ĐỐI) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Cột trái: Thư viện ảnh chi nhánh */}
              <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <ImageIcon className="size-4 text-emerald-700 dark:text-[#a3e635]" />
                    <span>3. Thư viện ảnh chi nhánh</span>
                    <span className="text-rose-500">*</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Tối đa 5MB/ảnh</span>
                </div>

                {/* Dropzone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files) {
                      handleUploadGalleryFiles(e.dataTransfer.files);
                    }
                  }}
                  className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/70 bg-muted/30 p-4 text-center hover:border-emerald-700/60 dark:hover:border-[#a3e635]/60 hover:bg-accent transition-all"
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
                    <div className="flex flex-col items-center gap-2 text-muted-foreground py-1">
                      <Loader2 className="size-6 animate-spin text-emerald-700 dark:text-[#a3e635]" />
                      <span className="text-xs text-foreground">Đang tải và xử lý hình ảnh...</span>
                    </div>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => galleryInputRef.current?.click()}
                        className="h-9 rounded-xl bg-muted text-foreground hover:bg-accent border border-border/60 font-semibold px-4 cursor-pointer text-xs"
                      >
                        <Upload className="size-3.5 mr-1.5" />
                        <span>Tải ảnh lên</span>
                      </Button>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        Hoặc kéo thả ảnh vào đây (tỉ lệ 3:2)
                      </p>
                    </>
                  )}
                </div>

                {/* Danh sách ảnh */}
                {images.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{images.length} ảnh (kéo thả sắp xếp)</span>
                      <span className="text-emerald-700 dark:text-[#a3e635] font-semibold">Ảnh 1 là ảnh bìa</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {images.map((img, index) => (
                        <div
                          key={img.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`group relative aspect-[3/2] rounded-lg overflow-hidden border bg-muted cursor-grab active:cursor-grabbing transition-all select-none ${
                            draggedIndex === index
                              ? 'opacity-40 scale-95 border-amber-400'
                              : dragOverIndex === index
                              ? 'border-emerald-700 dark:border-[#a3e635] scale-105 shadow-md'
                              : 'border-border/60 hover:border-foreground/40'
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={`Branch ${index + 1}`}
                            className="w-full h-full object-cover"
                          />

                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-bold text-white backdrop-blur-xs">
                            {index === 0 ? '★ Bìa' : `#${index + 1}`}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(index);
                            }}
                            className="absolute top-1 right-1 size-5 rounded bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 cursor-pointer"
                            title="Xóa ảnh"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cột phải: Thông tin VietQR */}
              <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40 text-xs font-bold text-foreground">
                  <CreditCard className="size-4 text-emerald-700 dark:text-[#a3e635]" />
                  <span>4. Thông tin thanh toán VietQR / Ví điện tử</span>
                </div>

                <div className="space-y-3">
                  {/* Ngân hàng nhận */}
                  <BankSelect
                    value={bankCode || bankName}
                    onChange={(selected) => {
                      if (selected) {
                        setBankCode(selected.code);
                        setBankName(selected.shortName);
                      } else {
                        setBankCode('');
                        setBankName('');
                      }
                    }}
                    required
                  />

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-foreground">
                        {selectedReceiverBank?.type === 'wallet'
                          ? 'Số tài khoản / Số điện thoại ví'
                          : 'Số tài khoản ngân hàng'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      {selectedReceiverBank?.type === 'wallet' && (
                        <span className="text-[10px] text-pink-600 dark:text-pink-400 font-medium">
                          (Ví {selectedReceiverBank.shortName})
                        </span>
                      )}
                    </div>
                    <Input
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder={
                        selectedReceiverBank?.type === 'wallet'
                          ? `Số điện thoại đăng ký ví (vd: 0912345678)`
                          : 'Số tài khoản ngân hàng'
                      }
                      className="h-10 rounded-xl bg-background border-border/60 text-foreground font-mono text-xs focus-visible:ring-[#a3e635]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">
                      Tên chủ tài khoản <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="NGUYEN VAN A"
                      className="h-10 rounded-xl bg-background border-border/60 text-foreground uppercase text-xs focus-visible:ring-[#a3e635]"
                    />
                  </div>

                  {/* Ảnh QR */}
                  <div className="space-y-1.5 pt-0.5">
                    <label className="text-[11px] font-medium text-foreground">
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
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-background border border-border/60">
                        <img
                          src={qrImage.url}
                          alt="VietQR Code"
                          className="size-14 rounded-lg object-contain bg-white p-1 border border-border/50 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {qrImage.name || 'Mã QR thanh toán'}
                          </p>
                          <span className="text-[10px] text-emerald-700 dark:text-[#a3e635]">✓ Đã tải lên sẵn sàng</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setQrImage(null)}
                          className="size-8 p-0 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        onClick={() => qrInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border/70 bg-muted/40 hover:bg-accent cursor-pointer transition-colors"
                      >
                        {isUploadingQr ? (
                          <>
                            <Loader2 className="size-4 animate-spin text-emerald-700 dark:text-[#a3e635]" />
                            <span className="text-xs text-muted-foreground">Đang tải mã QR...</span>
                          </>
                        ) : (
                          <>
                            <QrCode className="size-4 text-emerald-700 dark:text-[#a3e635]" />
                            <span className="text-xs font-medium text-foreground">
                              Bấm để tải ảnh mã VietQR (PNG, JPG)
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Cụm Nút Hành Động */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="h-11 rounded-xl border border-border/60 bg-muted/30 px-6 text-sm font-bold text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                Hủy
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#a3e635] dark:text-black dark:hover:bg-[#8ece28] px-6 text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
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
