"use client";

import { useCallback, useEffect, useState } from "react";
import { soundService } from "../../infrastructure/audio/soundService";

/**
 * Hook to use game sounds
 */
export function useSound() {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedEnabled = localStorage.getItem("sound_enabled");
    const savedVolume = localStorage.getItem("sound_volume");

    if (savedEnabled !== null) {
      const isEnabled = savedEnabled === "true";
      setEnabled(isEnabled);
      soundService.setEnabled(isEnabled);
    }

    if (savedVolume !== null) {
      const vol = parseFloat(savedVolume);
      setVolume(vol);
      soundService.setVolume(vol);
    }
  }, []);

  const playCardPlay = useCallback(() => soundService.play("cardPlay"), []);
  const playCardSelect = useCallback(() => soundService.play("cardSelect"), []);
  const playPass = useCallback(() => soundService.play("pass"), []);
  const playWin = useCallback(() => soundService.play("win"), []);
  const playLose = useCallback(() => soundService.play("lose"), []);
  const playTurnStart = useCallback(() => soundService.play("turnStart"), []);
  const playGameStart = useCallback(() => soundService.play("gameStart"), []);
  const playError = useCallback(() => soundService.play("error"), []);

  const toggleSound = useCallback(() => {
    const newEnabled = !soundService.isEnabled();
    soundService.setEnabled(newEnabled);
    setEnabled(newEnabled);
    localStorage.setItem("sound_enabled", String(newEnabled));
  }, []);

  const updateVolume = useCallback((newVolume: number) => {
    soundService.setVolume(newVolume);
    setVolume(newVolume);
    localStorage.setItem("sound_volume", String(newVolume));
  }, []);

  return {
    enabled,
    volume,
    toggleSound,
    updateVolume,
    playCardPlay,
    playCardSelect,
    playPass,
    playWin,
    playLose,
    playTurnStart,
    playGameStart,
    playError,
  };
}
