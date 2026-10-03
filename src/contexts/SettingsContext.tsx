"use client";

import { createContext, useCallback, useContext, useEffect } from "react";
import { STORAGE_KEYS, useStoredState } from "@/lib/storage";
import { playBeep, unlockAudio } from "@/lib/sound";

export type Theme = "light" | "dark" | "system";

export type AppSettings = {
  soundEnabled: boolean;
  /** 0〜100 */
  volume: number;
  theme: Theme;
};

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  volume: 70,
  theme: "system",
};

type SettingsContextValue = {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  /** 設定に従って通知音を鳴らす */
  playSound: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useStoredState(
    STORAGE_KEYS.settings,
    DEFAULT_SETTINGS,
  );

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => setSettings((prev) => ({ ...prev, ...patch })),
    [setSettings],
  );

  const playSound = useCallback(() => {
    if (settings.soundEnabled) playBeep(settings.volume);
  }, [settings.soundEnabled, settings.volume]);

  // テーマを <html> の class に反映する（初回表示は layout のインラインスクリプトが担当）
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark =
        settings.theme === "dark" || (settings.theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [settings.theme]);

  // 自動再生制限を解除するため、最初のユーザー操作で AudioContext を有効にする
  useEffect(() => {
    const handler = () => unlockAudio();
    window.addEventListener("pointerdown", handler);
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, playSound }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
