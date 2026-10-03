"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { STORAGE_KEYS, readStore, useStoredState, writeStore } from "@/lib/storage";
import { ensurePermission, showNotification } from "@/lib/notify";
import {
  advance,
  DEFAULT_POMODORO_SETTINGS,
  formatMs,
  getRemainingMs,
  INITIAL_POMODORO_STATE,
  pause as pauseState,
  PHASE_LABEL,
  phaseDurationMs,
  reset as resetState,
  skip as skipState,
  start as startState,
  type PomodoroSettings,
  type PomodoroState,
} from "@/lib/pomodoro";
import { useSettings } from "./SettingsContext";

type PomodoroContextValue = {
  settings: PomodoroSettings;
  updateSettings: (s: PomodoroSettings) => void;
  state: PomodoroState;
  remainingMs: number;
  totalMs: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
};

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

const BASE_TITLE = "作業タイマー";

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const { playSound } = useSettings();
  const [settings, setSettings] = useStoredState(
    STORAGE_KEYS.pomodoroSettings,
    DEFAULT_POMODORO_SETTINGS,
  );
  const [state, setState] = useStoredState(
    STORAGE_KEYS.pomodoroState,
    INITIAL_POMODORO_STATE,
  );
  const [now, setNow] = useState(() => Date.now());

  // 実行中は定期的にチェックして、終了していれば次のフェーズへ自動で進める
  useEffect(() => {
    if (state.status !== "running") return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const current = readStore(STORAGE_KEYS.pomodoroState, INITIAL_POMODORO_STATE);
      const s = readStore(STORAGE_KEYS.pomodoroSettings, DEFAULT_POMODORO_SETTINGS);
      const { state: next, transitions } = advance(current, t, s);
      if (transitions === 0) return;
      writeStore(STORAGE_KEYS.pomodoroState, next);
      playSound();
      const msg =
        next.phase === "break"
          ? `作業おつかれさまでした。${s.breakMinutes}分の休憩を始めます。`
          : `休憩終了です。${s.workMinutes}分の作業を始めます。`;
      showNotification(`${PHASE_LABEL[next.phase]}の時間です`, msg);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [state.status, playSound]);

  const remainingMs = getRemainingMs(state, now, settings);
  const totalMs = phaseDurationMs(state.phase, settings);

  // タブのタイトルに残り時間を表示する
  useEffect(() => {
    document.title =
      state.status === "idle"
        ? BASE_TITLE
        : `${state.status === "paused" ? "⏸ " : ""}${formatMs(remainingMs)} ${PHASE_LABEL[state.phase]} | ${BASE_TITLE}`;
  }, [state.status, state.phase, remainingMs]);

  const start = useCallback(() => {
    void ensurePermission();
    const t = Date.now();
    setNow(t);
    setState((prev) => startState(prev, t, settings));
  }, [setState, settings]);

  const pause = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setState((prev) => pauseState(prev, t, settings));
  }, [setState, settings]);

  const reset = useCallback(() => setState(resetState()), [setState]);

  const skip = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setState((prev) => skipState(prev, t, settings));
  }, [setState, settings]);

  return (
    <PomodoroContext.Provider
      value={{
        settings,
        updateSettings: setSettings,
        state,
        remainingMs,
        totalMs,
        start,
        pause,
        reset,
        skip,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro must be used within PomodoroProvider");
  return ctx;
}
