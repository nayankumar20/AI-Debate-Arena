import { useEffect, useRef, useState } from 'react';

/**
 * Character-chunk "streaming" reveal for text already received from the server.
 * Keeps the sequential API contract unchanged while improving live-debate feel.
 */
export function useRevealText(fullText: string, active: boolean, onComplete?: () => void, onProgress?: (slice: string) => void) {
  const [shown, setShown] = useState(() => (active ? '' : fullText));
  const timerRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!active) {
      setShown(fullText);
      return;
    }

    setShown('');
    let i = 0;
    const full = fullText;

    const step = () => {
      const chunk = 3 + Math.floor(Math.random() * 7);
      i = Math.min(full.length, i + chunk);
      setShown(full.slice(0, i));
      onProgressRef.current?.(full.slice(0, i));
      if (i >= full.length) {
        onCompleteRef.current?.();
        return;
      }
      timerRef.current = window.setTimeout(step, 16 + Math.random() * 28);
    };

    step();

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fullText, active, onComplete, onProgress]);

  return shown;
}
