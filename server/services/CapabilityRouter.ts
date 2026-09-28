export type CapabilityType =
  | 'CHAT'
  | 'REASONING'
  | 'CODE'
  | 'IMAGE_ANALYSIS'
  | 'IMAGE_EDIT'
  | 'IMAGE_GENERATION'
  | 'DOCUMENT_ANALYSIS'
  | 'WEB_RESEARCH';

export interface RoutedCapability {
  capability: CapabilityType;
  confidence: number;
  extractedPrompt: string;
  hasImageAttachment: boolean;
  hasDocAttachment: boolean;
  imageAttachments: any[];
  docAttachments: any[];
  isExplicitSvgRequested: boolean;
  resolvedReasoningEffort: 'low' | 'medium' | 'high';
}

export class CapabilityRouter {
  public classifyAutoReasoningLevel(
    prompt: string,
    hasAttachments: boolean = false
  ): 'low' | 'medium' | 'high' {
    const raw = (prompt || '').trim();
    const lower = raw.toLowerCase();

    // SIMPLE: Short greetings, basic arithmetic, simple single-sentence tasks
    const isGreeting = /^(hi|hello|hey|yo|salaam|greetings|good\s+(morning|afternoon|evening))\b/i.test(lower);
    const isBasicMath = /^(\s*what\s+is\s+)?[\d\.\s\+\-\*\/\(\)\^\%xX]+[\?]?$/i.test(lower);
    const isShortQuery = raw.length < 25 && !/\b(code|explain|why|how|debug|build|architect)\b/i.test(lower);

    if (isGreeting || isBasicMath || isShortQuery) {
      return 'low';
    }

    // COMPLEX: Coding, debugging, architectural breakdown, multi-file analysis
    const isComplexCoding = /\b(code|refactor|debug|react|typescript|python|component|sql|algorithm|architect|system design|security|contract|review|audit)\b/i.test(lower);
    if (hasAttachments || isComplexCoding || raw.length > 300) {
      return 'high';
    }

    // NORMAL: General questions, summaries, comparisons
    return 'medium';
  }

  public resolveReasoningEffort(
    uiReasoningLevel: string = 'auto',
    prompt: string = '',
    hasAttachments: boolean = false
  ): 'low' | 'medium' | 'high' {
    const level = (uiReasoningLevel || 'auto').toLowerCase();

    if (level === 'auto') {
      return this.classifyAutoReasoningLevel(prompt, hasAttachments);
    }
    if (level === 'low') return 'low';
    if (level === 'medium') return 'medium';
    if (level === 'high' || level === 'extra_high' || level === 'max') {
      return 'high';
    }

    return 'medium';
  }

  public route(
    prompt: string,
    attachments: any[] = [],
    options?: { webSearch?: boolean; research?: boolean; reasoningLevel?: string }
  ): RoutedCapability {
    const rawPrompt = (prompt || '').trim();
    const lower = rawPrompt.toLowerCase();

    const resolvedReasoningEffort = this.resolveReasoningEffort(
      options?.reasoningLevel || 'auto',
      rawPrompt,
      attachments.length > 0
    );

    // Categorize attachments
    const imageAttachments = attachments.filter(
      (a) =>
        a.fileCategory === 'image' ||
        (a.type && a.type.startsWith('image/')) ||
        (a.dataUrl && a.dataUrl.startsWith('data:image/'))
    );

    const docAttachments = attachments.filter(
      (a) =>
        a.fileCategory === 'pdf' ||
        a.fileCategory === 'document' ||
        a.fileCategory === 'csv' ||
        a.fileCategory === 'spreadsheet' ||
        a.fileCategory === 'text' ||
        (a.type && !a.type.startsWith('image/'))
    );

    const hasImageAttachment = imageAttachments.length > 0;
    const hasDocAttachment = docAttachments.length > 0;

    // Check if user explicitly asks for SVG code or vector diagram
    const isExplicitSvgRequested = /\b(svg|vector code|svg code|raw svg|svg logo|svg image)\b/i.test(lower);

    // 1. IMAGE EDITING: User attached an image AND gave edit instructions
    const isEditDirective = /\b(change|edit|modify|transform|remove|make it|turn this into|recolor|add a|background|replace|style of|filter|make blue|make red|make anime|retouch|isko change|background change|blue kar|hata do)\b/i.test(lower);
    if (hasImageAttachment && isEditDirective) {
      return {
        capability: 'IMAGE_EDIT',
        confidence: 0.98,
        extractedPrompt: rawPrompt,
        hasImageAttachment,
        hasDocAttachment,
        imageAttachments,
        docAttachments,
        isExplicitSvgRequested,
        resolvedReasoningEffort,
      };
    }

    // 2. IMAGE ANALYSIS: User attached an image AND wants it analyzed/described
    if (hasImageAttachment) {
      return {
        capability: 'IMAGE_ANALYSIS',
        confidence: 0.95,
        extractedPrompt: rawPrompt || 'Describe and analyze this image in detail.',
        hasImageAttachment,
        hasDocAttachment,
        imageAttachments,
        docAttachments,
        isExplicitSvgRequested,
        resolvedReasoningEffort,
      };
    }

    // 3. EXPLICIT IMAGE GENERATION (English, Roman Urdu, Hindi, Slang)
    const isExplicitPromptOnly = /\b(image prompt only|prompt for midjourney|dall-e prompt only|prompt de do|prompt likh do|give me a prompt|write a prompt|provide a prompt|generate a prompt|prompt chahiye)\b/i.test(lower);

    const imageGenPatterns = [
      // English verb + object patterns: create/generate/make/draw/paint/render/design/produce + image/picture/photo/etc.
      /\b(create|generate|make|draw|paint|render|produce|design|craft)\s+(an?|me|us|a|the)?\s*(new\s+)?(image|picture|photo|illustration|drawing|painting|artwork|graphic|portrait|landscape|wallpaper|banner|avatar|visual|poster|logo|render)\b/i,
      /\b(draw|paint|illustrate|render)\s+(an?|a|me|us)?\s+[a-z0-9]/i,
      /\b(create|generate|make)\s+(an?|a)?\s*(wallpaper|avatar|banner|poster|logo)\b/i,
      // "photo of", "picture of", "image of", "wallpaper of" when requesting generation
      /\b(photo|picture|image|illustration|drawing|artwork|wallpaper|poster|render)\s+of\s+[a-z0-9]/i,
      // Roman Urdu & Hindi & Slang (e.g. "yaar new image banker do ok", "tasveer bana do", "image banao")
      /\b(image|tasveer|tasweer|photo|picture|pic|poster|logo|wallpaper)\s+(bana|bna|banado|bana do|banao|banayein|banker do|banakar do|bna do|bnao|generate karo|create karo|karo|chahiye)\b/i,
      /\b(bana|bna|bana do|banao|banakar do|banado|bna do|bnao)\s+(aik|ek|koi|new|achhi|achi)?\s*(image|photo|tasveer|tasweer|picture|pic|poster|logo|wallpaper)\b/i,
      /\b(yaar|yar)?\s*(new|aik|ek|dusri)?\s*(image|tasveer|photo|picture)\s*(banker do|bana do|banao|bna do|banado|bnao)\b/i,
      /\b(kuch draw karo|tasveer bana k do|photo bna do|picture bna do|image banayein|image generate karo|image create karo|actual image bana|yahin image bana)\b/i,
    ];

    const isImageGenMatch = imageGenPatterns.some((pattern) => pattern.test(lower));

    if (isImageGenMatch && !isExplicitPromptOnly && !isExplicitSvgRequested) {
      return {
        capability: 'IMAGE_GENERATION',
        confidence: 0.98,
        extractedPrompt: rawPrompt,
        hasImageAttachment,
        hasDocAttachment,
        imageAttachments,
        docAttachments,
        isExplicitSvgRequested,
        resolvedReasoningEffort,
      };
    }

    // 4. DOCUMENT ANALYSIS: User attached PDFs, CSVs, or text documents
    if (hasDocAttachment) {
      return {
        capability: 'DOCUMENT_ANALYSIS',
        confidence: 0.95,
        extractedPrompt: rawPrompt || 'Summarize and analyze the key information in this document.',
        hasImageAttachment,
        hasDocAttachment,
        imageAttachments,
        docAttachments,
        isExplicitSvgRequested,
        resolvedReasoningEffort,
      };
    }

    // 5. WEB RESEARCH: Explicit webSearch / research requested
    if (options?.webSearch || options?.research) {
      return {
        capability: 'WEB_RESEARCH',
        confidence: 0.95,
        extractedPrompt: rawPrompt,
        hasImageAttachment,
        hasDocAttachment,
        imageAttachments,
        docAttachments,
        isExplicitSvgRequested,
        resolvedReasoningEffort,
      };
    }

    // 6. CODING: Technical code generation and debugging
    const isCodingQuery = /\b(code|function|react|typescript|javascript|python|component|sql|api|html|css|bug|regex|class|algorithm|endpoint|refactor)\b/i.test(lower) &&
      /\b(write|create|build|fix|debug|show|give|implement|make|generate|refactor|solve)\b/i.test(lower);

    if (isCodingQuery) {
      return {
        capability: 'CODE',
        confidence: 0.9,
        extractedPrompt: rawPrompt,
        hasImageAttachment,
        hasDocAttachment,
        imageAttachments,
        docAttachments,
        isExplicitSvgRequested,
        resolvedReasoningEffort,
      };
    }

    // 7. DEEP REASONING: Complex multi-step reasoning or high reasoning setting
    if (
      options?.reasoningLevel === 'high' ||
      options?.reasoningLevel === 'extra_high' ||
      options?.reasoningLevel === 'max' ||
      /\b(prove|derive|step by step proof|architectural trade-off|formal verification|counter-example)\b/i.test(lower)
    ) {
      return {
        capability: 'REASONING',
        confidence: 0.85,
        extractedPrompt: rawPrompt,
        hasImageAttachment,
        hasDocAttachment,
        imageAttachments,
        docAttachments,
        isExplicitSvgRequested,
        resolvedReasoningEffort: 'high',
      };
    }

    // 8. DEFAULT CHAT
    return {
      capability: 'CHAT',
      confidence: 0.8,
      extractedPrompt: rawPrompt,
      hasImageAttachment,
      hasDocAttachment,
      imageAttachments,
      docAttachments,
      isExplicitSvgRequested,
      resolvedReasoningEffort,
    };
  }
}

export const capabilityRouter = new CapabilityRouter();
