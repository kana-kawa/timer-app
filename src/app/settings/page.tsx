"use client";

import { useEffect, useState } from "react";
import { useSettings, type Theme } from "@/contexts/SettingsContext";
import { ensurePermission, getPermission, type PermissionState } from "@/lib/notify";
import { playBeep } from "@/lib/sound";
import { useHydrated } from "@/lib/storage";
import { Card, PageTitle, Toggle } from "@/components/ui";

const THEMES: { value: Theme; label: string }[] = [
  { value: "light", label: "ライト" },
  { value: "dark", label: "ダーク" },
  { value: "system", label: "自動" },
];

const PERMISSION_TEXT: Record<PermissionState, string> = {
  granted: "許可されています",
  denied: "ブロックされています（ブラウザのサイト設定から許可してください）",
  default: "まだ許可されていません",
  unsupported: "このブラウザは通知に対応していません",
};

export default function SettingsPage() {
  const hydrated = useHydrated();
  const { settings, updateSettings } = useSettings();
  const [permission, setPermission] = useState<PermissionState>("unsupported");

  // 許可状態はブラウザでしか分からないので、マウント後に読む
  useEffect(() => {
    const sync = () => setPermission(getPermission());
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  if (!hydrated) return <PageTitle>設定</PageTitle>;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>設定</PageTitle>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted">通知音</h2>
        <Card className="divide-y divide-border">
          <div className="flex items-center justify-between gap-4 p-4">
            <span>通知音を鳴らす</span>
            <Toggle
              checked={settings.soundEnabled}
              onChange={(v) => updateSettings({ soundEnabled: v })}
              label="通知音を鳴らす"
            />
          </div>
          <div className={`p-4 ${settings.soundEnabled ? "" : "pointer-events-none opacity-40"}`}>
            <div className="mb-3 flex items-center justify-between">
              <label htmlFor="volume">音量</label>
              <span className="font-mono text-sm tabular-nums text-muted">{settings.volume}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="volume"
                type="range"
                min={0}
                max={100}
                step={5}
                value={settings.volume}
                onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
                className="flex-1 accent-break"
              />
              <button
                type="button"
                onClick={() => playBeep(settings.volume)}
                className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"
              >
                試聴
              </button>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted">ブラウザ通知</h2>
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">{PERMISSION_TEXT[permission]}</p>
          {permission === "default" && (
            <button
              type="button"
              onClick={async () => setPermission(await ensurePermission())}
              className="shrink-0 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
            >
              通知を許可する
            </button>
          )}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted">テーマ</h2>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-muted p-1" role="radiogroup" aria-label="テーマ">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={settings.theme === t.value}
              onClick={() => updateSettings({ theme: t.value })}
              className={`rounded-lg px-2 py-2 text-sm transition-colors ${
                settings.theme === t.value ? "bg-surface font-medium shadow-sm" : "text-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
