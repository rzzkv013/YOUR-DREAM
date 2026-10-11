export type MessageRole = "user" | "assistant";

export interface ImageAttachment {
  name: string;
  mimeType: string;
  data: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  attachmentName?: string;
  imageData?: string;
  imageMimeType?: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export type MessageTextSize = "small" | "medium" | "large";
export type AppTheme = "dark" | "light";

export interface UserPreferences {
  compactMode: boolean;
  enterToSend: boolean;
  theme: AppTheme;
  messageTextSize: MessageTextSize;
  reduceMotion: boolean;
}

export interface ChatState {
  conversations: ChatConversation[];
  activeConversationId: string;
  preferences: UserPreferences;
}
