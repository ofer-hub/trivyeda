import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  duration: number; // שניות
  onComplete?: () => void;
  autoStart?: boolean;
}

export function useTimer({ duration, onComplete, autoStart = true }: UseTimerOptions) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setTimeLeft(duration);
    startTimeRef.current = Date.now();
  }, [stop, duration]);

  const start = useCallback(() => {
    setTimeLeft(duration);
    startTimeRef.current = Date.now();
    setIsRunning(true);
  }, [duration]);

  useEffect(() => {
    if (!isRunning) return;

    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        stop();
        onCompleteRef.current?.();
      }
    }, 200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, duration, stop]);

  const progress = timeLeft / duration; // 1 = מלא, 0 = ריק

  return {
    timeLeft,
    progress,
    isRunning,
    start,
    stop,
    reset,
    startTimestamp: startTimeRef.current,
  };
}
