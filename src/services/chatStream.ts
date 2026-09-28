import { ChatMessage, ChatAttachment, CustomInstructions, PersonalizationSettings, ReasoningLevel } from '../types';

export interface CitationItem {
  title: string;
  url: string;
  domain?: string;
  snippet?: string;
}

export interface StreamChatOptions {
  messages: ChatMessage[];
  model?: string;
  modelPreset?: string;
  prompt?: string;
  attachments?: ChatAttachment[];
  customInstructions?: CustomInstructions;
  personalization?: PersonalizationSettings;
  webSearch?: boolean;
  reasoning?: boolean;
  reasoningLevel?: ReasoningLevel;
  research?: boolean;
  signal?: AbortSignal;
  onChunk: (accumulatedText: string, chunkDelta?: string) => void;
  onToolStatus?: (status: string) => void;
  onCitations?: (citations: CitationItem[]) => void;
  onFallbackNotice?: (notice: { fromModel: string; toModel: string; reason?: string }) => void;
  onGeneratedImage?: (image: any) => void;
  onPromptData?: (promptData: any) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export async function streamChatResponse({
  messages,
  model,
  modelPreset,
  prompt,
  attachments = [],
  customInstructions,
  personalization,
  webSearch = false,
  reasoning = false,
  reasoningLevel = 'high',
  research = false,
  signal,
  onChunk,
  onToolStatus,
  onCitations,
  onFallbackNotice,
  onGeneratedImage,
  onPromptData,
  onComplete,
  onError,
}: StreamChatOptions): Promise<void> {
  let accumulatedText = '';
  let firstChunkReceived = false;

  const selectedModel = model || modelPreset || 'Genzio Advanced';
  const lastUserMsg = messages[messages.length - 1];
  const promptToSend = prompt || (lastUserMsg ? lastUserMsg.content : '');

  const payload = {
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      attachments: m.attachments,
    })),
    modelPreset: selectedModel,
    model: selectedModel,
    prompt: promptToSend,
    attachments,
    customInstructions,
    personalization,
    webSearch,
    reasoning,
    reasoningLevel,
    research,
    stream: true,
  };

  // Helper for direct JSON fallback
  const fetchDirectChat = async (): Promise<boolean> => {
    try {
      console.log('[GENZIO] Attempting direct /api/chat fallback (non-streaming)...');
      const directRes = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ ...payload, stream: false }),
        signal,
      });

      if (!directRes.ok) {
        let errMessage = `Request failed (status ${directRes.status})`;
        try {
          const errBody = await directRes.json();
          if (errBody.error) errMessage = errBody.error;
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      }

      const directData = await directRes.json();
      const directText = directData.text || 'Hello! How can I assist you today?';
      console.log('[GENZIO] Direct fallback successful, text length:', directText.length);
      if (directData.fallbackNotice && onFallbackNotice) {
        onFallbackNotice(directData.fallbackNotice);
      }
      if (directData.generatedImage && onGeneratedImage) {
        onGeneratedImage(directData.generatedImage);
      }
      if (directData.promptData && onPromptData) {
        onPromptData(directData.promptData);
      }
      onChunk(directText, directText);
      onComplete(directText);
      return true;
    } catch (fallbackErr: any) {
      if (signal?.aborted) return true;
      console.warn('[GENZIO] Direct chat fallback attempt failed:', fallbackErr);
      return false;
    }
  };

  try {
    console.log('[GENZIO] SEND STARTED', { model: selectedModel, messageCount: messages.length });

    let response: Response;
    try {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(payload),
        signal,
      });
    } catch (fetchErr: any) {
      if (signal?.aborted) {
        onComplete(accumulatedText);
        return;
      }
      console.warn('[GENZIO] Stream fetch network exception, switching to direct fallback:', fetchErr);
      const success = await fetchDirectChat();
      if (success) return;
      throw fetchErr;
    }

    if (!response.ok || !response.body) {
      console.warn('[GENZIO] Stream endpoint non-OK status:', response.status);
      let errorDesc = `Request failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.error) errorDesc = errorJson.error;
      } catch {
        // ignore
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication Error (${response.status}): ${errorDesc}`);
      } else if (response.status === 429) {
        throw new Error(`Rate Limit Exceeded (429): ${errorDesc}`);
      } else if (response.status >= 500) {
        throw new Error(`Provider Error (${response.status}): ${errorDesc}`);
      }

      const success = await fetchDirectChat();
      if (success) return;
      throw new Error(errorDesc);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        if (signal?.aborted) {
          try {
            await reader.cancel();
          } catch {
            // ignore
          }
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data: ')) {
            const dataContent = trimmed.slice(6).trim();

            if (dataContent === '[DONE]') {
              console.log('[GENZIO] STREAM COMPLETED', { totalChars: accumulatedText.length });
              onComplete(accumulatedText);
              return;
            }

            try {
              const parsed = JSON.parse(dataContent);
              if (parsed.fallbackNotice && onFallbackNotice) {
                onFallbackNotice(parsed.fallbackNotice);
              }
              if (parsed.toolStatus !== undefined && onToolStatus) {
                onToolStatus(parsed.toolStatus);
              }
              if (parsed.citations && onCitations) {
                onCitations(parsed.citations);
              }
              if (parsed.generatedImage && onGeneratedImage) {
                onGeneratedImage(parsed.generatedImage);
              }
              if (parsed.promptData && onPromptData) {
                onPromptData(parsed.promptData);
              }
              if (parsed.error && !parsed.text) {
                const errMsg = typeof parsed.error === 'string'
                  ? parsed.error
                  : parsed.error.message || 'Unable to connect to AI model.';
                onError(new Error(errMsg));
                return;
              }
              if (parsed.text) {
                if (!firstChunkReceived) {
                  firstChunkReceived = true;
                }
                accumulatedText += parsed.text;
                onChunk(accumulatedText, parsed.text);
              }
            } catch {
              if (dataContent && !dataContent.startsWith('{') && !dataContent.startsWith('[') && !dataContent.includes('"fallbackNotice"') && !dataContent.includes('"error"')) {
                if (!firstChunkReceived) {
                  firstChunkReceived = true;
                }
                accumulatedText += dataContent;
                onChunk(accumulatedText, dataContent);
              }
            }
          }
        }
      }

      if (buffer.trim().startsWith('data: ')) {
        const dataContent = buffer.trim().slice(6).trim();
        if (dataContent && dataContent !== '[DONE]') {
          try {
            const parsed = JSON.parse(dataContent);
            if (parsed.fallbackNotice && onFallbackNotice) {
              onFallbackNotice(parsed.fallbackNotice);
            }
            if (parsed.toolStatus !== undefined && onToolStatus) {
              onToolStatus(parsed.toolStatus);
            }
            if (parsed.citations && onCitations) {
              onCitations(parsed.citations);
            }
            if (parsed.error && !parsed.text) {
              const errMsg = typeof parsed.error === 'string'
                ? parsed.error
                : parsed.error.message || 'Unable to connect to AI model.';
              onError(new Error(errMsg));
              return;
            }
            if (parsed.text) {
              accumulatedText += parsed.text;
              onChunk(accumulatedText, parsed.text);
            }
          } catch {
            if (!dataContent.startsWith('{') && !dataContent.startsWith('[') && !dataContent.includes('"fallbackNotice"') && !dataContent.includes('"error"')) {
              accumulatedText += dataContent;
              onChunk(accumulatedText, dataContent);
            }
          }
        }
      }

      if (accumulatedText.length > 0) {
        onComplete(accumulatedText);
        return;
      }
    } catch (readErr: any) {
      if (signal?.aborted) {
        onComplete(accumulatedText);
        return;
      }
      console.warn('[GENZIO] Error reading stream chunk:', readErr);
      if (!firstChunkReceived) {
        const success = await fetchDirectChat();
        if (success) return;
      }
      throw readErr;
    }

    if (!firstChunkReceived) {
      const success = await fetchDirectChat();
      if (success) return;
    }

    onComplete(accumulatedText);
  } catch (error: any) {
    if (signal?.aborted) {
      console.log('[GENZIO] Request aborted by user');
      onComplete(accumulatedText);
      return;
    }
    console.error('[GENZIO] ERROR:', error);
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
