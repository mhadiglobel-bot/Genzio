export interface ModelCapabilityConfig {
  modelId: string;
  displayName: string;
  reasoningSupported: boolean;
  reasoningEfforts: Array<'low' | 'medium' | 'high' | 'xhigh'>;
  maxReasoningTokensSupported?: boolean;
}

export const MODEL_CAPABILITY_REGISTRY: Record<string, ModelCapabilityConfig> = {
  'stealth/space-bunny-alpha': {
    modelId: 'stealth/space-bunny-alpha',
    displayName: 'Space Bunny Alpha',
    reasoningSupported: true,
    reasoningEfforts: ['low', 'medium', 'high', 'xhigh'],
    maxReasoningTokensSupported: true,
  },
  'gemini-3.8-flash': {
    modelId: 'gemini-3.8-flash',
    displayName: 'Genzio Advanced',
    reasoningSupported: true,
    reasoningEfforts: ['low', 'medium', 'high'],
  },
  'gemini-3.7-flash': {
    modelId: 'gemini-3.7-flash',
    displayName: 'Genzio Balanced',
    reasoningSupported: true,
    reasoningEfforts: ['low', 'medium', 'high'],
  },
};

export const REASONING_PROFILES = {
  low: { effort: 'low' },
  medium: { effort: 'medium' },
  high: { effort: 'high' },
  extraHigh: { effort: 'xhigh' },
  max: { effort: 'xhigh', useMaximumSupportedReasoningBudget: true },
};

export interface BuildOpenRouterRequestOptions {
  model?: string;
  messages: any[];
  reasoningLevel?: string;
  tools?: any[];
  attachments?: any[];
  webSearch?: boolean;
}

export function buildOpenRouterRequest(options: BuildOpenRouterRequestOptions) {
  const modelId = options.model && options.model.includes('/') ? options.model : 'stealth/space-bunny-alpha';
  const capability = MODEL_CAPABILITY_REGISTRY[modelId] || MODEL_CAPABILITY_REGISTRY['stealth/space-bunny-alpha'];

  const rawLevel = (options.reasoningLevel || 'medium').toLowerCase();
  let resolvedEffort: 'low' | 'medium' | 'high' | 'xhigh' = 'medium';
  let useMaxBudget = false;

  if (rawLevel === 'low') {
    resolvedEffort = 'low';
  } else if (rawLevel === 'medium') {
    resolvedEffort = 'medium';
  } else if (rawLevel === 'high') {
    resolvedEffort = 'high';
  } else if (rawLevel === 'extra_high' || rawLevel === 'extrahigh' || rawLevel === 'xhigh') {
    resolvedEffort = 'xhigh';
  } else if (rawLevel === 'max') {
    resolvedEffort = 'xhigh';
    useMaxBudget = true;
  } else if (rawLevel === 'auto') {
    resolvedEffort = 'medium';
  }

  // Capability validation & safe fallback
  if (capability && capability.reasoningSupported) {
    if (!capability.reasoningEfforts.includes(resolvedEffort)) {
      resolvedEffort = capability.reasoningEfforts.includes('high')
        ? 'high'
        : capability.reasoningEfforts[capability.reasoningEfforts.length - 1] || 'medium';
    }
  }

  // Developer-only logging (Section 19)
  console.log(`[OpenRouter Request Builder] Selected UI level: ${options.reasoningLevel || 'medium'} | Resolved API effort: ${resolvedEffort} | Model: ${modelId}`);

  const payload: any = {
    model: modelId,
    messages: options.messages,
    stream: true,
    reasoning: {
      effort: resolvedEffort,
    },
    provider: {
      data_collection: 'allow',
      zdr: false,
      require_parameters: false,
      allow_fallbacks: true,
    },
  };

  if (options.webSearch) {
    payload.plugins = [{ id: 'web' }];
  }

  return { payload, resolvedEffort, modelId };
}
