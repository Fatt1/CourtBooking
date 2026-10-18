interface Props {
  name: string;
  active: boolean;
  disabled: boolean;
  onChange: (active: boolean) => void;
}

export function ServiceCategoryStatusToggle({ name, active, disabled, onChange }: Props) {
  return <div className="flex min-h-12 items-center">
    <button type="button" role="switch" aria-checked={active}
      aria-label={`${active ? 'Tạm ngưng' : 'Bật'} danh mục ${name}`}
      disabled={disabled} onClick={() => onChange(!active)}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none ${active
        ? 'border-brand-green/40 bg-brand-green shadow-[0_4px_12px_rgba(57,123,72,0.2)]'
        : 'border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-700'}`}>
      <span aria-hidden="true" className={`absolute left-1 top-1 size-6 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none ${active ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>;
}
