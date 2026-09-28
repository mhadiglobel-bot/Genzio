import fetch from 'node-fetch';

export interface SearchResultItem {
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  sourceText: string;
}

export class WebSearchService {
  /**
   * Performs real web search using DuckDuckGo / Wikipedia / Public Search APIs
   * to fetch up-to-date live facts without relying on hardcoded data or exposing keys.
   */
  public async search(query: string): Promise<SearchResponse> {
    const cleanQuery = query.trim().replace(/[^\w\s\.-]/gi, ' ');
    if (!cleanQuery) {
      return { query, results: [], sourceText: '' };
    }

    const results: SearchResultItem[] = [];

    try {
      // 1. Fetch live DuckDuckGo Instant Answers & Topics API
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_html=1&skip_disambig=1`;
      const ddgRes = await fetch(ddgUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GenzioSearch/1.0' },
      });

      if (ddgRes.ok) {
        const ddgData: any = await ddgRes.json();

        if (ddgData.AbstractText && ddgData.AbstractURL) {
          try {
            const domain = new URL(ddgData.AbstractURL).hostname.replace('www.', '');
            results.push({
              title: ddgData.Heading || ddgData.AbstractSource || 'Overview',
              url: ddgData.AbstractURL,
              domain,
              snippet: ddgData.AbstractText,
            });
          } catch {
            // ignore URL parse errors
          }
        }

        if (Array.isArray(ddgData.RelatedTopics)) {
          for (const topic of ddgData.RelatedTopics.slice(0, 5)) {
            if (topic.Text && topic.FirstURL) {
              try {
                const domain = new URL(topic.FirstURL).hostname.replace('www.', '');
                results.push({
                  title: topic.Text.slice(0, 60) + '...',
                  url: topic.FirstURL,
                  domain,
                  snippet: topic.Text,
                });
              } catch {
                // ignore
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[WebSearchService] DuckDuckGo search failed:', e);
    }

    // 2. Fetch Wikipedia Summary if needed
    try {
      if (results.length < 3) {
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery)}`;
        const wikiRes = await fetch(wikiUrl, {
          headers: { 'User-Agent': 'GenzioBot/1.0 (https://genzio.ai)' },
        });

        if (wikiRes.ok) {
          const wikiData: any = await wikiRes.json();
          if (wikiData.extract && wikiData.content_urls?.desktop?.page) {
            results.push({
              title: wikiData.title || 'Wikipedia Reference',
              url: wikiData.content_urls.desktop.page,
              domain: 'wikipedia.org',
              snippet: wikiData.extract,
            });
          }
        }
      }
    } catch (e) {
      console.warn('[WebSearchService] Wikipedia search failed:', e);
    }

    // De-duplicate results by URL
    const uniqueResults: SearchResultItem[] = [];
    const seenUrls = new Set<string>();

    for (const item of results) {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        uniqueResults.push(item);
      }
    }

    // Format grounded text for Gemini model prompt
    const sourceText = uniqueResults.length > 0
      ? uniqueResults
          .map(
            (r, i) =>
              `[Source ${i + 1}]: ${r.title}\nURL: ${r.url}\nDomain: ${r.domain}\nSummary: ${r.snippet}\n`
          )
          .join('\n')
      : '';

    return {
      query,
      results: uniqueResults,
      sourceText,
    };
  }
}

export const webSearchService = new WebSearchService();
