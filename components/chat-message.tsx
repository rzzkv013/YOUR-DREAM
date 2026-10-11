"use client";

import { useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import Image from "next/image";
import type {
  ChatMessage as ChatMessageType,
  MessageTextSize,
} from "@/types/chat";

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Use the browser fallback when clipboard permissions are unavailable.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  let copied = false;
  try {
    textarea.select();
    copied = document.execCommand("copy");
  } finally {
    textarea.remove();
  }
  if (!copied) throw new Error("Clipboard copy command failed.");
}

function CodeBlock({ segment }: { segment: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const match = segment.match(/^```([^\r\n]*)\r?\n?([\s\S]*?)\r?\n?```$/);
  const language = match?.[1].trim() || "Kod";
  const code = (match?.[2] ?? segment.replace(/^```/, "").replace(/```$/, ""))
    .replace(/^\r?\n/, "")
    .replace(/\r?\n$/, "");

  const copyCode = async () => {
    try {
      await copyText(code);
      setCopyState("copied");
    } catch (error) {
      console.error("Kodni nusxalab bo'lmadi.", error);
      setCopyState("failed");
    }
    window.setTimeout(() => setCopyState("idle"), 1800);
  };

  return (
    <div className="code-frame my-4 overflow-hidden rounded-xl">
      <div className="code-toolbar flex min-h-10 items-center justify-between gap-3 border-b border-white/[0.07] px-3 py-1.5">
        <span className="truncate text-[10px] font-medium text-zinc-400">
          {language}
        </span>
        <button
          aria-label={
            copyState === "copied"
              ? "Kod nusxalandi"
              : copyState === "failed"
                ? "Kodni nusxalash amalga oshmadi"
                : "Kodni nusxa olish"
          }
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[10px] text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-100"
          onClick={copyCode}
          type="button"
        >
          {copyState === "copied" ? <Check size={12} /> : <Copy size={12} />}
          {copyState === "copied"
            ? "Nusxalandi"
            : copyState === "failed"
              ? "Nusxalab bo'lmadi"
              : "Nusxa olish"}
        </button>
      </div>
      <pre className="code-block overflow-x-auto px-4 py-3 text-[12px] leading-6">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderContent(content: string) {
  const segments = content.split(/(```[\s\S]*?```)/g);
  return segments.map((segment, index) => {
    if (segment.startsWith("```") && segment.endsWith("```")) {
      return <CodeBlock key={index} segment={segment} />;
    }
    return segment.split("\n").map((line, lineIndex) => {
      const formatted = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, partIndex) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={partIndex} className="font-semibold text-zinc-100">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={partIndex} className="inline-code">{part.slice(1, -1)}</code>;
        }
        return part;
      });
      return (
        <span key={`${index}-${lineIndex}`}>
          {formatted}
          {lineIndex < segment.split("\n").length - 1 && <br />}
        </span>
      );
    });
  });
}

export function ChatMessage({
  message,
  compactMode = false,
  textSize = "medium",
}: {
  message: ChatMessageType;
  compactMode?: boolean;
  textSize?: MessageTextSize;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copyMessage = async () => {
    try {
      await copyText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Xabarni nusxalab bo'lmadi.", error);
    }
  };

  return (
    <article className={`message-row group flex gap-4 ${isUser ? "justify-end" : ""} ${compactMode ? "mb-5" : "mb-8"}`}>
      {!isUser && (
        <div className="assistant-avatar mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] text-violet-200">
          <Sparkles size={16} />
        </div>
      )}
      <div className={`min-w-0 ${isUser ? "max-w-[82%] sm:max-w-[75%]" : "max-w-[min(100%,720px)] flex-1"}`}>
        {!isUser && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[12px] font-semibold text-zinc-200">YOUR DREAM</span>
            <span className="rounded-full border border-violet-300/35 bg-violet-300/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-violet-100 shadow-[0_0_12px_rgba(167,139,250,0.18)]">AI</span>
          </div>
        )}
        <div className={`message-content ${isUser ? "user-bubble rounded-2xl rounded-br-md px-4 py-3 text-[13px] leading-6 text-zinc-100" : "assistant-copy text-[13px] leading-[1.85] text-zinc-300"}`} data-text-size={textSize}>
          {message.imageData && message.imageMimeType && (
            <Image
              alt={message.role === "user" ? "Biriktirilgan rasm" : "YOUR DREAM yaratgan rasm"}
              className="mb-3 max-h-[480px] w-auto max-w-full rounded-xl object-contain"
              height={1024}
              src={`data:${message.imageMimeType};base64,${message.imageData}`}
              unoptimized
              width={1024}
            />
          )}
          {message.attachmentName && !message.imageData && (
            <div className="mb-2 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-[11px] text-zinc-300">
              Biriktirilgan fayl: {message.attachmentName}
            </div>
          )}
          <div className="whitespace-pre-wrap break-words">{renderContent(message.content)}</div>
        </div>
        {!isUser && (
          <button
            aria-label="Javobdan nusxa olish"
            className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[10px] text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-200"
            onClick={copyMessage}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Nusxalandi" : "Nusxa olish"}
          </button>
        )}
      </div>
      {isUser && (
        <div className="avatar-gradient mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white">YD</div>
      )}
    </article>
  );
}
