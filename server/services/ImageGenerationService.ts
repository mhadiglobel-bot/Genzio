import { GoogleGenAI } from '@google/genai';

export interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '1:4' | '1:8' | '4:1' | '8:1';
  imageSize?: '512px' | '1K' | '2K' | '4K';
  referenceImageBase64?: string;
  referenceMimeType?: string;
  model?: string;
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  prompt: string;
  aspectRatio: string;
  modelUsed: string;
  revisedPrompt?: string;
  error?: string;
}

export class ImageGenerationService {
  private geminiClient: GoogleGenAI | null = null;

  private getGeminiClient(): GoogleGenAI | null {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      return null;
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

  /**
   * Generates or edits an image using OpenRouter or Gemini Image APIs.
   * STRICT RULE: Never returns fake SVG / Canva output if model is unavailable.
   */
  public async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const prompt = (request.prompt || '').trim();
    const aspectRatio = request.aspectRatio || '1:1';
    const imageSize = request.imageSize || '1K';

    let lastErrorDetail = '';

    // 1. Try OpenRouter Image Generation if OPENROUTER_API_KEY is configured
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const openRouterImageModel =
      request.model || process.env.OPENROUTER_IMAGE_MODEL || 'google/gemini-3.1-flash-image';

    if (openRouterKey) {
      try {
        console.log(`[ImageGen] Calling OpenRouter for image generation with model: ${openRouterImageModel}`);

        const messages: any[] = [];
        if (request.referenceImageBase64) {
          const cleanBase64 = request.referenceImageBase64.startsWith('data:')
            ? request.referenceImageBase64
            : `data:${request.referenceMimeType || 'image/png'};base64,${request.referenceImageBase64}`;

          messages.push({
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: cleanBase64 },
              },
              {
                type: 'text',
                text: `Edit the attached image according to these exact instructions: ${prompt}`,
              },
            ],
          });
        } else {
          messages.push({
            role: 'user',
            content: `Generate an image: ${prompt}`,
          });
        }

        const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: openRouterImageModel,
            messages,
            modalities: ['image', 'text'],
            max_tokens: 2048,
          }),
        });

        if (openRouterRes.ok) {
          const openRouterData = await openRouterRes.json();
          const choice = openRouterData.choices?.[0]?.message;

          // Check choice.images (standard OpenRouter multimodal image output)
          let imageUrl: string | null = null;
          if (choice?.images && choice.images.length > 0) {
            const firstImg = choice.images[0];
            imageUrl = firstImg?.image_url?.url || firstImg?.url || (typeof firstImg === 'string' ? firstImg : null);
          }

          // Fallback: check markdown image tag in content
          if (!imageUrl && choice?.content) {
            const mdMatch = choice.content.match(/!\[.*?\]\((data:image\/[^;]+;base64,[^\)]+)\)/);
            if (mdMatch) {
              imageUrl = mdMatch[1];
            } else {
              const urlMatch = choice.content.match(/!\[.*?\]\((https:\/\/[^\)]+)\)/);
              if (urlMatch) {
                imageUrl = urlMatch[1];
              }
            }
          }

          if (imageUrl) {
            console.log(`[ImageGen] Successfully generated real image via OpenRouter (${openRouterImageModel})`);
            return {
              success: true,
              imageUrl,
              prompt,
              aspectRatio,
              modelUsed: openRouterImageModel,
            };
          }
        } else {
          const errText = await openRouterRes.text();
          lastErrorDetail = `OpenRouter (${openRouterRes.status}): ${errText.slice(0, 160)}`;
          console.warn(`[ImageGen] OpenRouter image request returned ${openRouterRes.status}:`, errText.slice(0, 150));
        }
      } catch (err: any) {
        lastErrorDetail = err?.message || String(err);
        console.warn('[ImageGen] OpenRouter image endpoint call failed:', err?.message || err);
      }
    }

    // 2. Try Gemini Image Generation API directly
    const geminiClient = this.getGeminiClient();
    if (geminiClient) {
      const candidateModels = [
        request.model || 'gemini-3.1-flash-lite-image',
        'gemini-3.1-flash-image',
        'gemini-3-pro-image',
      ];

      for (const modelName of candidateModels) {
        try {
          console.log(`[ImageGen] Attempting Gemini image generation with model: ${modelName}`);

          const parts: any[] = [];
          if (request.referenceImageBase64) {
            const cleanBase64 = request.referenceImageBase64.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                data: cleanBase64,
                mimeType: request.referenceMimeType || 'image/png',
              },
            });
          }

          parts.push({ text: prompt });

          const response = await geminiClient.models.generateContent({
            model: modelName,
            contents: { parts },
            config: {
              imageConfig: {
                aspectRatio,
                imageSize,
              },
            },
          });

          const candidate = response.candidates?.[0];
          if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData && part.inlineData.data) {
                const mimeType = part.inlineData.mimeType || 'image/png';
                const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
                console.log(`[ImageGen] Successfully generated real image via Gemini (${modelName})`);
                return {
                  success: true,
                  imageUrl,
                  prompt,
                  aspectRatio,
                  modelUsed: modelName,
                };
              }
            }
          }
        } catch (err: any) {
          lastErrorDetail = `Gemini (${modelName}): ${err?.message || err}`;
          console.warn(`[ImageGen] Gemini image model ${modelName} failed:`, err?.message || err);
        }
      }
    }

    // 3. STRICT RULE: Never fake image success with SVG, Canva, or Photoshop instructions.
    // Return genuine provider error.
    return {
      success: false,
      prompt,
      aspectRatio,
      modelUsed: 'none',
      error: lastErrorDetail
        ? `Image generation failed: ${lastErrorDetail}`
        : 'Image generation service is temporarily unavailable. Please retry in a moment.',
    };
  }
}

export const imageGenerationService = new ImageGenerationService();
