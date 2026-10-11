"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, ImagePlus, Square, WandSparkles, X } from "lucide-react";
import Image from "next/image";
import { compressImageFile } from "@/lib/image-utils";
import type { ImageAttachment } from "@/types/chat";

interface ComposerProps {
  disabled?: boolean;
  enterToSend: boolean;
  onSend: (text: string, image?: ImageAttachment, generateImage?: boolean) => void;
  onStop: () => void;
}

export function Composer({ disabled, enterToSend, onSend, onStop }: ComposerProps) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<ImageAttachment>();
  const [generateImage, setGenerateImage] = useState(false);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [text]);

  const send = () => {
    if (disabled) {
      onStop();
      return;
    }
    if (isPreparingImage || (!text.trim() && !image)) return;
    const prompt =
      text.trim() ||
      (generateImage
        ? "Biriktirilgan rasm asosida yangi rasm yarat."
        : "Iltimos, biriktirilgan rasmni ko'rib, tahlil qiling.");
    onSend(prompt, image, generateImage);
    setText("");
    setImage(undefined);
    setGenerateImage(false);
    setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  return (
    <div className="composer-wrap w-full">
      {image && (
        <div className="mb-2 flex w-fit items-center gap-2 rounded-lg border border-white/[0.08] bg-[#17171c] p-1.5 pr-2.5 text-[11px] text-zinc-300">
          <Image
            alt=""
            className="h-10 w-10 rounded-md object-cover"
            height={40}
            src={`data:${image.mimeType};base64,${image.data}`}
            unoptimized
            width={40}
          />
          <span className="max-w-[220px] truncate">{image.name}</span>
          <button
            aria-label="Biriktirilgan rasmni olib tashlash"
            onClick={() => {
              setImage(undefined);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="text-zinc-500 hover:text-white"
          >
            <X size={13} />
          </button>
        </div>
      )}
      {isPreparingImage && <p className="mb-2 text-[11px] text-violet-200">Rasm tayyorlanmoqda...</p>}
      {imageError && <p role="alert" className="mb-2 text-[11px] text-rose-300">{imageError}</p>}
      <div className="composer-shell rounded-[20px] p-2.5 transition focus-within:border-violet-300/25">
        <textarea
          ref={textareaRef}
          aria-label="YOUR DREAMga xabar yozish"
          className="max-h-[180px] min-h-[40px] w-full resize-none bg-transparent px-2.5 py-2 text-[13px] leading-6 text-zinc-100 outline-none placeholder:text-zinc-600"
          placeholder={generateImage ? "Qanday rasm yaratishni tasvirlang..." : "Istalgan savolingizni bering yoki yangi g'oya boshlang..."}
          rows={1}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing &&
              enterToSend
            ) {
              event.preventDefault();
              send();
            }
          }}
        />
        <div className="flex items-center justify-between px-1 pb-0.5 pt-1">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                event.target.value = "";
                setImageError("");
                setIsPreparingImage(true);
                void compressImageFile(file)
                  .then(setImage)
                  .catch((error: unknown) => {
                    setImageError(
                      error instanceof Error ? error.message : "Rasmni biriktirib bo'lmadi.",
                    );
                  })
                  .finally(() => setIsPreparingImage(false));
              }}
            />
            <button
              aria-label="Rasm biriktirish"
              className="composer-tool flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <ImagePlus size={16} />
            </button>
            <button
              aria-pressed={generateImage}
              className={`composer-tool flex h-8 items-center gap-1.5 rounded-lg px-2 text-[10px] transition ${
                generateImage
                  ? "bg-violet-300/15 text-violet-200"
                  : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"
              }`}
              onClick={() => setGenerateImage((value) => !value)}
              type="button"
            >
              <WandSparkles size={14} />
              <span>Rasm yaratish</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="composer-hint hidden text-[10px] text-zinc-600 sm:inline">Yangi qator — Shift + Enter</span>
            <button
              aria-label={disabled ? "Javob yozishni to'xtatish" : "Xabarni yuborish"}
              className={`send-button flex h-9 w-9 items-center justify-center rounded-xl transition ${
                disabled ? "bg-white/[0.08] text-zinc-300 hover:bg-white/[0.14]" : "bg-violet-300 text-[#17131f] hover:bg-violet-200"
              }`}
              disabled={!disabled && (isPreparingImage || (!text.trim() && !image))}
              onClick={send}
              type="button"
            >
              {disabled ? <Square size={14} fill="currentColor" /> : <ArrowUp size={18} strokeWidth={2.4} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
