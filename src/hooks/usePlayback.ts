import { useState, useCallback, useEffect, useRef } from 'react';

export interface PlaybackState {
  currentStep: number;
  isPlaying: boolean;
  speed: number;
  totalSteps: number;
  next: () => void;
  prev: () => void;
  reset: () => void;
  goToEnd: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  setCurrentStep: (step: number) => void;
}

export function usePlayback(totalSteps: number): PlaybackState {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500); // ms per step
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Auto-advance when playing
  useEffect(() => {
    if (isPlaying && currentStep < totalSteps - 1) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else if (isPlaying && currentStep >= totalSteps - 1) {
      setIsPlaying(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, currentStep, totalSteps, speed]);

  // Reset when total steps changes (new input or algorithm)
  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [totalSteps]);

  const next = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const prev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const goToEnd = useCallback(() => {
    setCurrentStep(Math.max(0, totalSteps - 1));
    setIsPlaying(false);
  }, [totalSteps]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  return {
    currentStep,
    isPlaying,
    speed,
    totalSteps,
    next,
    prev,
    reset,
    goToEnd,
    togglePlay,
    setSpeed,
    setCurrentStep,
  };
}
