import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { User, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { OwnerModal } from '../shared/OwnerModal';
import { useUpdateCustomerInfoMutation } from '@/api/orders';
import { getApiErrorMessage } from '@/types/api';

interface UpdateCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  initialName?: string;
  initialPhone?: string;
  onSuccess?: () => void;
}

export function UpdateCustomerModal({
  open,
  onOpenChange,
  orderId,
  initialName = '',
  initialPhone = '',
  onSuccess,
}: UpdateCustomerModalProps) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const { mutateAsync: updateCustomer, isPending } = useUpdateCustomerInfoMutation();

  useEffect(() => {
    if (open) {
      setName(initialName);
      setPhone(initialPhone);
    }
  }, [open, initialName, initialPhone]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên khách hàng');
      return;
    }

    try {
      await updateCustomer({
        orderId,
        customerName: name.trim(),
        customerPhoneNumber: phone.trim(),
      });
      toast.success('Cập nhật thông tin khách hàng thành công!');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể cập nhật thông tin'));
    }
  };

  return (
    <OwnerModal
      open={open}
      onOpenChange={onOpenChange}
      title="Chỉnh sửa thông tin khách"
      description="Cập nhật tên và số điện thoại liên hệ của khách cho đơn đặt này."
      icon={<User className="size-5 text-[#a3e635]" />}
      maxWidth="max-w-md"
      onSubmit={handleSubmit}
      submitText={isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
      cancelText="Hủy"
      isSubmitting={isPending}
    >
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <label htmlFor="cust-name" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <User className="size-3.5 text-[#a3e635]" />
            Tên khách hàng <span className="text-rose-400">*</span>
          </label>
          <Input
            id="cust-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Nguyễn Văn A hoặc Khách vãng lai"
            className="bg-[#131d31] border-border/60 text-white placeholder:text-slate-500 focus-visible:ring-[#a3e635]/50"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cust-phone" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Phone className="size-3.5 text-[#a3e635]" />
            Số điện thoại
          </label>
          <Input
            id="cust-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0901234567..."
            className="bg-[#131d31] border-border/60 text-white placeholder:text-slate-500 focus-visible:ring-[#a3e635]/50"
          />
        </div>
      </div>
    </OwnerModal>
  );
}
