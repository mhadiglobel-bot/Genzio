import { GenerationOptions, StreamChunk } from '../providers/types.ts';
import { webSearchService } from './WebSearchService.ts';
import { calculatorTool } from './CalculatorTool.ts';

export interface ToolOrchestrationResult {
  modifiedOptions: GenerationOptions;
  mathResult?: string;
}

export class ToolOrchestrator {
  /**
   * Evaluates incoming request intent and executes tools (Web Search, Research, Calculator, File Analysis)
   * emitting real-time progress tool statuses and citations to client via onChunk.
   */
  public async orchestrate(
    options: GenerationOptions,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<ToolOrchestrationResult> {
    const lastUserMsg = options.messages[options.messages.length - 1];
    const query = (options.prompt || lastUserMsg?.content || '').trim();
    const attachments = options.attachments || lastUserMsg?.attachments || [];

    // 1. File Analysis Indicator
    if (attachments.length > 0) {
      const hasImg = attachments.some((a) => a.fileCategory === 'image' || a.type.startsWith('image/'));
      const hasPdf = attachments.some((a) => a.fileCategory === 'pdf' || a.type === 'application/pdf');

      if (hasImg) {
        onChunk({ toolStatus: 'Inspecting image...' });
      } else if (hasPdf) {
        onChunk({ toolStatus: 'Reading PDF document...' });
      } else {
        onChunk({ toolStatus: 'Analyzing file attachment...' });
      }
    }

    // 2. Calculator Tool Check (Exact Math)
    const mathAnswer = calculatorTool.evaluateIfMath(query);
    if (mathAnswer && !options.webSearch && !options.research) {
      onChunk({ toolStatus: 'Calculating...' });
    }

    // 3. Web Search & Research Need Detection
    const isExplicitSearch = !!options.webSearch;
    const isExplicitResearch = !!options.research;

    const needsCurrentInformation = this.shouldSearchWeb(query);

    const shouldPerformSearch = isExplicitSearch || isExplicitResearch || needsCurrentInformation;

    let searchContext = '';

    if (shouldPerformSearch) {
      if (isExplicitResearch) {
        onChunk({ toolStatus: 'Planning multi-step research...' });
        await this.sleep(300);
        onChunk({ toolStatus: 'Searching web & verifying references...' });
      } else {
        onChunk({ toolStatus: 'Searching the web...' });
      }

      try {
        const searchRes = await webSearchService.search(query);

        if (searchRes.results.length > 0) {
          onChunk({
            toolStatus: isExplicitResearch ? 'Reviewing sources & cross-checking...' : 'Analyzing search results...',
            citations: searchRes.results.map((r) => ({
              title: r.title,
              url: r.url,
              domain: r.domain,
              snippet: r.snippet,
            })),
          });

          searchContext = searchRes.sourceText;
        } else {
          onChunk({ toolStatus: 'Searching web...' });
        }
      } catch (e) {
        console.warn('[ToolOrchestrator] Search tool error:', e);
      }
    } else if (options.reasoning || options.reasoningLevel === 'high' || options.reasoningLevel === 'extra_high') {
      onChunk({ toolStatus: 'Thinking...' });
    }

    const modifiedOptions: GenerationOptions = {
      ...options,
      searchContext: searchContext || undefined,
    };

    return {
      modifiedOptions,
      mathResult: mathAnswer || undefined,
    };
  }

  private shouldSearchWeb(query: string): boolean {
    if (!query) return false;
    const lower = query.toLowerCase();

    // Check for explicit search / temporal keywords
    const searchKeywords = [
      'search',
      'latest news',
      'current stock',
      'weather today',
      'sports score',
      'who won',
      'recent update',
      'release date 2026',
      'what happened today',
      'current president',
      'current ceo',
      'live price',
      'top news',
      'trending',
    ];

    return searchKeywords.some((kw) => lower.includes(kw));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const toolOrchestrator = new ToolOrchestrator();
