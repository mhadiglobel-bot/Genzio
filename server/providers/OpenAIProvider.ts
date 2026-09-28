import { AIProvider, GenerationOptions, StreamChunk } from './types';

/**
 * OpenAI / Compatible Provider abstraction.
 * If OPENAI_API_KEY is configured in process.env, isAvailable() returns true
 * and provides full-speed streaming chat completions.
 */
export class OpenAIProvider implements AIProvider {
  public readonly name = 'OpenAI';

  public isAvailable(): boolean {
    const key = process.env.OPENAI_API_KEY;
    return !!(key && key.trim().length > 0);
  }

  public async generateStream(
    options: GenerationOptions,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const key = process.env.OPENAI_API_KEY;
    if (!key || !key.trim()) {
      throw new Error(
        'OpenAI provider is not configured. Google Gemini is the active primary provider for Genzio.'
      );
    }

    const messages = [];
    if (options.systemInstruction?.trim()) {
      messages.push({ role: 'system', content: options.systemInstruction.trim() });
    }

    if (Array.isArray(options.messages)) {
      for (const m of options.messages) {
        messages.push({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content || '',
        });
      }
    }

    if (messages.length === 0 && options.prompt) {
      messages.push({ role: 'user', content: options.prompt });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key.trim()}`,
      },
      body: JSON.stringify({
        model: options.modelId && !options.modelId.includes('gemini') ? options.modelId : 'gpt-4o-mini',
        messages,
        stream: true,
      }),
      signal: options.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`OpenAI API error: status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      if (options.signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const dataStr = trimmed.slice(6).trim();
        if (dataStr === '[DONE]') return;

        try {
          const parsed = JSON.parse(dataStr);
          const text = parsed.choices?.[0]?.delta?.content;
          if (text) {
            onChunk({ text });
          }
        } catch {
          // ignore malformed SSE
        }
      }
    }
  }
}

