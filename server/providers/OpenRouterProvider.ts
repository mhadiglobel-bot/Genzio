import { AIProvider, GenerationOptions, StreamChunk } from './types';
import { buildOpenRouterRequest } from '../services/ModelCapabilityRegistry';

/**
 * OpenRouter Provider for Space Bunny Alpha (stealth/space-bunny-alpha) and other OpenRouter models.
 * Calls https://openrouter.ai/api/v1/chat/completions securely on the server.
 * Never exposes OPENROUTER_API_KEY to client or network logs.
 */
export class OpenRouterProvider implements AIProvider {
  public readonly name = 'OpenRouter';

  public isAvailable(): boolean {
    const key = process.env.OPENROUTER_API_KEY;
    return !!(key && key.trim().length > 0);
  }

  public async generateStream(
    options: GenerationOptions,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key || !key.trim()) {
      throw new Error(
        'OpenRouter API key is not configured on the server. Please set the OPENROUTER_API_KEY environment variable in your server environment.'
      );
    }

    // Build messages array supporting both plain text and OpenAI multimodal content arrays
    const formattedMessages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string | Array<any>;
    }> = [];

    const baseSystemPrompt = `You are Genzio, a premier AI assistant connected to specialized application tools.

STRICT OPERATIONAL RULES:
1. NEVER repeat, quote, or echo the user's prompt in your response (e.g. NEVER begin with "Here is a direct overview for [user prompt]..." or "Regarding your question about..."). Start your response directly with the requested answer or information.
2. NEVER use generic canned templates, fake placeholders, or boilerplate outlines.
3. NEVER generate SVG, HTML, ASCII art, prompt text, or Canva/Photoshop instructions when asked to generate an image. Image generation is handled by the dedicated image tool.
4. For image analysis, inspect the actual supplied image with multimodal vision.
5. For image editing, use the image-edit capability.
6. Use Markdown and fenced code blocks where appropriate.`;

    formattedMessages.push({
      role: 'system',
      content: options.systemInstruction?.trim()
        ? `${baseSystemPrompt}\n\n${options.systemInstruction.trim()}`
        : baseSystemPrompt,
    });

    if (Array.isArray(options.messages) && options.messages.length > 0) {
      for (const m of options.messages) {
        if (!m) continue;
        const role = m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user';

        // Check for attached images in message attachments
        const imageAttachments = (m.attachments || []).filter(
          (att) => att.dataUrl && (att.dataUrl.startsWith('data:image/') || att.fileCategory === 'image')
        );

        // Check for document text attachments
        const docAttachments = (m.attachments || []).filter(
          (att) => att.content && att.fileCategory !== 'image'
        );

        let textContent = m.content || '';
        if (docAttachments.length > 0) {
          const docTexts = docAttachments.map((d) => d.content).join('\n\n');
          textContent = `${docTexts}\n\nUser Message:\n${textContent}`;
        }

        if (imageAttachments.length > 0 && role === 'user') {
          const contentParts: Array<any> = [];
          if (textContent) {
            contentParts.push({ type: 'text', text: textContent });
          }
          for (const img of imageAttachments) {
            contentParts.push({
              type: 'image_url',
              image_url: { url: img.dataUrl },
            });
          }
          formattedMessages.push({ role, content: contentParts });
        } else {
          formattedMessages.push({ role, content: textContent });
        }
      }
    }

    // Top-level attachments check if prompt wasn't in options.messages
    if (options.attachments && options.attachments.length > 0) {
      const topImages = options.attachments.filter(
        (att) => att.dataUrl && (att.dataUrl.startsWith('data:image/') || att.fileCategory === 'image')
      );
      const topDocs = options.attachments.filter(
        (att) => att.content && att.fileCategory !== 'image'
      );

      // If last message is user message, attach to it
      const lastMsg = formattedMessages[formattedMessages.length - 1];
      if (lastMsg && lastMsg.role === 'user') {
        if (topDocs.length > 0) {
          const docText = topDocs.map((d) => d.content).join('\n\n');
          if (typeof lastMsg.content === 'string') {
            lastMsg.content = `${docText}\n\n${lastMsg.content}`;
          }
        }
        if (topImages.length > 0) {
          let currentParts: Array<any> = [];
          if (typeof lastMsg.content === 'string') {
            currentParts.push({ type: 'text', text: lastMsg.content });
          } else if (Array.isArray(lastMsg.content)) {
            currentParts = lastMsg.content;
          }
          for (const img of topImages) {
            currentParts.push({
              type: 'image_url',
              image_url: { url: img.dataUrl },
            });
          }
          lastMsg.content = currentParts;
        }
      }
    }

    // If no messages at all, build single user message
    if (formattedMessages.length === 0 && options.prompt) {
      formattedMessages.push({
        role: 'user',
        content: options.prompt,
      });
    }

    // Build centralized OpenRouter request using Model Capability Registry
    const { payload: requestBody } = buildOpenRouterRequest({
      model: options.modelId || 'stealth/space-bunny-alpha',
      messages: formattedMessages,
      reasoningLevel: options.reasoningLevel,
      webSearch: options.webSearch,
    });

    const appUrl = process.env.APP_URL || 'https://genzio.ai';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key.trim()}`,
        'HTTP-Referer': appUrl,
        'X-OpenRouter-Title': 'Genzio',
      },
      body: JSON.stringify(requestBody),
      signal: options.signal,
    });

    if (!response.ok) {
      let errorDetail = '';
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.error?.message || JSON.stringify(errorJson);
      } catch {
        try {
          errorDetail = await response.text();
        } catch {
          // ignore
        }
      }

      if (errorDetail.includes('ZDR violation') || errorDetail.includes('data policy') || errorDetail.includes('guardrail')) {
        throw new Error(
          `OpenRouter Data Policy Notice: Your OpenRouter account Zero Data Retention (ZDR) settings currently restrict access to stealth/space-bunny-alpha. Please check your privacy settings at https://openrouter.ai/settings/privacy to allow data collection for non-ZDR endpoints.`
        );
      } else if (response.status === 401 || response.status === 403) {
        throw new Error(
          `OpenRouter Authentication Error (${response.status}): Invalid or unauthorized OPENROUTER_API_KEY. ${errorDetail}`
        );
      } else if (response.status === 429) {
        throw new Error(
          `OpenRouter Rate Limit Exceeded (429): Quota exhausted or rate limited. ${errorDetail}`
        );
      } else if (response.status >= 500) {
        throw new Error(
          `OpenRouter Provider Error (${response.status}): Service temporarily unavailable. ${errorDetail}`
        );
      } else {
        throw new Error(
          `OpenRouter API Error (${response.status}): ${errorDetail || response.statusText}`
        );
      }
    }

    if (!response.body) {
      throw new Error('OpenRouter response did not return a readable stream body.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        if (options.signal?.aborted) {
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
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                console.error('[OpenRouterProvider] Raw stream error object:', JSON.stringify(parsed.error));
                const errMsg = typeof parsed.error === 'string' ? parsed.error : parsed.error.message || JSON.stringify(parsed.error);
                throw new Error(`OpenRouter Stream Error: ${errMsg}`);
              }

              const delta = parsed.choices?.[0]?.delta;
              if (delta && typeof delta.content === 'string') {
                onChunk({ text: delta.content });
              }
            } catch (parseErr: any) {
              if (parseErr.message && parseErr.message.includes('OpenRouter Stream Error')) {
                throw parseErr;
              }
              // Ignore unparseable fragments
            }
          }
        }
      }

      if (buffer.trim().startsWith('data: ')) {
        const dataStr = buffer.trim().slice(6).trim();
        if (dataStr && dataStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta;
            if (delta && typeof delta.content === 'string') {
              onChunk({ text: delta.content });
            }
          } catch {
            // ignore
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const openRouterProvider = new OpenRouterProvider();
