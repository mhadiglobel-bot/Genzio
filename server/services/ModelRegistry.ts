import { GoogleGenAI } from '@google/genai';
import { GENZIO_MODELS, ModelConfig, getModelConfig, resolveModelAndThinkingLevel } from '../../src/config/models';

export interface ModelTestResult {
  modelId: string;
  displayName: string;
  status: 'available' | 'restricted' | 'quota_exhausted' | 'error';
  latencyMs?: number;
  sampleResponse?: string;
  errorMessage?: string;
}

export class ModelRegistryService {
  private getClient(): GoogleGenAI | null {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') return null;
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  /**
   * Internal diagnostic health test for a given model.
   */
  public async testModel(modelId: string): Promise<ModelTestResult> {
    const client = this.getClient();
    const config = getModelConfig(modelId);

    if (!client) {
      return {
        modelId: config.modelId,
        displayName: config.displayName,
        status: 'error',
        errorMessage: 'GEMINI_API_KEY environment variable is not configured.',
      };
    }

    const start = Date.now();
    try {
      const response = await client.models.generateContent({
        model: config.modelId,
        contents: 'Hi! Reply with "OK" in 1 word.',
      });

      const latencyMs = Date.now() - start;
      const sampleResponse = response.text?.trim() || '';

      return {
        modelId: config.modelId,
        displayName: config.displayName,
        status: 'available',
        latencyMs,
        sampleResponse,
      };
    } catch (error: any) {
      const latencyMs = Date.now() - start;
      const rawMsg = String(error.message || error);
      const isQuota = rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('quota');
      const isDenied = rawMsg.includes('403') || rawMsg.includes('PERMISSION_DENIED') || rawMsg.includes('denied access');

      return {
        modelId: config.modelId,
        displayName: config.displayName,
        status: isQuota ? 'quota_exhausted' : isDenied ? 'restricted' : 'error',
        latencyMs,
        errorMessage: rawMsg.slice(0, 180),
      };
    }
  }

  public getAllModels(): ModelConfig[] {
    return GENZIO_MODELS;
  }

  public resolve(modelIdentifier?: string, reasoningLevel?: string) {
    return resolveModelAndThinkingLevel(modelIdentifier, reasoningLevel);
  }
}

export const modelRegistry = new ModelRegistryService();
