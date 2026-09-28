import { useState, useEffect, useRef } from 'react';

interface UseTypewriterStreamOptions {
  text: string;
  isStreaming: boolean;
  onTypingComplete?: () => void;
  onTextIncrement?: () => void;
}

export function useTypewriterStream({
  text,
  isStreaming,
  onTypingComplete,
  onTextIncrement,
}: UseTypewriterStreamOptions) {
  const [displayedText, setDisplayedText] = useState<string>(() => {
    // If not actively streaming on initial mount, display full text directly
    return !isStreaming ? text : '';
  });

  const [isTyping, setIsTyping] = useState<boolean>(isStreaming);
  const targetTextRef = useRef<string>(text);
  const displayedTextRef = useRef<string>(displayedText);
  const isStreamingRef = useRef<boolean>(isStreaming);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(performance.now());
  const onTypingCompleteRef = useRef(onTypingComplete);
  const onTextIncrementRef = useRef(onTextIncrement);

  onTypingCompleteRef.current = onTypingComplete;
  onTextIncrementRef.current = onTextIncrement;
  targetTextRef.current = text;
  isStreamingRef.current = isStreaming;

  useEffect(() => {
    // If the message is not streaming and never was, show immediately
    if (!isStreaming && displayedTextRef.current.length === 0 && text.length > 0) {
      setDisplayedText(text);
      displayedTextRef.current = text;
      setIsTyping(false);
      return;
    }

    if (isStreaming) {
      setIsTyping(true);
    }
  }, [isStreaming, text]);

  useEffect(() => {
    let active = true;

    const tick = (currentTime: number) => {
      if (!active) return;

      const elapsed = currentTime - lastTickTimeRef.current;
      const target = targetTextRef.current;
      const current = displayedTextRef.current;
      const lag = target.length - current.length;

      // Frame interval threshold (around ~16-20ms for smooth 50-60fps updates)
      if (elapsed >= 14) {
        lastTickTimeRef.current = currentTime;

        if (lag > 0) {
          // Dynamic adaptive step size based on lag distance:
          // Small backlog -> 1 to 2 chars per frame (natural typing cadence)
          // Medium backlog -> 3 to 6 chars per frame
          // Large backlog -> catch up smoothly without blocking
          let step = 1;
          if (lag > 120) {
            step = Math.ceil(lag / 8);
          } else if (lag > 60) {
            step = 6;
          } else if (lag > 25) {
            step = 3;
          } else if (lag > 8) {
            step = 2;
          } else {
            step = 1;
          }

          const nextText = target.slice(0, current.length + step);
          displayedTextRef.current = nextText;
          setDisplayedText(nextText);
          onTextIncrementRef.current?.();
        } else if (!isStreamingRef.current && lag === 0) {
          // Streaming finished AND typing caught up with full text
          setIsTyping(false);
          onTypingCompleteRef.current?.();
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    displayedText,
    isTyping,
  };
}
