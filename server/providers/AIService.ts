import { GoogleGeminiProvider } from './GoogleGeminiProvider.ts';
import { OpenAIProvider } from './OpenAIProvider.ts';
import { OpenRouterProvider } from './OpenRouterProvider.ts';
import { AIProvider, GenerationOptions, StreamChunk } from './types.ts';
import { getModelConfig, getCompatibleFallbackSequence, resolveModelAndThinkingLevel, ModelConfig } from '../../src/config/models.ts';
import { toolOrchestrator } from '../services/ToolOrchestrator.ts';

interface ErrorDiagnostic {
  status?: number | string;
  message: string;
  isHighDemand: boolean;
  isPermissionDenied: boolean;
}

function extractErrorInfo(error: any): ErrorDiagnostic {
  if (!error) return { message: '', isHighDemand: false, isPermissionDenied: false };

  let rawMessage = '';
  let status = error.status || error.statusCode || error.response?.status || error.code || error.error?.code;

  if (typeof error === 'string') {
    rawMessage = error;
  } else if (error.message) {
    rawMessage = String(error.message);
  } else if (error.error?.message) {
    rawMessage = String(error.error.message);
  } else {
    rawMessage = String(error);
  }

  // Iteratively unwrap nested JSON in error messages
  for (let i = 0; i < 4; i++) {
    if (typeof rawMessage === 'string' && rawMessage.includes('{') && rawMessage.includes('}')) {
      try {
        const match = rawMessage.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.error?.code) status = parsed.error.code;
          if (parsed.error?.status) status = parsed.error.status;
          if (typeof parsed.error?.message === 'string') {
            rawMessage = parsed.error.message;
          } else if (typeof parsed.message === 'string') {
            rawMessage = parsed.message;
          } else if (typeof parsed.error === 'string') {
            rawMessage = parsed.error;
          } else {
            break;
          }
        } else {
          break;
        }
      } catch {
        break;
      }
    } else {
      break;
    }
  }

  if (typeof rawMessage === 'string' && rawMessage.includes('"message":')) {
    const msgMatch = rawMessage.match(/"message"\s*:\s*"([^"]+)"/);
    if (msgMatch && msgMatch[1]) {
      rawMessage = msgMatch[1];
    }
  }

  const lowerMsg = String(rawMessage).toLowerCase();
  const isPermissionDenied =
    status === 403 ||
    status === 'PERMISSION_DENIED' ||
    lowerMsg.includes('permission_denied') ||
    lowerMsg.includes('denied access') ||
    lowerMsg.includes('forbidden') ||
    lowerMsg.includes('project has been denied');

  const isHighDemand =
    status === 429 ||
    status === 503 ||
    status === 'RESOURCE_EXHAUSTED' ||
    status === 'UNAVAILABLE' ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('resource_exhausted') ||
    lowerMsg.includes('exceeded your current quota') ||
    lowerMsg.includes('high demand') ||
    lowerMsg.includes('unavailable') ||
    lowerMsg.includes('spikes in demand') ||
    lowerMsg.includes('overloaded');

  return { status, message: String(rawMessage), isHighDemand, isPermissionDenied };
}

export class AIService {
  private geminiProvider: GoogleGeminiProvider;
  private openAIProvider: OpenAIProvider;
  private openRouterProvider: OpenRouterProvider;

  constructor() {
    this.geminiProvider = new GoogleGeminiProvider();
    this.openAIProvider = new OpenAIProvider();
    this.openRouterProvider = new OpenRouterProvider();
  }

  public getProvider(providerName: 'google' | 'openai' | 'openrouter'): AIProvider {
    if (providerName === 'openrouter') {
      return this.openRouterProvider;
    }
    if (providerName === 'openai' && this.openAIProvider.isAvailable()) {
      return this.openAIProvider;
    }
    return this.geminiProvider;
  }

  /**
   * Streams chat response with real-time token delivery, tool orchestration,
   * centralized model routing, and resilient fallback execution.
   */
  public async streamChat(
    options: GenerationOptions,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    // 1. Tool Orchestration Phase
    const { modifiedOptions, mathResult } = await toolOrchestrator.orchestrate(options, onChunk);

    let activeOptions = modifiedOptions;

    if (mathResult && !options.webSearch && !options.research) {
      activeOptions = {
        ...activeOptions,
        prompt: `${activeOptions.prompt || ''}\n\n[Exact Calculator Tool Result]: ${mathResult}`,
      };
    }

    // 2. Resolve Model and Thinking Configuration
    const { modelId, modelConfig } = resolveModelAndThinkingLevel(
      activeOptions.modelId,
      activeOptions.reasoningLevel
    );

    const capability = activeOptions.capability || 'CHAT';

    // If OpenRouter Space Bunny Alpha is requested, call OpenRouter directly with resilient compatible fallback
    if (modelConfig.provider === 'openrouter' || modelConfig.id === 'space-bunny-alpha' || activeOptions.modelId === 'stealth/space-bunny-alpha') {
      try {
        console.log(`[AIService] Routing to OpenRouter primary model: stealth/space-bunny-alpha [capability: ${capability}]`);
        await this.openRouterProvider.generateStream(
          {
            ...activeOptions,
            modelId: 'stealth/space-bunny-alpha',
          },
          onChunk
        );
        onChunk({ toolStatus: '' });
        return;
      } catch (openRouterErr: any) {
        console.warn('[AIService] OpenRouter call error, evaluating compatible fallbacks:', openRouterErr?.message || openRouterErr);
        const compatibleFallbacks = getCompatibleFallbackSequence(capability, modelConfig.modelId);
        if (compatibleFallbacks.length === 0) {
          const diag = extractErrorInfo(openRouterErr);
          onChunk({
            error: diag.message || 'Primary model error and no compatible fallback model supports this capability.',
          });
          return;
        }

        let hasStreamedAny = false;
        let lastFallbackErr: any = null;

        for (const fallbackModel of compatibleFallbacks) {
          if (options.signal?.aborted) return;
          const provider = this.getProvider(fallbackModel.provider);

          onChunk({
            fallbackNotice: {
              fromModel: modelConfig.displayName,
              toModel: fallbackModel.displayName,
              reason: `Switched to ${fallbackModel.displayName}`,
            },
          });

          try {
            await provider.generateStream(
              {
                ...activeOptions,
                modelId: fallbackModel.modelId,
              },
              (chunk) => {
                if (chunk.text) hasStreamedAny = true;
                onChunk(chunk);
              }
            );
            onChunk({ toolStatus: '' });
            return;
          } catch (fbErr: any) {
            lastFallbackErr = fbErr;
            if (hasStreamedAny) return;
          }
        }

        const errDiag = extractErrorInfo(lastFallbackErr || openRouterErr);
        onChunk({
          error: errDiag.message || 'The AI service is temporarily unavailable. Please try again.',
        });
        return;
      }
    }

    // Google / other primary models
    let primarySuccess = false;
    let primaryError: any = null;
    let hasStreamedAnyContent = false;

    try {
      const primaryProvider = this.getProvider(modelConfig.provider);
      await primaryProvider.generateStream(
        {
          ...activeOptions,
          modelId: modelConfig.modelId,
        },
        (chunk) => {
          if (chunk.text) hasStreamedAnyContent = true;
          onChunk(chunk);
        }
      );
      primarySuccess = true;
      onChunk({ toolStatus: '' });
      return;
    } catch (primErr: any) {
      primaryError = primErr;
      if (hasStreamedAnyContent) return;
      console.warn(`[AIService] Primary model ${modelConfig.modelId} failed:`, primErr?.message || primErr);
    }

    // Attempt compatible fallbacks only
    const fallbackCandidates = getCompatibleFallbackSequence(capability, modelConfig.modelId);
    let lastError = primaryError;

    for (const currentModel of fallbackCandidates) {
      if (options.signal?.aborted) return;
      const provider = this.getProvider(currentModel.provider);

      // Notify client only when actually switching to backup model
      onChunk({
        fallbackNotice: {
          fromModel: modelConfig.displayName,
          toModel: currentModel.displayName,
          reason: `Switched to ${currentModel.displayName}`,
        },
      });

      try {
        await provider.generateStream(
          {
            ...activeOptions,
            modelId: currentModel.modelId,
          },
          (chunk) => {
            if (chunk.text) hasStreamedAnyContent = true;
            onChunk(chunk);
          }
        );
        onChunk({ toolStatus: '' });
        return;
      } catch (err: any) {
        lastError = err;
        if (hasStreamedAnyContent) return;
      }
    }

    // If all real compatible models failed, emit genuine provider error (STRICT RULE: Never fabricate AI answer)
    const errorDiag = extractErrorInfo(lastError);
    const userMessage = errorDiag.message || 'The AI service is temporarily unavailable. Please try again.';
    console.error('[AIService] All real candidate models failed:', userMessage);
    onChunk({
      error: userMessage,
    });
  }
}

export const aiService = new AIService();
