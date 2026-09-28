export type UserIntentType =
  | 'conversation'
  | 'greeting'
  | 'question'
  | 'writing'
  | 'rewrite'
  | 'translation'
  | 'code'
  | 'creative_prompt'
  | 'image_prompt'
  | 'video_prompt'
  | 'image_generation'
  | 'image_edit'
  | 'web_search'
  | 'research'
  | 'file_analysis'
  | 'calculation';

export interface ClassifiedIntent {
  intent: UserIntentType;
  confidence: number;
  extractedSubject?: string;
  targetTool?: string;
  promptCategory?: 'image' | 'video' | 'general' | 'sora' | 'veo' | 'flow' | 'midjourney';
  isRealImageGenerationRequested: boolean;
}

/**
 * Universal Intent Router for Genzio AI.
 * Handles English, Roman Urdu, Urdu, Hindi, and mixed language queries.
 * Accurately distinguishes between:
 * - "Image Prompt" requests (e.g. "mujhe ek BMW rain image ka prompt do")
 * - "Real Image Generation" requests (e.g. "BMW ki rain wali image bana do" / "create an image of a BMW")
 */
export class IntentRouter {
  public classify(
    text: string,
    hasAttachments: boolean = false,
    options?: { webSearch?: boolean; research?: boolean }
  ): ClassifiedIntent {
    const raw = (text || '').trim();
    const lower = raw.toLowerCase();

    // Explicit user toggles
    if (options?.research) {
      return {
        intent: 'research',
        confidence: 1.0,
        isRealImageGenerationRequested: false,
      };
    }

    if (options?.webSearch) {
      return {
        intent: 'web_search',
        confidence: 1.0,
        isRealImageGenerationRequested: false,
      };
    }

    // Attachments
    if (hasAttachments) {
      return {
        intent: 'file_analysis',
        confidence: 0.95,
        isRealImageGenerationRequested: false,
      };
    }

    // 1. Simple Greetings & Casual phrases
    if (
      /^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|salaam|assalam\s*o?\s*alaikum|salam|yo|kese\s*ho|kaise\s*ho|kya\s*haal\s*hai)$/i.test(
        lower.replace(/[\?!.,;:]+$/, '')
      )
    ) {
      return {
        intent: 'greeting',
        confidence: 0.99,
        isRealImageGenerationRequested: false,
      };
    }

    // 2. Distinguish: Real Image Generation vs Image Prompt
    // REAL IMAGE GENERATION REQUESTS:
    // "generate an image", "create an image", "make an image", "draw an image", "paint an image", "picture bana do", "image banao"
    const isExplicitPromptRequest =
      /\b(prompt|prompts|image prompt|video prompt|midjourney prompt|dall-e prompt|sora prompt|veo prompt|prompt do|prompt de do|prompt bna do|prompt likh do|prompt chahiye|give me a prompt|generate a prompt|write a prompt|provide a prompt)\b/i.test(
        lower
      );

    const isExplicitImageGenAction =
      /\b(create an image|generate an image|generate image|make an image|draw an image|paint a picture|render an image|image bana do|image banao|tasveer bana do|photo bana do|picture bana do|draw me a|generate a photo|create a visual)\b/i.test(
        lower
      );

    // If user explicitly asks for an image generation action and did NOT say "prompt do / give me a prompt"
    if (isExplicitImageGenAction && !isExplicitPromptRequest) {
      return {
        intent: 'image_generation',
        confidence: 0.95,
        promptCategory: 'image',
        isRealImageGenerationRequested: true,
      };
    }

    // VIDEO PROMPTS:
    if (
      /\b(video prompt|sora prompt|veo prompt|google flow prompt|flow video prompt|video ka prompt|animation prompt|runway prompt|luma prompt)\b/i.test(
        lower
      ) ||
      (/\b(video|flow|sora|veo|runway)\b/i.test(lower) && /\b(prompt|idea|script)\b/i.test(lower))
    ) {
      return {
        intent: 'video_prompt',
        confidence: 0.95,
        promptCategory: lower.includes('sora')
          ? 'sora'
          : lower.includes('veo')
          ? 'veo'
          : lower.includes('flow')
          ? 'flow'
          : 'video',
        isRealImageGenerationRequested: false,
      };
    }

    // IMAGE PROMPTS (Text Prompt intended for Midjourney, DALL-E, Imagen, etc.)
    if (
      isExplicitPromptRequest ||
      /\b(image prompt|photo prompt|midjourney|dall-e|imagen|wallpaper prompt|aesthetic image prompt|tasveer ka prompt)\b/i.test(
        lower
      ) ||
      (/\b(bmw|car|girl|cyberpunk|portrait|landscape|nature|rain|aesthetic|anime|3d)\b/i.test(lower) &&
        /\b(prompt|idea)\b/i.test(lower))
    ) {
      return {
        intent: 'image_prompt',
        confidence: 0.95,
        promptCategory: 'image',
        isRealImageGenerationRequested: false,
      };
    }

    // 3. Coding
    if (
      /\b(code|function|react|typescript|javascript|python|component|sql|api|html|css|bug|regex|class|algorithm|endpoint)\b/i.test(
        lower
      ) &&
      /\b(write|create|build|fix|debug|show|give|implement|make|generate|refactor)\b/i.test(lower)
    ) {
      return {
        intent: 'code',
        confidence: 0.9,
        isRealImageGenerationRequested: false,
      };
    }

    // 4. Arithmetic / Math
    if (
      /^(\s*what\s+is\s+)?[\d\.\s\+\-\*\/\(\)\^\%xX]+[\?]?$/i.test(lower) ||
      /calculate|solve|multiply|divide|square root|log|sin|cos|tan/i.test(lower)
    ) {
      return {
        intent: 'calculation',
        confidence: 0.9,
        isRealImageGenerationRequested: false,
      };
    }

    // 5. Web Search / Real-time info
    if (
      /\b(latest|current|today|news|stock price|weather|who won|score|crypto price|exchange rate|who is the current|recent)\b/i.test(
        lower
      )
    ) {
      return {
        intent: 'web_search',
        confidence: 0.85,
        isRealImageGenerationRequested: false,
      };
    }

    return {
      intent: 'conversation',
      confidence: 0.7,
      isRealImageGenerationRequested: false,
    };
  }
}

export const intentRouter = new IntentRouter();
