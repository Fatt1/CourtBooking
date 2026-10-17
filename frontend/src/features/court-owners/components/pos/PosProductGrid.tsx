import { useState } from 'react';
import { ImageIcon, PackageSearch } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatVND } from '@/lib/format';
import type { PosProduct } from '../../types/pos';

function ProductPhoto({ product }: { product: PosProduct }) {
  const [failed, setFailed] = useState(false);
  return product.imageUrl && !failed ? <img src={product.imageUrl} onError={() => setFailed(true)} alt=""
    className="size-full object-cover transition-transform duration-200 group-hover:scale-105" />
    : <ImageIcon className="size-7 text-muted-foreground/40" aria-hidden="true" />;
}

export function PosProductGrid({ products, loading, disabled, onAdd }: {
  products: PosProduct[]; loading: boolean; disabled: boolean; onAdd: (product: PosProduct) => void;
}) {
  if (loading) return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" aria-label="Đang tải sản phẩm">
    {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
  </div>;
  if (!products.length) return <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-muted-foreground">
    <PackageSearch className="size-10" /><p className="text-sm">Không tìm thấy sản phẩm phù hợp.</p>
  </div>;
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
    {products.map((product) => <button key={product.id} type="button" disabled={disabled || !product.available}
      onClick={() => onAdd(product)} aria-label={`Thêm ${product.name}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-2.5 text-center transition-all hover:border-brand-green/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45">
      <span className="mb-2 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-muted/70">
        <ProductPhoto key={product.imageUrl} product={product} />
      </span>
      <span className="line-clamp-2 min-h-9 text-xs font-semibold leading-relaxed">{product.name}</span>
      <span className="mt-1 text-sm font-bold text-brand-green dark:text-emerald-400">{formatVND(product.price)}</span>
      {!product.available && <span className="mt-1 text-[10px] text-muted-foreground">Tạm ngưng bán</span>}
    </button>)}
  </div>;
}
