"use client";

import { SettingsProvider } from "@/contexts/SettingsContext";
import { PomodoroProvider } from "@/contexts/PomodoroContext";
import { AlarmProvider } from "@/contexts/AlarmContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <PomodoroProvider>
        <AlarmProvider>{children}</AlarmProvider>
      </PomodoroProvider>
    </SettingsProvider>
  );
}
