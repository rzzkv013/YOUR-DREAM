import { Sparkles } from "lucide-react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-lockup flex items-center gap-3">
      <div className="brand-mark flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
        <Sparkles size={18} strokeWidth={2.1} />
      </div>
      {!compact && (
        <span className="brand-label text-[15px] font-semibold tracking-[0.14em] text-white">
          YOUR <span className="text-violet-300">DREAM</span>
        </span>
      )}
    </div>
  );
}
