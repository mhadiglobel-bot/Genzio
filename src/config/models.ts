export interface ModelConfig {
  id: string;
  modelId: string;
  displayName: string;
  badge: 'Advanced' | 'Balanced' | 'Fast' | 'Lite';
  role: string;
  description: string;
  provider: 'google' | 'openrouter' | 'openai';
  stable: boolean;
  supportsStreaming: boolean;
  supportsThinking: boolean;
  thinkingLevels: string[];
  supportsVision: boolean;
  supportsPDF: boolean;
  supportsTools: boolean;
  supportsSearchGrounding: boolean;
  isFreeTier: boolean;
  priority: number;
  features: string[];
  colorAccent: {
    badgeClass: string;
    iconBgClass: string;
    textClass: string;
  };
}

export const GENZIO_MODELS: ModelConfig[] = [
  {
    id: 'space-bunny-alpha',
    modelId: 'stealth/space-bunny-alpha',
    displayName: 'Space Bunny Alpha',
    badge: 'Advanced',
    role: 'OpenRouter Stealth Model',
    description: 'High-performance stealth conversational intelligence powered by OpenRouter.',
    provider: 'openrouter',
    stable: true,
    supportsStreaming: true,
    supportsThinking: true,
    thinkingLevels: ['low', 'medium', 'high', 'extra_high', 'max'],
    supportsVision: true,
    supportsPDF: true,
    supportsTools: true,
    supportsSearchGrounding: true,
    isFreeTier: true,
    priority: 1,
    features: ['OpenRouter Space Bunny Alpha', 'Stealth Intelligence', 'Real-time Streaming'],
    colorAccent: {
      badgeClass: 'bg-pink-500/15 border-pink-400/30 text-pink-300',
      iconBgClass: 'text-pink-400 bg-pink-500/10 border-pink-400/30',
      textClass: 'text-pink-400',
    },
  },
  {
    id: 'genzio-advanced',
    modelId: 'gemini-3.8-flash',
    displayName: 'Genzio Advanced',
    badge: 'Advanced',
    role: 'Primary / Best General Model',
    description: 'High-intelligence flagship model for deep reasoning, complex multi-turn chats, coding, and creative prompts.',
    provider: 'google',
    stable: true,
    supportsStreaming: true,
    supportsThinking: true,
    thinkingLevels: ['low', 'medium', 'high', 'extra_high', 'max'],
    supportsVision: true,
    supportsPDF: true,
    supportsTools: true,
    supportsSearchGrounding: true,
    isFreeTier: true,
    priority: 2,
    features: ['Complex Reasoning & Code', 'Deep Synthesis & Multimodal', 'Rich Creative Prompts'],
    colorAccent: {
      badgeClass: 'bg-blue-500/15 border-blue-400/30 text-blue-300',
      iconBgClass: 'text-blue-400 bg-blue-500/10 border-blue-400/30',
      textClass: 'text-blue-400',
    },
  },
  {
    id: 'genzio-balanced',
    modelId: 'gemini-3.7-flash',
    displayName: 'Genzio Balanced',
    badge: 'Balanced',
    role: 'Balanced Performance Model',
    description: 'Balanced speed and intelligence for versatile conversation, analysis, and research workflows.',
    provider: 'google',
    stable: true,
    supportsStreaming: true,
    supportsThinking: true,
    thinkingLevels: ['low', 'medium', 'high'],
    supportsVision: true,
    supportsPDF: true,
    supportsTools: true,
    supportsSearchGrounding: true,
    isFreeTier: true,
    priority: 2,
    features: ['Balanced Speed & Depth', 'Everyday Versatility', 'Multimodal Vision'],
    colorAccent: {
      badgeClass: 'bg-purple-500/15 border-purple-400/30 text-purple-300',
      iconBgClass: 'text-purple-400 bg-purple-500/10 border-purple-400/30',
      textClass: 'text-purple-400',
    },
  },
  {
    id: 'genzio-fast',
    modelId: 'gemini-3.6-flash',
    displayName: 'Genzio Fast',
    badge: 'Fast',
    role: 'Fast Response Model',
    description: 'Ultra-responsive low-latency model tuned for quick conversations, everyday Q&A, and rapid responses.',
    provider: 'google',
    stable: true,
    supportsStreaming: true,
    supportsThinking: false,
    thinkingLevels: [],
    supportsVision: true,
    supportsPDF: true,
    supportsTools: true,
    supportsSearchGrounding: true,
    isFreeTier: true,
    priority: 3,
    features: ['Low Latency Speed', 'Instant Q&A', 'Lightweight Vision'],
    colorAccent: {
      badgeClass: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
      iconBgClass: 'text-amber-400 bg-amber-500/10 border-amber-400/30',
      textClass: 'text-amber-400',
    },
  },
  {
    id: 'genzio-lite',
    modelId: 'gemini-3.5-flash-lite',
    displayName: 'Genzio Lite',
    badge: 'Lite',
    role: 'Light / Efficient Model',
    description: 'Resource-efficient model for high-frequency requests, quick summaries, and lightweight computing.',
    provider: 'google',
    stable: true,
    supportsStreaming: true,
    supportsThinking: false,
    thinkingLevels: [],
    supportsVision: true,
    supportsPDF: true,
    supportsTools: true,
    supportsSearchGrounding: true,
    isFreeTier: true,
    priority: 4,
    features: ['High Frequency', 'Lightweight Tasks', 'Rapid Compute'],
    colorAccent: {
      badgeClass: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
      iconBgClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-400/30',
      textClass: 'text-emerald-400',
    },
  },
];

export const DEFAULT_MODEL_ID = 'gemini-3.8-flash';
export const DEFAULT_MODEL_NAME = 'Genzio Advanced';

/**
 * Resolves any model identifier (e.g. 'Genzio Advanced', 'gemini-3.8-flash', 'fast', 'lite')
 * to its corresponding ModelConfig.
 */
export function getModelConfig(identifier?: string): ModelConfig {
  if (!identifier) {
    return GENZIO_MODELS[0];
  }

  const normalized = identifier.trim().toLowerCase();

  const matched = GENZIO_MODELS.find(
    (m) =>
      m.id.toLowerCase() === normalized ||
      m.modelId.toLowerCase() === normalized ||
      m.displayName.toLowerCase() === normalized ||
      m.badge.toLowerCase() === normalized
  );

  if (matched) return matched;

  // Handle aliases & keywords
  if (normalized.includes('bunny') || normalized.includes('stealth') || normalized.includes('space')) {
    return GENZIO_MODELS[0]; // Space Bunny Alpha
  }
  if (normalized.includes('advanced') || normalized.includes('3.8')) {
    return GENZIO_MODELS[1]; // Genzio Advanced
  }
  if (normalized.includes('balanced') || normalized.includes('3.7')) {
    return GENZIO_MODELS[2]; // Genzio Balanced
  }
  if (normalized.includes('fast') || normalized.includes('3.6')) {
    return GENZIO_MODELS[3]; // Genzio Fast
  }
  if (normalized.includes('lite') || normalized.includes('3.5') || normalized.includes('3.1')) {
    return GENZIO_MODELS[4]; // Genzio Lite
  }

  // Default to Space Bunny Alpha or Advanced
  return GENZIO_MODELS[0];
}

/**
 * Resolves the raw Gemini model ID and provider thinking configuration.
 */
export function resolveModelAndThinkingLevel(
  modelIdentifier?: string,
  uiReasoningLevel?: string
): {
  modelId: string;
  providerThinkingLevel?: 'LOW' | 'HIGH';
  modelConfig: ModelConfig;
} {
  const modelConfig = getModelConfig(modelIdentifier);

  let providerThinkingLevel: 'LOW' | 'HIGH' | undefined = undefined;

  if (modelConfig.supportsThinking && uiReasoningLevel) {
    const level = uiReasoningLevel.toLowerCase();
    if (level === 'low') {
      providerThinkingLevel = 'LOW';
    } else if (level === 'medium' || level === 'high' || level === 'extra_high' || level === 'max') {
      providerThinkingLevel = 'HIGH';
    }
  }

  return {
    modelId: modelConfig.modelId,
    providerThinkingLevel,
    modelConfig,
  };
}

/**
 * Returns fallback model sequence for automatic resilience.
 */
export function getFallbackSequence(currentModelId: string): ModelConfig[] {
  const current = getModelConfig(currentModelId);
  return GENZIO_MODELS.filter((m) => m.id !== current.id && m.modelId !== current.modelId);
}

/**
 * Returns only compatible fallback models that support the required capability.
 * Strictly prevents routing vision/document requests to incompatible models,
 * and ensures image generation never falls back to text models.
 */
export function getCompatibleFallbackSequence(
  capability: string,
  currentModelId: string
): ModelConfig[] {
  const current = getModelConfig(currentModelId);

  // STRICT RULE: Image generation/editing must NEVER fallback to text models
  if (capability === 'IMAGE_GENERATION' || capability === 'IMAGE_EDIT') {
    return [];
  }

  return GENZIO_MODELS.filter((m) => {
    if (m.id === current.id || m.modelId === current.modelId) return false;

    if (capability === 'IMAGE_ANALYSIS' && !m.supportsVision) {
      return false;
    }
    if (capability === 'DOCUMENT_ANALYSIS' && !m.supportsPDF) {
      return false;
    }
    return true;
  });
}
