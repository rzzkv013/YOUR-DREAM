import { ArrowUpRight, Code2, Lightbulb, PenLine } from "lucide-react";

const suggestions = [
  {
    label: "Kod yozish",
    prompt: "Yangi g'oyam uchun chiroyli, barcha ekranlarga mos veb-sahifa yaratishga yordam ber.",
    description: "Biror narsa yaratish",
    icon: Code2,
    color: "text-violet-300",
    background: "bg-violet-400/10",
  },
  {
    label: "Ijodiy yozuv",
    prompt: "Faqat tunda paydo bo'ladigan shahar haqidagi hikoyaning kirish qismini yoz.",
    description: "Tasavvurni kengaytirish",
    icon: PenLine,
    color: "text-pink-300",
    background: "bg-pink-400/10",
  },
  {
    label: "Mavzuni tushuntirish",
    prompt: "Neyron tarmoqlar qanday o'rganishini oddiy hayotiy misol bilan tushuntir.",
    description: "Oson tushunish",
    icon: Lightbulb,
    color: "text-amber-300",
    background: "bg-amber-400/10",
  },
];

export function Suggestions({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="mt-9 grid w-full max-w-[720px] grid-cols-1 gap-3 sm:grid-cols-3">
      {suggestions.map(({ label, prompt, description, icon: Icon, color, background }) => (
        <button
          key={label}
          className="suggestion-card group rounded-2xl p-4 text-left transition duration-200 hover:-translate-y-1"
          onClick={() => onSelect(prompt)}
        >
          <div className="mb-5 flex items-center justify-between">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${background} ${color}`}>
              <Icon size={16} />
            </span>
            <ArrowUpRight size={15} className="text-zinc-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-300" />
          </div>
          <p className="text-[13px] font-medium text-zinc-200">{label}</p>
          <p className="mt-1.5 text-[11px] text-zinc-500">{description}</p>
        </button>
      ))}
    </div>
  );
}
