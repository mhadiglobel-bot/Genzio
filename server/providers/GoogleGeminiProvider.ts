import { GoogleGenAI } from '@google/genai';
import { AIProvider, GenerationOptions, StreamChunk, CitationItem } from './types';

export class GoogleGeminiProvider implements AIProvider {
  public readonly name = 'Google Gemini';
  private geminiClient: GoogleGenAI | null = null;

  public isAvailable(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return !!(key && key !== 'MY_GEMINI_API_KEY');
  }

  private getClient(): GoogleGenAI {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    if (!this.geminiClient) {
      this.geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this.geminiClient;
  }

  public async generateStream(
    options: GenerationOptions,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const ai = this.getClient();
    const contents = this.buildContents(options);

    const config: any = {};

    if (options.systemInstruction?.trim()) {
      config.systemInstruction = options.systemInstruction.trim();
    }

    // Enable Google Search Grounding if webSearch requested
    if (options.webSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    // Map reasoning effort level to Gemini provider thinkingConfig
    const reasoningLevel = options.reasoningLevel || (options.reasoning ? 'high' : undefined);
    if (reasoningLevel) {
      if (reasoningLevel === 'low') {
        config.thinkingConfig = { thinkingLevel: 'LOW' };
      } else if (reasoningLevel === 'medium') {
        config.thinkingConfig = { thinkingLevel: 'MEDIUM' };
      } else if (reasoningLevel === 'high') {
        config.thinkingConfig = { thinkingLevel: 'HIGH' };
      } else if (reasoningLevel === 'extra_high' || reasoningLevel === 'max') {
        config.thinkingConfig = { thinkingLevel: 'HIGH' };
      }
    }

    const streamResponse = await ai.models.generateContentStream({
      model: options.modelId,
      contents,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    const reportedCitations = new Set<string>();

    for await (const chunk of streamResponse) {
      if (options.signal?.aborted) {
        break;
      }

      // Check for Google Search Grounding Metadata
      const candidate = chunk.candidates?.[0];
      if (candidate?.groundingMetadata) {
        const metadata = candidate.groundingMetadata as any;
        const extractedCitations: CitationItem[] = [];

        // Parse search grounding chunks
        if (Array.isArray(metadata.groundingChunks)) {
          for (const gc of metadata.groundingChunks) {
            if (gc.web?.uri) {
              const url = gc.web.uri;
              if (!reportedCitations.has(url)) {
                reportedCitations.add(url);
                let domain = '';
                try {
                  domain = new URL(url).hostname.replace('www.', '');
                } catch {
                  domain = 'web';
                }
                extractedCitations.push({
                  title: gc.web.title || domain || 'Source',
                  url,
                  domain,
                  snippet: gc.web.snippet || '',
                });
              }
            }
          }
        }

        if (extractedCitations.length > 0) {
          onChunk({ citations: extractedCitations });
        }
      }

      const text = chunk.text;
      if (text) {
        onChunk({ text });
      }
    }
  }

  private buildContents(options: GenerationOptions): Array<{ role: string; parts: Array<any> }> {
    const rawContents: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];

    // Map conversation history
    if (Array.isArray(options.messages) && options.messages.length > 0) {
      for (let i = 0; i < options.messages.length; i++) {
        const msg = options.messages[i];
        const isLastUserMessage = i === options.messages.length - 1 && msg.role === 'user';
        let textContent = typeof msg.content === 'string' ? msg.content.trim() : '';

        // Inject search context into last user message if provided by ToolOrchestrator
        if (isLastUserMessage && options.searchContext) {
          textContent = `${textContent}\n\n[Grounded Live Web Search Results]:\n${options.searchContext}`;
        }

        if (!textContent && (!msg.attachments || msg.attachments.length === 0)) {
          continue;
        }

        const role = msg.role === 'assistant' ? 'model' : 'user';
        const parts: any[] = [];

        if (textContent) {
          parts.push({ text: textContent });
        }

        if (msg.attachments && msg.attachments.length > 0) {
          for (const att of msg.attachments) {
            if (att.dataUrl && att.dataUrl.startsWith('data:')) {
              const match = att.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
              if (match) {
                const mimeType = match[1];
                const base64Data = match[2];
                if (
                  mimeType.startsWith('image/') ||
                  mimeType === 'application/pdf' ||
                  mimeType.startsWith('audio/')
                ) {
                  parts.push({
                    inlineData: {
                      mimeType,
                      data: base64Data,
                    },
                  });
                  continue;
                }
              }
            }
            if (att.content) {
              parts.push({
                text: `\n\n[Attached File: ${att.name} (${att.type || 'text'})]:\n${att.content}\n`,
              });
            }
          }
        }

        if (parts.length > 0) {
          rawContents.push({ role, parts });
        }
      }
    }

    // Fallback if rawContents empty
    if (rawContents.length === 0 && options.prompt?.trim()) {
      let promptText = options.prompt.trim();
      if (options.searchContext) {
        promptText = `${promptText}\n\n[Grounded Live Web Search Results]:\n${options.searchContext}`;
      }
      rawContents.push({
        role: 'user',
        parts: [{ text: promptText }],
      });
    }

    if (rawContents.length === 0) {
      rawContents.push({
        role: 'user',
        parts: [{ text: 'Hello' }],
      });
    }

    // Merge adjacent messages of the same role
    const mergedContents: Array<{ role: string; parts: Array<any> }> = [];
    for (const item of rawContents) {
      if (mergedContents.length > 0 && mergedContents[mergedContents.length - 1].role === item.role) {
        mergedContents[mergedContents.length - 1].parts.push(...item.parts);
      } else {
        mergedContents.push({ role: item.role, parts: [...item.parts] });
      }
    }

    // Ensure conversation starts with 'user' role
    if (mergedContents.length > 0 && mergedContents[0].role === 'model') {
      mergedContents.unshift({
        role: 'user',
        parts: [{ text: 'Hello' }],
      });
    }

    return mergedContents;
  }
}
