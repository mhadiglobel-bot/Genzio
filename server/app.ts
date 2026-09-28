import express from 'express';
import { aiService } from './providers/AIService.ts';
import { imageGenerationService } from './services/ImageGenerationService.ts';
import { webSearchService } from './services/WebSearchService.ts';
import { fileProcessorService } from './services/FileProcessorService.ts';
import { capabilityRouter } from './services/CapabilityRouter.ts';
import { toolRegistry } from './services/ToolRegistry.ts';
import { GENZIO_MODELS, getModelConfig } from '../src/config/models.ts';

export const app = express();

// Enable standard CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// In-memory Shared Conversations Store (Vercel & Production Ready)
const sharedChatsStore = new Map<string, any>();

// 1. API Health Check & Discovery
app.get('/api/health', (_req, res) => {
  const hasOpenRouterKey = !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim().length > 0);
  const hasGeminiKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');

  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'production',
    providers: {
      openrouter: hasOpenRouterKey,
      gemini: hasGeminiKey,
    },
    models: GENZIO_MODELS.map((m) => ({
      id: m.id,
      modelId: m.modelId,
      displayName: m.displayName,
      badge: m.badge,
      role: m.role,
      isFreeTier: m.isFreeTier,
    })),
    capabilities: [
      'real-time-streaming',
      'image-generation',
      'image-editing',
      'video-prompt-generation',
      'web-search-grounding',
      'multimodal-file-analysis',
      'reasoning-depths',
    ],
    timestamp: Date.now(),
  });
});

app.get('/api/models', (_req, res) => {
  res.json({
    models: GENZIO_MODELS,
    hasApiKey: !!(process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY),
  });
});

// 2. Server-side File Processing Endpoint
app.post('/api/process-file', async (req, res) => {
  try {
    const { name, type, base64, dataUrl } = req.body;

    if (!name || (!base64 && !dataUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Missing filename or file payload.',
      });
    }

    let buffer: Buffer;
    if (base64) {
      buffer = Buffer.from(base64, 'base64');
    } else if (dataUrl && dataUrl.includes(',')) {
      const parts = dataUrl.split(',');
      buffer = Buffer.from(parts[1], 'base64');
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid file data encoding.',
      });
    }

    const processed = await fileProcessorService.processFile(buffer, name, type || 'application/octet-stream');

    return res.json({
      success: processed.status === 'ready',
      file: processed,
    });
  } catch (err: any) {
    console.error('Error in /api/process-file:', err);
    return res.status(500).json({
      success: false,
      error: 'File processing error. Please try again.',
    });
  }
});

// Alias: /api/files/process
app.post('/api/files/process', async (req, res) => {
  try {
    const { name, type, base64, dataUrl } = req.body;
    if (!name || (!base64 && !dataUrl)) {
      return res.status(400).json({ success: false, error: 'Missing filename or file payload.' });
    }

    let buffer: Buffer;
    if (base64) {
      buffer = Buffer.from(base64, 'base64');
    } else if (dataUrl && dataUrl.includes(',')) {
      buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
    } else {
      return res.status(400).json({ success: false, error: 'Invalid file data encoding.' });
    }

    const processed = await fileProcessorService.processFile(buffer, name, type || 'application/octet-stream');
    return res.json({ success: processed.status === 'ready', file: processed });
  } catch (err: any) {
    console.error('Error in /api/files/process:', err);
    return res.status(500).json({ success: false, error: 'File processing error.' });
  }
});

// 3. Real Image Generation API Endpoint
app.post('/api/image/generate', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', isExplicitSvg = false } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Image prompt required.' });
    }

    const result = await toolRegistry.executeImageGeneration(prompt, aspectRatio, isExplicitSvg);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Image generation is not configured yet.',
      });
    }

    res.json({
      success: true,
      image: result.image,
      text: result.content,
    });
  } catch (err: any) {
    console.error('Error in /api/image/generate:', err);
    res.status(500).json({ success: false, error: 'Image generation failed.' });
  }
});

// 4. Real Image Editing API Endpoint
app.post('/api/image/edit', async (req, res) => {
  try {
    const { prompt, referenceImageBase64, referenceMimeType } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Edit prompt required.' });
    }

    const result = await toolRegistry.executeImageEdit(
      prompt,
      referenceImageBase64,
      referenceMimeType
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Image editing service is currently unavailable.',
      });
    }

    res.json({
      success: true,
      image: result.image,
      text: result.content,
    });
  } catch (err: any) {
    console.error('Error in /api/image/edit:', err);
    res.status(500).json({ success: false, error: 'Image edit failed.' });
  }
});

// 5. Unified Image Generation & Editing Endpoint
app.post('/api/image', async (req, res) => {
  try {
    const {
      prompt = '',
      aspectRatio = '1:1',
      imageSize = '1K',
      referenceImageBase64,
      referenceMimeType,
      model,
    } = req.body;

    if (!prompt && !referenceImageBase64) {
      return res.status(400).json({
        success: false,
        error: 'A text prompt or reference image is required for image generation.',
      });
    }

    const result = await imageGenerationService.generateImage({
      prompt,
      aspectRatio,
      imageSize,
      referenceImageBase64,
      referenceMimeType,
      model,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/image endpoint:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Image generation failed. Please try again.',
    });
  }
});

// 6. Live Web Search Endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query = '' } = req.body;
    if (!query.trim()) {
      return res.status(400).json({ success: false, error: 'Query parameter required.' });
    }

    const searchResults = await webSearchService.search(query);
    res.json({
      success: true,
      query: searchResults.query,
      results: searchResults.results,
      sourceText: searchResults.sourceText,
    });
  } catch (err: any) {
    console.error('Error in /api/search:', err);
    res.status(500).json({ success: false, error: 'Web search failed.' });
  }
});

// 7. Automatic Title Generation Endpoint
app.post('/api/generate-title', async (req, res) => {
  try {
    const { prompt = '', responseSnippet = '' } = req.body;
    if (!prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Prompt required.' });
    }

    const key = process.env.OPENROUTER_API_KEY;
    if (key) {
      try {
        const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key.trim()}`,
            'X-OpenRouter-Title': 'Genzio Title Generator',
          },
          body: JSON.stringify({
            model: 'stealth/space-bunny-alpha',
            messages: [
              {
                role: 'system',
                content:
                  'You are an ultra-fast title generator. Produce a concise, natural 3 to 6 word title summarizing the main topic of the conversation. Output ONLY the raw title text with NO quotes, markdown, or punctuation.',
              },
              {
                role: 'user',
                content: `User Prompt: ${prompt.slice(0, 300)}\nAssistant Snippet: ${responseSnippet.slice(0, 150)}`,
              },
            ],
            reasoning: { effort: 'low' },
          }),
        });

        if (openRouterRes.ok) {
          const json = await openRouterRes.json();
          const rawTitle = json.choices?.[0]?.message?.content?.trim();
          if (rawTitle) {
            const cleanTitle = rawTitle.replace(/^["'‘“`]+|["'’”`]+$/g, '').replace(/\.$/, '').trim();
            if (cleanTitle.length >= 3 && cleanTitle.length <= 60) {
              return res.json({ success: true, title: cleanTitle });
            }
          }
        }
      } catch (aiErr) {
        console.warn('[api/generate-title] OpenRouter title fetch failed, falling back:', aiErr);
      }
    }

    const fallback = createFallbackTitle(prompt);
    return res.json({ success: true, title: fallback });
  } catch (err: any) {
    console.error('Error in /api/generate-title:', err);
    return res.json({ success: true, title: createFallbackTitle(req.body.prompt) });
  }
});

function createFallbackTitle(prompt: string): string {
  if (!prompt) return 'New conversation';
  const clean = prompt
    .replace(/^(help me|can you|please|how to|write a|create a|generate a|build a|analyze|explain)\s+/i, '')
    .trim();
  const words = clean.split(/\s+/).slice(0, 5);
  const title = words.join(' ');
  return title.charAt(0).toUpperCase() + title.slice(1);
}

// 8. Multi-Step Research Endpoint
app.post('/api/research', async (req, res) => {
  try {
    const { query = '', model = 'Genzio Advanced' } = req.body;
    if (!query.trim()) {
      return res.status(400).json({ success: false, error: 'Research topic required.' });
    }

    const searchResults = await webSearchService.search(query);
    const targetConfig = getModelConfig(model);

    let synthesis = '';
    const systemPrompt = `You are Genzio Research Agent. Conduct a deep, balanced, and comprehensive analysis of the requested subject using the grounded web search facts. Include key findings, context, and clear conclusions without filler.`;

    await aiService.streamChat(
      {
        modelId: targetConfig.modelId,
        messages: [{ role: 'user', content: query }],
        prompt: query,
        systemInstruction: systemPrompt,
        searchContext: searchResults.sourceText,
        webSearch: true,
        research: true,
      },
      (chunk) => {
        if (chunk.text) synthesis += chunk.text;
      }
    );

    res.json({
      success: true,
      synthesis: synthesis || searchResults.sourceText,
      citations: searchResults.results.map((r) => ({
        title: r.title,
        url: r.url,
        domain: r.domain,
        snippet: r.snippet,
      })),
    });
  } catch (err: any) {
    console.error('Error in /api/research:', err);
    res.status(500).json({ success: false, error: 'Research synthesis failed.' });
  }
});

// 9. Shared Conversations Store
app.post('/api/share', (req, res) => {
  const { id, title, messages, createdAt } = req.body;
  if (!id || !messages) {
    return res.status(400).json({ success: false, error: 'Chat payload incomplete.' });
  }

  const shareId = `share_${id.replace('chat_', '')}`;
  sharedChatsStore.set(shareId, {
    id: shareId,
    originalId: id,
    title: title || 'Shared Conversation',
    messages,
    createdAt: createdAt || Date.now(),
    sharedAt: Date.now(),
  });

  res.json({
    success: true,
    shareId,
    shareUrl: `/share/${shareId}`,
  });
});

app.get('/api/share/:id', (req, res) => {
  const shareId = req.params.id;
  const chat = sharedChatsStore.get(shareId);
  if (!chat) {
    return res.status(404).json({ success: false, error: 'Shared conversation not found or expired.' });
  }
  res.json({ success: true, chat });
});

function buildSystemInstruction(
  targetConfig: any,
  personalization?: any,
  customInstructions?: any,
  reasoningLevel?: string
): string {
  let systemInstruction = `You are Genzio, a premier AI assistant connected to specialized application tools.

STRICT OPERATIONAL RULES:
1. NEVER repeat, quote, or echo the user's prompt in your response (e.g. NEVER begin with "Here is a direct overview for [user prompt]..." or "Regarding your question about..."). Start your response directly with the requested answer or information.
2. NEVER use generic canned templates, fake placeholders, or boilerplate outlines.
3. NEVER generate SVG, HTML, ASCII art, prompt text, or Canva/Photoshop instructions when asked to generate an image. Image generation is handled by the dedicated image tool.
4. For image analysis, inspect the actual supplied image with multimodal vision.
5. For image editing, use the image-edit capability.
6. Use Markdown and fenced code blocks where appropriate.`;

  if (reasoningLevel === 'low') {
    systemInstruction += `\nReasoning Depth: LOW. Prioritize speed, directness, and concise, high-clarity processing for quick answers.`;
  } else if (reasoningLevel === 'medium') {
    systemInstruction += `\nReasoning Depth: MEDIUM. Balance speed and thoughtful reasoning. Provide structured, clear explanations.`;
  } else if (reasoningLevel === 'high') {
    systemInstruction += `\nReasoning Depth: HIGH. Conduct deep, rigorous reasoning, structured decomposition, and comprehensive accuracy.`;
  } else if (reasoningLevel === 'extra_high') {
    systemInstruction += `\nReasoning Depth: EXTRA HIGH. Maximize reasoning effort and analytical depth. Perform thorough step-by-step analysis, exhaustive validation, and nuanced synthesis for complex problem solving.`;
  } else if (reasoningLevel === 'max') {
    systemInstruction += `\nReasoning Depth: MAXIMUM. Apply maximum available reasoning and computational capacity. Conduct deep architecture breakdown, multi-step critical validation, and high-fidelity synthesis.`;
  }

  if (targetConfig.badge === 'Advanced') {
    systemInstruction += `\nModel Role: You are running as Genzio Advanced. Perform thorough analysis and detailed reasoning when appropriate.`;
  } else if (targetConfig.badge === 'Fast') {
    systemInstruction += `\nModel Role: You are running as Genzio Fast. Provide direct, high-speed, concise answers with low latency.`;
  } else if (targetConfig.badge === 'Lite') {
    systemInstruction += `\nModel Role: You are running as Genzio Lite. Provide ultra-efficient, succinct answers for lightweight tasks.`;
  }

  const baseStyle = personalization?.baseStyle;
  if (baseStyle === 'professional') {
    systemInstruction += `\nTone & Personality: Adopt a professional, objective, and authoritative tone.`;
  } else if (baseStyle === 'friendly') {
    systemInstruction += `\nTone & Personality: Adopt a warm, welcoming, friendly, and collaborative tone.`;
  } else if (baseStyle === 'candid') {
    systemInstruction += `\nTone & Personality: Adopt a direct, candid, and straightforward tone.`;
  } else if (baseStyle === 'efficient') {
    systemInstruction += `\nTone & Personality: Adopt an ultra-concise, high-density, and efficient tone. Omit conversational filler.`;
  } else if (baseStyle === 'creative') {
    systemInstruction += `\nTone & Personality: Adopt an imaginative, expressive, and dynamic creative tone.`;
  }

  const characteristics = personalization?.responseCharacteristics;
  if (characteristics) {
    if (characteristics.warmth === 'reserved') {
      systemInstruction += `\nWarmth: Maintain emotional distance and objective clinical precision.`;
    } else if (characteristics.warmth === 'warm') {
      systemInstruction += `\nWarmth: Communicate with warmth and supportive encouragement.`;
    }

    if (characteristics.enthusiasm === 'measured') {
      systemInstruction += `\nEnthusiasm: Keep energy level calm, measured, and steady.`;
    } else if (characteristics.enthusiasm === 'expressive') {
      systemInstruction += `\nEnthusiasm: Show dynamic engagement and high enthusiasm.`;
    }

    if (characteristics.formatting === 'concise') {
      systemInstruction += `\nFormatting: Provide brief, succinct paragraphs.`;
    } else if (characteristics.formatting === 'detailed') {
      systemInstruction += `\nFormatting: Provide comprehensive explanations.`;
    }

    if (characteristics.emojiUsage === 'none') {
      systemInstruction += `\nEmoji usage: Do NOT include any emojis in your response.`;
    } else if (characteristics.emojiUsage === 'frequent') {
      systemInstruction += `\nEmoji usage: Include relevant, tasteful emojis naturally throughout your response.`;
    }
  }

  const instructions = personalization?.customInstructions || customInstructions;
  if (instructions && instructions.enabled !== false) {
    if (instructions.aboutUser?.trim()) {
      systemInstruction += `\n\n[What Genzio should know about the user]:\n${instructions.aboutUser.trim()}`;
    }
    if (instructions.responsePreferences?.trim()) {
      systemInstruction += `\n\n[How Genzio should respond to the user]:\n${instructions.responsePreferences.trim()}`;
    }
  }

  return systemInstruction;
}

// 10. Streaming / Direct AI Chat Handler
async function handleChatExecution(req: express.Request, res: express.Response, isStreamingMode: boolean) {
  const {
    messages = [],
    model = 'Space Bunny Alpha',
    modelPreset,
    prompt = '',
    attachments = [],
    customInstructions,
    personalization,
    webSearch = false,
    reasoning = false,
    reasoningLevel = 'auto',
    research = false,
  } = req.body;

  const requestedModel = modelPreset || model || 'Space Bunny Alpha';
  const targetConfig = getModelConfig(requestedModel);

  if (isStreamingMode) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders?.();

    const abortController = new AbortController();
    let isAborted = false;
    res.on('close', () => {
      if (!res.writableEnded) {
        isAborted = true;
        abortController.abort();
      }
    });

    const sendEvent = (data: any) => {
      if (!isAborted && res.writable) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      }
    };

    const endStream = () => {
      if (!isAborted && res.writable) {
        res.write('data: [DONE]\n\n');
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
        res.end();
      }
    };

    try {
      const promptToSend = prompt || (messages.length > 0 ? messages[messages.length - 1]?.content : '');
      const routed = capabilityRouter.route(promptToSend, attachments, { webSearch, research, reasoningLevel });

      // 1. IMAGE GENERATION ROUTE
      if (routed.capability === 'IMAGE_GENERATION' || (routed.capability as any) === 'IMAGE_GENERATE') {
        sendEvent({ toolStatus: 'Generating image...' });
        const toolRes = await toolRegistry.executeImageGeneration(
          promptToSend,
          '1:1',
          routed.isExplicitSvgRequested
        );

        sendEvent({ toolStatus: undefined });
        if (toolRes.success && toolRes.image) {
          sendEvent({
            generatedImage: toolRes.image,
            text: '',
          });
        } else {
          sendEvent({ error: toolRes.error || 'Image generation failed: Provider service is unavailable.' });
        }
        endStream();
        return;
      }

      // 2. IMAGE EDITING ROUTE
      if (routed.capability === 'IMAGE_EDIT') {
        sendEvent({ toolStatus: 'Editing image...' });
        const refImg = routed.imageAttachments[0];
        const refBase64 = refImg?.dataUrl || refImg?.content;
        const toolRes = await toolRegistry.executeImageEdit(
          promptToSend,
          refBase64,
          refImg?.type || 'image/png'
        );

        sendEvent({ toolStatus: undefined });
        if (toolRes.success && toolRes.image) {
          sendEvent({
            generatedImage: toolRes.image,
            text: '',
          });
        } else {
          sendEvent({ error: toolRes.error || 'Image editing service is currently unavailable.' });
        }
        endStream();
        return;
      }

      // 3. Status Indicators
      if (routed.capability === 'IMAGE_ANALYSIS') {
        sendEvent({ toolStatus: 'Reading image...' });
      } else if (routed.capability === 'DOCUMENT_ANALYSIS') {
        sendEvent({ toolStatus: 'Reading document...' });
      } else if (routed.capability === 'CODE') {
        sendEvent({ toolStatus: 'Generating code...' });
      }

      const systemInstruction = buildSystemInstruction(targetConfig, personalization, customInstructions, reasoningLevel);

      await aiService.streamChat(
        {
          modelId: targetConfig.modelId,
          messages: Array.isArray(messages) ? messages : [],
          prompt: promptToSend,
          attachments,
          systemInstruction,
          webSearch,
          reasoning,
          reasoningLevel,
          research,
          capability: routed.capability,
          signal: abortController.signal,
        },
        (chunk) => {
          sendEvent(chunk);
        }
      );
    } catch (error: any) {
      console.error('Streaming error in chat handler:', error);
      const errMsg = error.message || 'Unable to generate response. Please try sending again.';
      sendEvent({ error: errMsg });
    } finally {
      endStream();
    }
  } else {
    // Non-streaming JSON Mode
    let accumulatedText = '';
    let fallbackInfo: any = null;

    try {
      const promptToSend = prompt || (messages.length > 0 ? messages[messages.length - 1]?.content : '');
      const routed = capabilityRouter.route(promptToSend, attachments, { webSearch, research, reasoningLevel });

      if (routed.capability === 'IMAGE_GENERATION' || (routed.capability as any) === 'IMAGE_GENERATE') {
        const toolRes = await toolRegistry.executeImageGeneration(
          promptToSend,
          '1:1',
          routed.isExplicitSvgRequested
        );

        if (toolRes.success && toolRes.image) {
          return res.json({
            success: true,
            text: '',
            generatedImage: toolRes.image,
            modelUsed: toolRes.image.modelUsed,
          });
        }

        return res.status(400).json({
          success: false,
          error: toolRes.error || 'Image generation failed: Provider service is unavailable.',
        });
      }

      if (routed.capability === 'IMAGE_EDIT') {
        const refImg = routed.imageAttachments[0];
        const refBase64 = refImg?.dataUrl || refImg?.content;
        const toolRes = await toolRegistry.executeImageEdit(
          promptToSend,
          refBase64,
          refImg?.type || 'image/png'
        );

        if (toolRes.success && toolRes.image) {
          return res.json({
            success: true,
            text: toolRes.content,
            generatedImage: toolRes.image,
            modelUsed: toolRes.image.modelUsed,
          });
        }

        return res.status(400).json({
          success: false,
          error: toolRes.error || 'Image editing service is currently unavailable.',
        });
      }

      const systemInstruction = buildSystemInstruction(targetConfig, personalization, customInstructions, reasoningLevel);

      await aiService.streamChat(
        {
          modelId: targetConfig.modelId,
          messages: Array.isArray(messages) ? messages : [],
          prompt: promptToSend,
          attachments,
          systemInstruction,
          webSearch,
          reasoning,
          reasoningLevel,
          research,
          capability: routed.capability,
        },
        (chunk) => {
          if (chunk.fallbackNotice) fallbackInfo = chunk.fallbackNotice;
          if (chunk.text) accumulatedText += chunk.text;
        }
      );

      res.json({
        success: true,
        text: accumulatedText || 'Hello! How can I assist you today?',
        fallbackNotice: fallbackInfo,
        modelUsed: targetConfig.displayName,
      });
    } catch (error: any) {
      console.error('Error in chat endpoint:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Unable to connect to AI service. Please try again.',
      });
    }
  }
}

// POST /api/chat: Supports both SSE Streaming and JSON
app.post('/api/chat', async (req, res) => {
  const wantsStream =
    req.body?.stream === true ||
    req.query?.stream === 'true' ||
    req.headers.accept?.includes('text/event-stream');

  await handleChatExecution(req, res, Boolean(wantsStream));
});

// SSE Streaming AI Endpoint: POST /api/chat/stream
app.post('/api/chat/stream', async (req, res) => {
  await handleChatExecution(req, res, true);
});

export default app;
