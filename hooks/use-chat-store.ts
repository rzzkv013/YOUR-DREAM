"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type {
  ChatConversation,
  ChatMessage,
  ChatState,
  ImageAttachment,
  UserPreferences,
} from "@/types/chat";

const STORAGE_KEY = "your-dream-chat-state-v1";
const STORAGE_KEY_PREFIX = `${STORAGE_KEY}:`;
const STORAGE_DEBOUNCE_MS = 250;
const DEFAULT_PREFERENCES: UserPreferences = {
  compactMode: false,
  enterToSend: true,
  theme: "dark",
  messageTextSize: "medium",
  reduceMotion: false,
};

function makeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createConversation(): ChatConversation {
  const now = Date.now();
  return {
    id: makeId(),
    title: "Yangi suhbat",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function createInitialState(): ChatState {
  const conversation = createConversation();
  return {
    conversations: [conversation],
    activeConversationId: conversation.id,
    preferences: DEFAULT_PREFERENCES,
  };
}

function loadState(storageKey = STORAGE_KEY, migrateLegacy = false): ChatState {
  const initialConversation = createConversation();

  try {
    const stored =
      window.localStorage.getItem(storageKey) ??
      (migrateLegacy ? window.localStorage.getItem(STORAGE_KEY) : null);
    if (!stored) {
      return {
        conversations: [initialConversation],
        activeConversationId: initialConversation.id,
        preferences: DEFAULT_PREFERENCES,
      };
    }

    const parsed: unknown = JSON.parse(stored);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("conversations" in parsed) ||
      !Array.isArray(parsed.conversations)
    ) {
      throw new Error("Saqlangan suhbat ma'lumotlari formati noto'g'ri.");
    }

    const saved = parsed as Partial<ChatState>;
    const conversations = (saved.conversations as ChatConversation[]).map(
      (conversation) =>
        conversation.title === "New conversation"
          ? { ...conversation, title: "Yangi suhbat" }
          : conversation,
    );
    if (
      !conversations.every(
        (conversation) =>
          typeof conversation.id === "string" &&
          typeof conversation.title === "string" &&
          Array.isArray(conversation.messages),
      )
    ) {
      throw new Error("Saqlangan suhbat ma'lumotlari to'liq emas.");
    }

    const activeConversationId =
      conversations.find((item) => item.id === saved.activeConversationId)?.id ??
      conversations[0]?.id ??
      initialConversation.id;
    const validPreferences =
      typeof saved.preferences === "object" && saved.preferences !== null
        ? {
            compactMode:
              "compactMode" in saved.preferences &&
              typeof saved.preferences.compactMode === "boolean"
                ? saved.preferences.compactMode
                : DEFAULT_PREFERENCES.compactMode,
            enterToSend:
              "enterToSend" in saved.preferences &&
              typeof saved.preferences.enterToSend === "boolean"
                ? saved.preferences.enterToSend
                : DEFAULT_PREFERENCES.enterToSend,
            theme:
              "theme" in saved.preferences &&
              (saved.preferences.theme === "dark" ||
                saved.preferences.theme === "light")
                ? saved.preferences.theme
                : DEFAULT_PREFERENCES.theme,
            messageTextSize:
              "messageTextSize" in saved.preferences &&
              (saved.preferences.messageTextSize === "small" ||
                saved.preferences.messageTextSize === "medium" ||
                saved.preferences.messageTextSize === "large")
                ? saved.preferences.messageTextSize
                : DEFAULT_PREFERENCES.messageTextSize,
            reduceMotion:
              "reduceMotion" in saved.preferences &&
              typeof saved.preferences.reduceMotion === "boolean"
                ? saved.preferences.reduceMotion
                : DEFAULT_PREFERENCES.reduceMotion,
          }
        : DEFAULT_PREFERENCES;

    return {
      conversations:
        conversations.length > 0 ? conversations : [initialConversation],
      activeConversationId,
      preferences: validPreferences,
    };
  } catch (error) {
    console.error("YOUR DREAM suhbatlarini yuklab bo'lmadi.", error);
    return {
      conversations: [initialConversation],
      activeConversationId: initialConversation.id,
      preferences: DEFAULT_PREFERENCES,
    };
  }
}

function createMessage(
  role: ChatMessage["role"],
  content: string,
  image?: ImageAttachment,
  attachmentName?: string,
): ChatMessage {
  return {
    id: makeId(),
    role,
    content,
    createdAt: Date.now(),
    ...(image
      ? {
          attachmentName: image.name,
          imageData: image.data,
          imageMimeType: image.mimeType,
        }
      : attachmentName
        ? { attachmentName }
        : {}),
  };
}

export function useChatStore(userId: string, migrateLegacy = false) {
  const storageKey = `${STORAGE_KEY_PREFIX}${encodeURIComponent(userId)}`;
  const [state, setState] = useState<ChatState>(() =>
    typeof window === "undefined"
      ? createInitialState()
      : loadState(storageKey, migrateLegacy),
  );
  const subscribe = useCallback(() => () => {}, []);
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!isHydrated) return;
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.error("YOUR DREAM suhbatlarini saqlab bo'lmadi.", error);
      }
    }, STORAGE_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [isHydrated, state, storageKey]);

  const conversations = state.conversations;
  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === state.activeConversationId,
      ) ?? conversations[0],
    [conversations, state.activeConversationId],
  );

  const newChat = useCallback(() => {
    const conversation = createConversation();
    setState((current) => {
      return {
        ...current,
        conversations: [conversation, ...current.conversations],
        activeConversationId: conversation.id,
      };
    });
    return conversation.id;
  }, []);

  const selectChat = useCallback((id: string) => {
    setState((current) => ({ ...current, activeConversationId: id }));
  }, []);

  const deleteChat = useCallback((id: string) => {
    setState((current) => {
      const remaining = current.conversations.filter(
        (conversation) => conversation.id !== id,
      );
      if (remaining.length === 0) {
        const replacement = createConversation();
        return {
          ...current,
          conversations: [replacement],
          activeConversationId: replacement.id,
        };
      }
      return {
        ...current,
        conversations: remaining,
        activeConversationId:
          current.activeConversationId === id
            ? remaining[0].id
            : current.activeConversationId,
      };
    });
  }, []);

  const addMessage = useCallback(
    (
      role: ChatMessage["role"],
      content: string,
      image?: ImageAttachment,
      attachmentName?: string,
    ) => {
      const message = createMessage(role, content, image, attachmentName);
      setState((current) => {
        const conversation = current.conversations.find(
          (item) => item.id === current.activeConversationId,
        );
        if (!conversation) return current;
        const firstUserMessage =
          role === "user" && conversation.messages.length === 0;
        const title = firstUserMessage
          ? content.trim().replace(/\s+/g, " ").slice(0, 36) || "Yangi suhbat"
          : conversation.title;
        return {
          ...current,
          conversations: current.conversations.map((item) =>
            item.id === conversation.id
              ? {
                  ...item,
                  title: firstUserMessage && content.length > 36 ? `${title}…` : title,
                  messages: [...item.messages, message],
                  updatedAt: Date.now(),
                }
              : item,
          ),
        };
      });
      return message.id;
    },
    [],
  );

  const appendToMessage = useCallback((messageId: string, text: string) => {
    setState((current) => {
      return {
        ...current,
        conversations: current.conversations.map((conversation) => ({
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === messageId
              ? { ...message, content: message.content + text }
              : message,
          ),
        })),
      };
    });
  }, []);

  const setMessageImage = useCallback(
    (messageId: string, image: ImageAttachment) => {
      setState((current) => ({
        ...current,
        conversations: current.conversations.map((conversation) => ({
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  imageData: image.data,
                  imageMimeType: image.mimeType,
                }
              : message,
          ),
        })),
      }));
    },
    [],
  );

  const updatePreferences = useCallback((preferences: UserPreferences) => {
    setState((current) => ({ ...current, preferences }));
  }, []);

  const clearAllChats = useCallback(() => {
    const conversation = createConversation();
    setState((current) => ({
      ...current,
      conversations: [conversation],
      activeConversationId: conversation.id,
    }));
  }, []);

  return {
    conversations,
    activeConversation,
    preferences: state.preferences,
    isHydrated,
    newChat,
    selectChat,
    deleteChat,
    addMessage,
    appendToMessage,
    setMessageImage,
    updatePreferences,
    clearAllChats,
  };
}
