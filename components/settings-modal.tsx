"use client";

import { useEffect } from "react";
import {
  Check,
  Download,
  Keyboard,
  Moon,
  Settings2,
  Sun,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import type {
  ChatConversation,
  MessageTextSize,
  UserPreferences,
} from "@/types/chat";

interface SettingsModalProps {
  isOpen: boolean;
  preferences: UserPreferences;
  conversation?: ChatConversation;
  onClose: () => void;
  onUpdatePreferences: (preferences: UserPreferences) => void;
  onClearChats: () => void;
  onExportConversation: () => void;
}

export function SettingsModal({
  isOpen,
  preferences,
  conversation,
  onClose,
  onUpdatePreferences,
  onClearChats,
  onExportConversation,
}: SettingsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggle = (key: keyof UserPreferences) =>
    onUpdatePreferences({ ...preferences, [key]: !preferences[key] });

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section aria-labelledby="settings-title" aria-modal="true" className="settings-panel max-h-[90dvh] w-full max-w-[480px] overflow-y-auto rounded-2xl" role="dialog">
        <header className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-300/10 text-violet-200"><Settings2 size={17} /></div>
            <div>
              <h2 id="settings-title" className="text-sm font-semibold text-zinc-100">Sozlamalar</h2>
              <p className="mt-0.5 text-[11px] text-zinc-500">YOUR DREAM&apos;ni o&apos;zingizga moslang</p>
            </div>
          </div>
          <button aria-label="Sozlamalarni yopish" className="icon-button" onClick={onClose}><X size={17} /></button>
        </header>
        <div className="px-6 py-5">
          <p className="section-label mb-3">KO&apos;RINISH</p>
          <div aria-label="Rang mavzusi" className="mb-4 grid grid-cols-2 gap-2" role="group">
            <ThemeButton
              active={preferences.theme === "dark"}
              label="Qora"
              icon={<Moon size={15} />}
              onClick={() => onUpdatePreferences({ ...preferences, theme: "dark" })}
            />
            <ThemeButton
              active={preferences.theme === "light"}
              label="Oq"
              icon={<Sun size={15} />}
              onClick={() => onUpdatePreferences({ ...preferences, theme: "light" })}
            />
          </div>
          <PreferenceRow
            title="Animatsiyani kamaytirish"
            description="Harakat effektlarini o'chirib, interfeysni sokinroq ko'rsatish."
            enabled={preferences.reduceMotion}
            onClick={() =>
              onUpdatePreferences({
                ...preferences,
                reduceMotion: !preferences.reduceMotion,
              })
            }
            icon={<WandSparkles size={15} />}
          />
          <div className="mb-4 mt-2">
            <p className="mb-2 px-1 text-xs font-medium text-zinc-200">
              Xabar yozuvi o&apos;lchami
            </p>
            <div aria-label="Xabar yozuvi o'lchami" className="grid grid-cols-3 gap-2" role="group">
              {([
                ["small", "Kichik"],
                ["medium", "Standart"],
                ["large", "Katta"],
              ] as const).map(([size, label]) => (
                <button
                  aria-pressed={preferences.messageTextSize === size}
                  className={`rounded-lg border px-2 py-2 text-xs transition ${
                    preferences.messageTextSize === size
                      ? "border-violet-300/30 bg-violet-300/10 text-violet-100"
                      : "border-white/[0.07] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                  key={size}
                  onClick={() =>
                    onUpdatePreferences({
                      ...preferences,
                      messageTextSize: size as MessageTextSize,
                    })
                  }
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="my-5 border-t border-white/[0.07]" />
          <p className="section-label mb-3">AFZALLIKLAR</p>
          <PreferenceRow
            title="Ixcham xabarlar"
            description="Uzun suhbatlardagi xabarlar orasidagi masofani kamaytirish."
            enabled={preferences.compactMode}
            onClick={() => toggle("compactMode")}
          />
          <PreferenceRow
            title="Enter bilan yuborish"
            description="Yuborish uchun Enter, yangi qator uchun Shift + Enter tugmalarini bosing."
            enabled={preferences.enterToSend}
            onClick={() => toggle("enterToSend")}
            icon={<Keyboard size={15} />}
          />

          <div className="my-5 border-t border-white/[0.07]" />
          <p className="section-label mb-3">SUHBAT</p>
          <button
            className="mb-2 flex w-full items-center gap-3 rounded-xl border border-white/[0.07] p-3.5 text-left transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!conversation?.messages.length}
            onClick={onExportConversation}
            type="button"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-300/10 text-violet-200"><Download size={15} /></span>
            <span>
              <span className="block text-xs font-medium text-zinc-200">Suhbatni Markdown qilib yuklab olish</span>
              <span className="mt-1 block text-[10px] text-zinc-500">Joriy suhbatni fayl sifatida saqlash</span>
            </span>
          </button>

          <div className="my-5 border-t border-white/[0.07]" />
          <p className="section-label mb-3">MA&apos;LUMOTLAR</p>
          <button
            className="flex w-full items-center gap-3 rounded-xl border border-rose-300/10 bg-rose-300/[0.035] p-3.5 text-left transition hover:border-rose-300/20 hover:bg-rose-300/[0.07]"
            onClick={() => {
              if (window.confirm("Bu brauzerda saqlangan barcha suhbatlar o'chirilsinmi? Bu amalni bekor qilib bo'lmaydi.")) {
                onClearChats();
                onClose();
              }
            }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-300/10 text-rose-300"><Trash2 size={15} /></span>
            <span>
              <span className="block text-xs font-medium text-rose-200">Barcha suhbatlarni o&apos;chirish</span>
              <span className="mt-1 block text-[10px] text-zinc-500">Suhbatlar tarixini ushbu brauzerdan olib tashlash</span>
            </span>
          </button>
        </div>
        <footer className="flex justify-end border-t border-white/[0.07] bg-white/[0.015] px-6 py-3">
          <button className="rounded-lg bg-white/[0.07] px-4 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.11]" onClick={onClose}>Tayyor</button>
        </footer>
      </section>
    </div>
  );
}

function PreferenceRow({
  title,
  description,
  enabled,
  onClick,
  icon,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button aria-pressed={enabled} className="flex w-full items-center gap-3 rounded-xl px-1 py-3 text-left" onClick={onClick} type="button">
      <span className="flex h-8 w-8 items-center justify-center text-zinc-500">{icon ?? <Settings2 size={15} />}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-zinc-200">{title}</span>
        <span className="mt-1 block text-[10px] leading-4 text-zinc-500">{description}</span>
      </span>
      <span className={`flex h-[19px] w-[33px] items-center rounded-full p-[2px] transition ${enabled ? "justify-end bg-violet-400" : "justify-start bg-zinc-700"}`}>
        <span className="flex h-[15px] w-[15px] items-center justify-center rounded-full bg-white text-violet-500 shadow-sm">
          {enabled && <Check size={10} strokeWidth={3} />}
        </span>
      </span>
    </button>
  );
}

function ThemeButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition ${
        active
          ? "border-violet-300/30 bg-violet-300/10 text-violet-100"
          : "border-white/[0.07] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label} fon
    </button>
  );
}
