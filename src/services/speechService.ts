/**
 * Speech Service for Genzio AI Read Aloud capabilities.
 * Manages Web Speech API synthesis with single-stream playback enforcement,
 * Markdown-to-speech cleaning, and reactive playback state listeners.
 */

type SpeechStateListener = (state: { activeMessageId: string | null; isPlaying: boolean; isPaused: boolean }) => void;

class SpeechService {
  private activeMessageId: string | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isPausedState = false;
  private listeners: Set<SpeechStateListener> = new Set();

  public subscribe(listener: SpeechStateListener): () => void {
    this.listeners.add(listener);
    listener({
      activeMessageId: this.activeMessageId,
      isPlaying: this.isPlaying(),
      isPaused: this.isPausedState,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = {
      activeMessageId: this.activeMessageId,
      isPlaying: this.isPlaying(),
      isPaused: this.isPausedState,
    };
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('Speech state listener error:', err);
      }
    });
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public isPlaying(messageId?: string): boolean {
    if (!this.isSupported()) return false;
    if (messageId) {
      return this.activeMessageId === messageId && window.speechSynthesis.speaking && !this.isPausedState;
    }
    return window.speechSynthesis.speaking && !this.isPausedState;
  }

  public isPaused(messageId?: string): boolean {
    if (!this.isSupported()) return false;
    if (messageId) {
      return this.activeMessageId === messageId && this.isPausedState;
    }
    return this.isPausedState;
  }

  public getActiveMessageId(): string | null {
    return this.activeMessageId;
  }

  /**
   * Sanitizes Markdown, code blocks, tables, and markup into clean spoken text.
   */
  public cleanTextForSpeech(rawText: string): string {
    if (!rawText) return '';

    let text = rawText;

    // Replace code blocks with brief transition
    text = text.replace(/```[\s\S]*?```/g, ' Code snippet omitted. ');

    // Strip inline code
    text = text.replace(/`([^`]+)`/g, '$1');

    // Strip Markdown links: [text](url) -> text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Strip images: ![alt](url) -> ''
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');

    // Strip Markdown headers: ### Title -> Title
    text = text.replace(/^#{1,6}\s+/gm, '');

    // Strip bold / italic formatting: **text**, *text*, __text__, _text_
    text = text.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');

    // Strip blockquotes
    text = text.replace(/^>\s+/gm, '');

    // Strip horizontal rules
    text = text.replace(/^(?:---|\*\*\*|___)\s*$/gm, '');

    // Strip table formatting: | Col 1 | Col 2 |
    text = text.replace(/\|/g, ' ');
    text = text.replace(/-{3,}/g, '');

    // Collapse multiple whitespace/newlines into single clean pauses
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Starts reading a message aloud. If another message was playing, it stops first.
   */
  public readAloud(
    messageId: string,
    rawText: string,
    options?: {
      rate?: number;
      pitch?: number;
      voiceName?: string;
      lang?: string;
      onError?: (err: any) => void;
    }
  ): boolean {
    if (!this.isSupported()) {
      options?.onError?.(new Error('Voice playback is unavailable in this browser.'));
      return false;
    }

    // Stop any existing playback first
    this.stop();

    const clean = this.cleanTextForSpeech(rawText);
    if (!clean) {
      return false;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = options?.rate || 1.0;
      utterance.pitch = options?.pitch || 1.0;
      utterance.lang = options?.lang || 'en-US';

      if (options?.voiceName) {
        const voices = window.speechSynthesis.getVoices();
        const matched = voices.find((v) => v.name === options.voiceName);
        if (matched) utterance.voice = matched;
      }

      this.activeMessageId = messageId;
      this.currentUtterance = utterance;
      this.isPausedState = false;

      utterance.onstart = () => {
        this.isPausedState = false;
        this.notify();
      };

      utterance.onend = () => {
        if (this.activeMessageId === messageId) {
          this.activeMessageId = null;
          this.currentUtterance = null;
          this.isPausedState = false;
          this.notify();
        }
      };

      utterance.onerror = (e) => {
        if (this.activeMessageId === messageId) {
          this.activeMessageId = null;
          this.currentUtterance = null;
          this.isPausedState = false;
          this.notify();
        }
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          options?.onError?.(e);
        }
      };

      window.speechSynthesis.speak(utterance);
      this.notify();
      return true;
    } catch (err) {
      this.activeMessageId = null;
      this.currentUtterance = null;
      this.isPausedState = false;
      this.notify();
      options?.onError?.(err);
      return false;
    }
  }

  /**
   * Toggles speech playback: starts if stopped, stops if playing.
   */
  public toggleReadAloud(
    messageId: string,
    rawText: string,
    options?: {
      rate?: number;
      pitch?: number;
      voiceName?: string;
      lang?: string;
      onError?: (err: any) => void;
    }
  ): void {
    if (this.activeMessageId === messageId && this.isPlaying(messageId)) {
      this.stop();
    } else {
      this.readAloud(messageId, rawText, options);
    }
  }

  /**
   * Stops current playback completely.
   */
  public stop(): void {
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.cancel();
    } catch (err) {
      console.warn('Speech cancel error:', err);
    }
    this.activeMessageId = null;
    this.currentUtterance = null;
    this.isPausedState = false;
    this.notify();
  }
}

export const speechService = new SpeechService();
