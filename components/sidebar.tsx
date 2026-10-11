"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import type { ChatConversation } from "@/types/chat";
import { BrandMark } from "@/components/brand-mark";

interface SidebarProps {
  conversations: ChatConversation[];
  activeConversationId?: string;
  collapsed: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onOpenSettings: () => void;
  profileName: string;
  onSignOut: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function relativeDate(timestamp: number): string {
  const days = Math.floor((Date.now() - timestamp) / 86_400_000);
  if (days <= 0) return "Bugun";
  if (days === 1) return "Kecha";
  if (days < 7) return "Oxirgi 7 kun";
  return "Avvalgi suhbatlar";
}

export function Sidebar({
  conversations,
  activeConversationId,
  collapsed,
  onToggle,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onOpenSettings,
  profileName,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const filteredConversations = useMemo(
    () =>
      conversations.filter((conversation) =>
        conversation.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [conversations, query],
  );
  const grouped = useMemo(() => {
    const result = new Map<string, ChatConversation[]>();
    filteredConversations.forEach((conversation) => {
      const group = relativeDate(conversation.updatedAt);
      result.set(group, [...(result.get(group) ?? []), conversation]);
    });
    return result;
  }, [filteredConversations]);

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Yon panelni yopish"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] md:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`sidebar-shell fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 md:relative md:z-10 ${
          collapsed ? "md:w-[76px]" : "md:w-[276px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} w-[286px]`}
      >
        <div className={`flex h-[76px] items-center ${collapsed ? "justify-center" : "justify-between px-5"}`}>
          <BrandMark compact={collapsed} />
          {!collapsed && (
            <button
              aria-label="Yon panelni yopish"
              className="icon-button md:hidden"
              onClick={onCloseMobile}
            >
              <X size={17} />
            </button>
          )}
          <button
            aria-label={collapsed ? "Yon panelni ochish" : "Yon panelni yig'ish"}
            className={`icon-button hidden md:flex ${collapsed ? "absolute -right-3 top-[25px] z-20 h-7 w-7 border border-white/[0.08] bg-[#151519] shadow-lg" : ""}`}
            onClick={onToggle}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={17} />}
          </button>
        </div>

        <div className={`px-3 ${collapsed ? "md:px-3" : "px-4"}`}>
          <button
            className={`new-chat-button flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all ${
              collapsed ? "md:justify-center md:px-0" : ""
            }`}
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            title={collapsed ? "Yangi suhbat" : undefined}
          >
            <Plus size={17} strokeWidth={2.2} />
            <span className={collapsed ? "md:hidden" : ""}>Yangi suhbat</span>
            {!collapsed && <span className="shortcut-hint ml-auto text-xs text-violet-200/60">⌘ K</span>}
          </button>
        </div>

        <div className={`mt-6 ${collapsed ? "px-3" : "px-4"}`}>
          <div className={`mb-2 flex items-center ${collapsed ? "md:justify-center" : ""}`}>
            <span className={`section-label ${collapsed ? "md:hidden" : ""}`}>Suhbatlar</span>
          </div>
          {!collapsed && (
            <label className="search-box mb-3 flex h-9 items-center gap-2 rounded-lg px-3">
              <Search size={14} className="shrink-0 text-zinc-500" />
              <input
                className="w-full bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600"
                placeholder="Suhbatlardan qidirish"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          )}
          {collapsed && <div className="mb-3 flex justify-center text-zinc-600"><Clock3 size={16} /></div>}
        </div>

        <nav className={`sidebar-scroll min-h-0 flex-1 overflow-y-auto ${collapsed ? "px-2" : "px-3"}`}>
          {Array.from(grouped.entries()).map(([group, items]) => (
            <div key={group} className="mb-5">
              <p className={`section-label mb-2 px-2 ${collapsed ? "md:hidden" : ""}`}>{group}</p>
              {items.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`conversation-row group relative mb-1 flex h-10 items-center rounded-lg transition ${
                    activeConversationId === conversation.id
                      ? "conversation-active"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                  } ${collapsed ? "justify-center px-0" : "px-2.5"}`}
                >
                  <button
                    className={`flex min-w-0 flex-1 items-center gap-2.5 text-left ${collapsed ? "md:justify-center" : ""}`}
                    onClick={() => {
                      onSelectChat(conversation.id);
                      onCloseMobile();
                    }}
                    title={collapsed ? conversation.title : undefined}
                  >
                    <MessageSquare size={15} className="shrink-0 opacity-75" />
                    <span className={`truncate text-[12px] ${collapsed ? "md:hidden" : ""}`}>
                      {conversation.title}
                    </span>
                  </button>
                  {!collapsed && (
                    <div className="relative ml-1 flex items-center opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                      <button
                        aria-label={`${conversation.title} suhbatini o'chirish`}
                        className="icon-button h-7 w-7 hover:text-rose-300"
                        onClick={() => onDeleteChat(conversation.id)}
                        title="Suhbatni o'chirish"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          {filteredConversations.length === 0 && !collapsed && (
            <p className="px-2 py-5 text-xs leading-5 text-zinc-600">Qidiruv bo&apos;yicha suhbat topilmadi.</p>
          )}
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <button
            className={`sidebar-footer-button flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.05] hover:text-white ${
              collapsed ? "md:justify-center md:px-0" : ""
            }`}
            onClick={onOpenSettings}
            title={collapsed ? "Sozlamalar" : undefined}
          >
            <Settings2 size={17} />
            <span className={collapsed ? "md:hidden" : ""}>Sozlamalar</span>
            {!collapsed && <span className="shortcut-hint ml-auto text-[10px] text-zinc-600">⌘ ,</span>}
          </button>
          {!collapsed && (
            <div className="mt-3 flex items-center gap-2.5 rounded-lg px-2 py-2">
              <div className="avatar-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white">
                {profileName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-200">{profileName}</p>
                <p className="text-[10px] text-zinc-600">Mehmon</p>
              </div>
              <button
                aria-label="Hisobdan chiqish"
                className="icon-button ml-auto h-8 w-8 hover:text-rose-400"
                onClick={onSignOut}
                title="Hisobdan chiqish"
                type="button"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
