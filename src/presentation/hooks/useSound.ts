"use client";

import { useCallback, useEffect, useState } from "react";
import { soundService } from "../../infrastructure/audio/soundService";

export type GameBgmStyle =
  | "adventure"
  | "battle"
  | "castle"
  | "tavern"
  | "tension";

/**
 * Hook to use game sounds
 */
export function useSound() {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [gameBgmStyle, setGameBgmStyleState] =
    useState<GameBgmStyle>("adventure");

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedEnabled = localStorage.getItem("sound_enabled");
    const savedVolume = localStorage.getItem("sound_volume");
    const savedBgm = localStorage.getItem("bgm_enabled");

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

    if (savedBgm !== null) {
      soundService.setBgmEnabled(savedBgm === "true");
    }

    const savedBgmStyle = localStorage.getItem("bgm_style");
    if (savedBgmStyle !== null) {
      const style = savedBgmStyle as GameBgmStyle;
      setGameBgmStyleState(style);
      soundService.setGameBgmStyle(style);
    }
  }, []);

  // Game sounds
  const playCardPlay = useCallback(() => soundService.play("cardPlay"), []);
  const playCardSelect = useCallback(() => soundService.play("cardSelect"), []);
  const playPass = useCallback(() => soundService.play("pass"), []);
  const playWin = useCallback(() => soundService.play("win"), []);
  const playLose = useCallback(() => soundService.play("lose"), []);
  const playTurnStart = useCallback(() => soundService.play("turnStart"), []);
  const playGameStart = useCallback(() => soundService.play("gameStart"), []);
  const playError = useCallback(() => soundService.play("error"), []);

  // Waiting room sounds
  const playPlayerJoin = useCallback(() => soundService.play("playerJoin"), []);
  const playPlayerReady = useCallback(
    () => soundService.play("playerReady"),
    []
  );
  const playCountdown = useCallback(() => soundService.play("countdown"), []);
  const playClick = useCallback(() => soundService.play("click"), []);

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

  // BGM controls
  const startBgm = useCallback((type: "waiting" | "game" = "waiting") => {
    soundService.startBgm(type);
    setBgmPlaying(true);
    localStorage.setItem("bgm_enabled", "true");
  }, []);

  const startGameBgm = useCallback(() => {
    soundService.startBgm("game");
    setBgmPlaying(true);
    localStorage.setItem("bgm_enabled", "true");
  }, []);

  const stopBgm = useCallback(() => {
    soundService.stopBgm();
    setBgmPlaying(false);
    localStorage.setItem("bgm_enabled", "false");
  }, []);

  const toggleBgm = useCallback((type?: "waiting" | "game") => {
    const isPlaying = soundService.toggleBgm(type);
    setBgmPlaying(isPlaying);
    localStorage.setItem("bgm_enabled", String(isPlaying));
    return isPlaying;
  }, []);

  const setGameBgmStyle = useCallback((style: GameBgmStyle) => {
    soundService.setGameBgmStyle(style);
    setGameBgmStyleState(style);
    localStorage.setItem("bgm_style", style);
  }, []);

  return {
    enabled,
    volume,
    bgmPlaying,
    gameBgmStyle,
    toggleSound,
    updateVolume,
    // Game sounds
    playCardPlay,
    playCardSelect,
    playPass,
    playWin,
    playLose,
    playTurnStart,
    playGameStart,
    playError,
    // Waiting room sounds
    playPlayerJoin,
    playPlayerReady,
    playCountdown,
    playClick,
    // BGM
    startBgm,
    startGameBgm,
    stopBgm,
    toggleBgm,
    setGameBgmStyle,
  };
}
