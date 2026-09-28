export interface CitationItem {
  title: string;
  url: string;
  domain?: string;
  snippet?: string;
}

export interface StreamChunk {
  text?: string;
  toolStatus?: string;
  citations?: CitationItem[];
  fallbackNotice?: {
    fromModel: string;
    toModel: string;
    reason?: string;
  };
  error?: string;
}

export interface ChatAttachmentInput {
  name: string;
  type: string;
  dataUrl?: string;
  content?: string;
  fileCategory?: string;
}

export interface ProviderMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: ChatAttachmentInput[];
}

export type ReasoningLevel = 'auto' | 'low' | 'medium' | 'high' | 'extra_high' | 'max';

export interface GenerationOptions {
  modelId: string;
  messages: ProviderMessage[];
  prompt?: string;
  attachments?: ChatAttachmentInput[];
  systemInstruction?: string;
  webSearch?: boolean;
  reasoning?: boolean;
  reasoningLevel?: ReasoningLevel;
  research?: boolean;
  searchContext?: string;
  capability?: string;
  signal?: AbortSignal;
}

export interface AIProvider {
  readonly name: string;
  isAvailable(): boolean;
  generateStream(
    options: GenerationOptions,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void>;
}
