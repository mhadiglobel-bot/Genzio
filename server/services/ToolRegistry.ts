import { imageGenerationService, ImageGenerationRequest, ImageGenerationResult } from './ImageGenerationService.ts';

export interface ToolExecutionResponse {
  success: boolean;
  type: 'text' | 'markdown' | 'code' | 'image' | 'file' | 'error';
  content?: string;
  image?: {
    imageUrl: string;
    prompt: string;
    aspectRatio: string;
    modelUsed: string;
  };
  error?: string;
}

export class ToolRegistry {
  /**
   * Executes Image Generation tool.
   * STRICT RULE: Never returns fake SVG or Canva instructions if image generation fails,
   * unless user explicitly requested SVG.
   */
  public async executeImageGeneration(
    prompt: string,
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '1:1',
    isExplicitSvg: boolean = false
  ): Promise<ToolExecutionResponse> {
    try {
      const result: ImageGenerationResult = await imageGenerationService.generateImage({
        prompt,
        aspectRatio,
        model: process.env.OPENROUTER_IMAGE_MODEL,
      });

      if (result.success && result.imageUrl) {
        return {
          success: true,
          type: 'image',
          image: {
            imageUrl: result.imageUrl,
            prompt: result.prompt,
            aspectRatio: result.aspectRatio,
            modelUsed: result.modelUsed,
          },
          content: '',
        };
      }

      // If user explicitly asked for SVG code
      if (isExplicitSvg) {
        return {
          success: false,
          type: 'error',
          error: 'Image generation service returned an error. SVG code generation is available upon request.',
        };
      }

      return {
        success: false,
        type: 'error',
        error: result.error || 'Image generation is not configured or currently unavailable.',
      };
    } catch (err: any) {
      console.error('[ToolRegistry] Image generation exception:', err);
      return {
        success: false,
        type: 'error',
        error: 'Image generation service encountered an unexpected error.',
      };
    }
  }

  /**
   * Executes Image Editing tool using reference image.
   */
  public async executeImageEdit(
    prompt: string,
    referenceImageBase64?: string,
    referenceMimeType?: string
  ): Promise<ToolExecutionResponse> {
    if (!referenceImageBase64) {
      return {
        success: false,
        type: 'error',
        error: 'No reference image was provided for editing.',
      };
    }

    try {
      const result: ImageGenerationResult = await imageGenerationService.generateImage({
        prompt,
        referenceImageBase64,
        referenceMimeType,
        model: process.env.OPENROUTER_IMAGE_MODEL,
      });

      if (result.success && result.imageUrl) {
        return {
          success: true,
          type: 'image',
          image: {
            imageUrl: result.imageUrl,
            prompt: result.prompt,
            aspectRatio: result.aspectRatio,
            modelUsed: result.modelUsed,
          },
          content: '',
        };
      }

      return {
        success: false,
        type: 'error',
        error: result.error || 'Image editing service is currently unavailable.',
      };
    } catch (err: any) {
      console.error('[ToolRegistry] Image edit exception:', err);
      return {
        success: false,
        type: 'error',
        error: 'Unable to process image edit request.',
      };
    }
  }
}

export const toolRegistry = new ToolRegistry();
