"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Menu,
  MoreHorizontal,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useChatStore } from "@/hooks/use-chat-store";
import { Sidebar } from "@/components/sidebar";
import { ChatMessage } from "@/components/chat-message";
import { Composer } from "@/components/composer";
import { SettingsModal } from "@/components/settings-modal";
import { Suggestions } from "@/components/suggestions";
import { SignInScreen } from "@/components/sign-in-screen";
import { useUserProfile, type UserProfile } from "@/hooks/use-user-profile";
import { compressImageData } from "@/lib/image-utils";
import type { ChatConversation, ImageAttachment } from "@/types/chat";

function exportConversation(conversation: ChatConversation) {
  const markdown = [
    `# ${conversation.title}`,
    "",
    `YOUR DREAM'dan yuklab olindi: ${new Date().toLocaleString("uz-Latn")}`,
    "",
    ...conversation.messages.flatMap((message) => [
      `## ${message.role === "user" ? "Siz" : "YOUR DREAM"}`,
      "",
      ...(message.attachmentName ? [`_Biriktirilgan fayl: ${message.attachmentName}_`, ""] : []),
      ...(message.imageData ? ["_Rasm biriktirilgan yoki yaratildi._", ""] : []),
      message.content,
      "",
    ]),
  ].join("\n");
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${conversation.title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").slice(0, 80) || "conversation"}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ChatApp() {
  const auth = useUserProfile();

  if (auth.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <div className="loading-mark"><Sparkles size={21} /></div>
      </main>
    );
  }

  if (!auth.profile) {
    return (
      <SignInScreen
        error={auth.error}
        onContinueAsGuest={auth.signInAsGuest}
      />
    );
  }

  return (
    <ChatWorkspace
      key={auth.profile.uid}
      profile={auth.profile}
      onSignOut={() => void auth.signOut()}
    />
  );
}

function ChatWorkspace({
  profile,
  onSignOut,
}: {
  profile: UserProfile;
  onSignOut: () => void;
}) {
  const {
    conversations,
    activeConversation,
    preferences,
    isHydrated,
    newChat,
    selectChat,
    deleteChat,
    addMessage,
    appendToMessage,
    setMessageImage,
    updatePreferences,
    clearAllChats,
  } = useChatStore(profile.uid, profile.provider === "guest");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamRunRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isEmpty = !activeConversation?.messages.length;

  const generateResponse = useCallback(
    async (prompt: string, image?: ImageAttachment) => {
      setIsStreaming(true);
      const messageId = addMessage("assistant", "");
      const runId = ++streamRunRef.current;
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const latestImageId = [...activeConversation.messages]
        .reverse()
        .find((message) => message.role === "user" && message.imageData)?.id;
      const messages = [
        ...activeConversation.messages
          .filter(({ content }) => content.trim().length > 0)
          .map(({ id, role, content, attachmentName: fileName, imageData, imageMimeType }) => ({
            role,
            content: fileName && !imageData
              ? `${content}\n\n[Fayl nomi: ${fileName}. Fayl mazmuni sun'iy intellektga yuborilmagan.]`
              : content,
            ...(id === latestImageId && imageData && imageMimeType
              ? { image: { mimeType: imageMimeType, data: imageData } }
              : {}),
          })),
        {
          role: "user" as const,
          content: prompt,
          ...(image ? { image: { mimeType: image.mimeType, data: image.data } } : {}),
        },
      ];

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const result: unknown = await response.json();
          const errorMessage =
            typeof result === "object" &&
            result !== null &&
            "error" in result &&
            typeof result.error === "string"
              ? result.error
              : "Sun'iy intellekt javobini olib bo'lmadi.";
          appendToMessage(messageId, `Javob olib bo'lmadi: ${errorMessage}`);
          return;
        }

        if (!response.body) {
          appendToMessage(messageId, "Sun'iy intellekt javobini olib bo'lmadi.");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (streamRunRef.current === runId) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          if (text) appendToMessage(messageId, text);
        }
        const trailingText = decoder.decode();
        if (trailingText && streamRunRef.current === runId) {
          appendToMessage(messageId, trailingText);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Gemini javobini qabul qilib bo'lmadi.", error);
        if (streamRunRef.current === runId) {
          appendToMessage(
            messageId,
            "Sun'iy intellektdan javob olishda uzilish yuz berdi. Internet aloqasi va Gemini API kalitini tekshirib, qayta urinib ko'ring.",
          );
        }
      } finally {
        if (streamRunRef.current === runId) {
          abortControllerRef.current = null;
          setIsStreaming(false);
        }
      }
    },
    [activeConversation.messages, addMessage, appendToMessage],
  );

  const generateImageResponse = useCallback(
    async (prompt: string, image?: ImageAttachment) => {
      setIsStreaming(true);
      const messageId = addMessage("assistant", "");
      const runId = ++streamRunRef.current;
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch("/api/images/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            ...(image ? { image: { mimeType: image.mimeType, data: image.data } } : {}),
          }),
          signal: abortController.signal,
        });
        const result: unknown = await response.json();
        if (!response.ok) {
          const errorMessage =
            typeof result === "object" &&
            result !== null &&
            "error" in result &&
            typeof result.error === "string"
              ? result.error
              : "Rasm yaratib bo'lmadi.";
          appendToMessage(messageId, `Rasm yaratib bo'lmadi: ${errorMessage}`);
          return;
        }
        if (
          typeof result !== "object" ||
          result === null ||
          !("data" in result) ||
          typeof result.data !== "string" ||
          !("mimeType" in result) ||
          typeof result.mimeType !== "string"
        ) {
          throw new Error("Rasm xizmati yaroqsiz javob qaytardi.");
        }

        const generatedImage = await compressImageData(result.data, result.mimeType);
        if (streamRunRef.current !== runId) return;
        setMessageImage(messageId, generatedImage);
        appendToMessage(
          messageId,
          "Mana siz so'ragan rasm." +
            ("text" in result && typeof result.text === "string" && result.text.trim()
              ? `\n\n${result.text.trim()}`
              : ""),
        );
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Gemini rasm javobini qabul qilib bo'lmadi.", error);
        if (streamRunRef.current === runId) {
          appendToMessage(
            messageId,
            "Rasm yaratishda muammo yuz berdi. Internet aloqasi, API kaliti va rasm modeli sozlamasini tekshirib, qayta urinib ko'ring.",
          );
        }
      } finally {
        if (streamRunRef.current === runId) {
          abortControllerRef.current = null;
          setIsStreaming(false);
        }
      }
    },
    [addMessage, appendToMessage, setMessageImage],
  );

  const sendMessage = useCallback(
    (content: string, image?: ImageAttachment, generateImage = false) => {
      if (!activeConversation || isStreaming) return;
      addMessage("user", content, image);
      if (generateImage) void generateImageResponse(content, image);
      else void generateResponse(content, image);
    },
    [activeConversation, addMessage, generateImageResponse, generateResponse, isStreaming],
  );

  const stopStreaming = useCallback(() => {
    streamRunRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

  const startNewChat = useCallback(() => {
    stopStreaming();
    newChat();
  }, [newChat, stopStreaming]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [activeConversation?.messages, isStreaming]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        startNewChat();
      } else if ((event.metaKey || event.ctrlKey) && event.key === ",") {
        event.preventDefault();
        setSettingsOpen(true);
      } else if (event.key === "Escape") {
        setShowMenu(false);
        if (!isTyping) setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [startNewChat]);

  const currentTitle = activeConversation?.title ?? "Yangi suhbat";
  const firstName = profile.name.trim().split(/\s+/)[0] || profile.name;
  const messageCount = useMemo(
    () => activeConversation?.messages.length ?? 0,
    [activeConversation?.messages.length],
  );

  if (!isHydrated || !activeConversation) {
    return <main className="flex min-h-screen items-center justify-center bg-[#09090b]"><div className="loading-mark"><Sparkles size={21} /></div></main>;
  }

  return (
    <main
      className="app-shell flex h-[100dvh] overflow-hidden bg-[#09090b] text-zinc-100"
      data-reduced-motion={preferences.reduceMotion}
      data-theme={preferences.theme}
    >
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversation.id}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
        onNewChat={startNewChat}
        onSelectChat={(id) => {
          stopStreaming();
          selectChat(id);
        }}
        onDeleteChat={(id) => {
          if (id === activeConversation.id) stopStreaming();
          deleteChat(id);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        profileName={profile.name}
        onSignOut={onSignOut}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <section className="relative flex min-w-0 flex-1 flex-col">
        <header className="topbar relative z-20 flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.045] px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button aria-label="Yon panelni ochish" className="icon-button md:hidden" onClick={() => setMobileSidebarOpen(true)}><Menu size={19} /></button>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-zinc-200">{currentTitle}</p>
              <p className="mt-0.5 hidden text-[10px] text-zinc-600 sm:block">Katta g&apos;oyalar uchun ijodiy makon</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-300/[0.09] bg-emerald-300/[0.04] px-2.5 py-1 text-[9px] tracking-wide text-emerald-200/70 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/80" /> SHAXSIY MAKON
            </span>
            <div className="relative">
              <button aria-label="Suhbat amallari" className="icon-button" onClick={() => setShowMenu((value) => !value)}><MoreHorizontal size={19} /></button>
              {showMenu && (
                <>
                  <button aria-label="Menyuni yopish" className="fixed inset-0 z-10 cursor-default" onClick={() => setShowMenu(false)} />
                  <div className="action-menu absolute right-0 top-11 z-20 w-48 rounded-xl p-1.5">
                    <button
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-zinc-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={!messageCount}
                      onClick={() => {
                        exportConversation(activeConversation);
                        setShowMenu(false);
                      }}
                    >
                      <Download size={14} /> Markdown fayl qilib yuklab olish
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="chat-scroll relative min-h-0 flex-1 overflow-y-auto" ref={scrollRef}>
          {isEmpty ? (
            <div className="empty-state flex min-h-full flex-col items-center justify-center px-5 pb-8 pt-10">
              <div className="hero-orb welcome-orb mb-7 flex h-[66px] w-[66px] items-center justify-center rounded-[22px]">
                <WandSparkles size={27} strokeWidth={1.6} className="text-violet-200" />
              </div>
              <p className="welcome-label mb-3 text-[10px] font-medium uppercase tracking-[0.24em] text-violet-200/70">Yangi boshlanish</p>
              <h1 className="welcome-title text-center text-[31px] font-medium tracking-[-0.045em] text-zinc-100 sm:text-[39px]">
                Salom, <span className="dream-gradient">{firstName}</span>
              </h1>
              <p className="welcome-subtitle mt-3 max-w-[390px] text-center text-[13px] leading-6 text-zinc-500">
                Bugun nimani birga o&apos;rganamiz?
              </p>
              <Suggestions onSelect={sendMessage} />
            </div>
          ) : (
            <div className={`mx-auto w-full max-w-[820px] px-5 pb-8 pt-8 sm:px-8 ${preferences.compactMode ? "space-y-0" : ""}`}>
              {activeConversation.messages.map((message) =>
                isStreaming && message.role === "assistant" && !message.content ? null : (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    compactMode={preferences.compactMode}
                    textSize={preferences.messageTextSize}
                  />
                ),
              )}
              {isStreaming &&
                (activeConversation.messages.at(-1)?.role === "user" ||
                  (activeConversation.messages.at(-1)?.role === "assistant" &&
                    !activeConversation.messages.at(-1)?.content)) && (
                <div className="mb-8 flex gap-4">
                  <div className="assistant-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] text-violet-200"><Sparkles size={16} /></div>
                  <div className="pt-1.5">
                    <p className="mb-3 text-[12px] font-semibold text-zinc-200">YOUR DREAM</p>
                    <div className="flex items-center gap-1.5"><span className="typing-dot" /><span className="typing-dot animation-delay-150" /><span className="typing-dot animation-delay-300" /><span className="ml-2 text-[10px] text-zinc-600">Javob tayyorlanmoqda</span></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="composer-dock relative z-10 shrink-0 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 sm:px-8">
          <div className="mx-auto w-full max-w-[760px]">
            <Composer
              disabled={isStreaming}
              enterToSend={preferences.enterToSend}
              onSend={sendMessage}
              onStop={stopStreaming}
            />
            <p className="mt-2.5 text-center text-[9px] tracking-wide text-zinc-600">
              YOUR DREAM xato qilishi mumkin. Muhim ma&apos;lumotlarni tekshirib ko&apos;ring.
            </p>
          </div>
        </footer>
      </section>

      <SettingsModal
        isOpen={settingsOpen}
        preferences={preferences}
        conversation={activeConversation}
        onClose={() => setSettingsOpen(false)}
        onUpdatePreferences={updatePreferences}
        onClearChats={() => {
          stopStreaming();
          clearAllChats();
        }}
        onExportConversation={() => exportConversation(activeConversation)}
      />
    </main>
  );
}
