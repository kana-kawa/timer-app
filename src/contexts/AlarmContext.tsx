"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { STORAGE_KEYS, readStore, useStoredState, writeStore } from "@/lib/storage";
import { showNotification } from "@/lib/notify";
import { findFiringMinute, type Alarm } from "@/lib/alarm";
import { useSettings } from "./SettingsContext";

export type AlarmInput = Pick<Alarm, "time" | "days" | "label" | "enabled">;

type AlarmContextValue = {
  alarms: Alarm[];
  addAlarm: (input: AlarmInput) => void;
  updateAlarm: (id: string, input: AlarmInput) => void;
  removeAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  /** 鳴っている最中のアラーム */
  ringing: Alarm | null;
  stopRinging: () => void;
};

const NO_ALARMS: Alarm[] = [];
/** 停止しなかった場合に鳴らし続ける最大時間 */
const RING_DURATION_MS = 60_000;
const RING_INTERVAL_MS = 1_500;

const AlarmContext = createContext<AlarmContextValue | null>(null);

function sortByTime(list: Alarm[]) {
  return [...list].sort((a, b) => a.time.localeCompare(b.time));
}

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const { playSound } = useSettings();
  const [alarms, setAlarms] = useStoredState(STORAGE_KEYS.alarms, NO_ALARMS);
  const [ringing, setRinging] = useState<Alarm | null>(null);
  const lastCheck = useRef<Date | null>(null);

  // 1秒ごとに鳴らすべきアラームがないか確認する
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const from = lastCheck.current ?? now;
      lastCheck.current = now;

      const list = readStore(STORAGE_KEYS.alarms, NO_ALARMS);
      const firedIds = new Set<string>();
      const updated = list.map((a) => {
        const key = findFiringMinute(a, from, now);
        if (!key) return a;
        firedIds.add(a.id);
        // 1回のみのアラームは鳴ったら OFF にする
        return { ...a, lastFiredKey: key, enabled: a.days.length > 0 };
      });
      const alarm = updated.find((a) => firedIds.has(a.id));
      if (!alarm) return;
      writeStore(STORAGE_KEYS.alarms, updated);
      setRinging(alarm);
      showNotification(
        `⏰ アラーム ${alarm.time}`,
        alarm.label || "設定した時刻になりました",
      );
    };
    check();
    const id = window.setInterval(check, 1000);
    return () => window.clearInterval(id);
  }, []);

  // 鳴っている間は、停止するか最大時間が過ぎるまで音を繰り返す
  useEffect(() => {
    if (!ringing) return;
    playSound();
    const interval = window.setInterval(playSound, RING_INTERVAL_MS);
    const timeout = window.setTimeout(() => window.clearInterval(interval), RING_DURATION_MS);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [ringing, playSound]);

  const addAlarm = useCallback(
    (input: AlarmInput) =>
      setAlarms((prev) =>
        sortByTime([...prev, { ...input, id: crypto.randomUUID(), lastFiredKey: null }]),
      ),
    [setAlarms],
  );

  const updateAlarm = useCallback(
    (id: string, input: AlarmInput) =>
      setAlarms((prev) =>
        sortByTime(
          prev.map((a) =>
            a.id === id
              ? { ...a, ...input, lastFiredKey: a.time === input.time ? a.lastFiredKey : null }
              : a,
          ),
        ),
      ),
    [setAlarms],
  );

  const removeAlarm = useCallback(
    (id: string) => setAlarms((prev) => prev.filter((a) => a.id !== id)),
    [setAlarms],
  );

  const toggleAlarm = useCallback(
    (id: string) =>
      setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))),
    [setAlarms],
  );

  const stopRinging = useCallback(() => setRinging(null), []);

  return (
    <AlarmContext.Provider
      value={{ alarms, addAlarm, updateAlarm, removeAlarm, toggleAlarm, ringing, stopRinging }}
    >
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarms() {
  const ctx = useContext(AlarmContext);
  if (!ctx) throw new Error("useAlarms must be used within AlarmProvider");
  return ctx;
}
