"use client";

import { useEffect, useState } from "react";
import { useSettings, type Theme } from "@/contexts/SettingsContext";
import {
  ensurePermission,
  getPermission,
  sendTestNotification,
  type PermissionState,
  type TestResult,
} from "@/lib/notify";
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
  denied: "ブロックされています",
  default: "まだ許可されていません",
  unsupported: "このブラウザは通知に対応していません",
};

export default function SettingsPage() {
  const hydrated = useHydrated();
  const { settings, updateSettings } = useSettings();
  const [permission, setPermission] = useState<PermissionState>("unsupported");
  // 「通知を許可する」を押しても確認画面が出なかったとき true
  const [promptBlocked, setPromptBlocked] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | "testing" | null>(null);

  // 許可状態はブラウザでしか分からないので、マウント後に読む。
  // アドレスバーから許可を変えた場合にも表示を更新する
  useEffect(() => {
    const sync = () => setPermission(getPermission());
    sync();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    let status: PermissionStatus | null = null;
    navigator.permissions
      ?.query({ name: "notifications" })
      .then((s) => {
        status = s;
        s.addEventListener("change", sync);
      })
      .catch(() => {});
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
      status?.removeEventListener("change", sync);
    };
  }, []);

  const requestPermission = async () => {
    // Chrome が確認画面をアドレスバーのアイコンだけにした場合、結果が返ってこないことがある。
    // 3秒たっても決まらなければ、手動で許可する手順を表示する
    const timer = window.setTimeout(() => setPromptBlocked(true), 3000);
    const result = await ensurePermission();
    window.clearTimeout(timer);
    setPermission(result);
    setPromptBlocked(result === "default");
  };

  const runTest = async () => {
    setTestResult("testing");
    setTestResult(await sendTestNotification());
  };

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
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">{PERMISSION_TEXT[permission]}</p>
            {permission === "default" && (
              <button
                type="button"
                onClick={requestPermission}
                className="shrink-0 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
              >
                通知を許可する
              </button>
            )}
            {permission === "granted" && (
              <button
                type="button"
                onClick={runTest}
                disabled={testResult === "testing"}
                className="shrink-0 rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface-muted disabled:opacity-50"
              >
                {testResult === "testing" ? "確認中…" : "テスト通知を送る"}
              </button>
            )}
          </div>
          {permission === "granted" && testResult && testResult !== "testing" && (
            <div
              className={`rounded-lg p-3 text-xs leading-relaxed ${
                testResult === "shown" ? "bg-break-soft text-foreground" : "bg-notice text-notice-fg"
              }`}
              role="status"
            >
              {testResult === "shown" ? (
                <>
                  <p className="font-medium">Chrome は通知を表示しました。</p>
                  <p className="mt-1">
                    画面の右下に通知が出なかった場合は、Windows 側で止められています。次を確認してください。
                  </p>
                  <ol className="mt-1.5 list-decimal space-y-0.5 pl-4">
                    <li>Windows の「設定 → システム → 通知」で「通知」がオンになっている</li>
                    <li>同じ画面の一覧で「Google Chrome」がオンになっている</li>
                    <li>「応答不可」（集中モード）がオフになっている</li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="font-medium">
                    {testResult === "error"
                      ? "Chrome が通知の表示に失敗しました。"
                      : testResult === "no-response"
                        ? "Chrome から反応がありませんでした。"
                        : "このブラウザでは通知を作成できませんでした。"}
                  </p>
                  <p className="mt-1">
                    Chrome のアドレスバーに「chrome://settings/content/notifications」と入力して開き、このサイトが「許可」に入っているか確認してください。そのあと Chrome を一度終了して開き直し、もう一度お試しください。
                  </p>
                </>
              )}
            </div>
          )}
          {(permission === "denied" || (permission === "default" && promptBlocked)) && (
            <div className="rounded-lg bg-notice p-3 text-xs leading-relaxed text-notice-fg" role="status">
              <p className="font-medium">
                {permission === "denied"
                  ? "通知がブロックされています。次の手順で許可してください。"
                  : "ブラウザが確認画面を表示しませんでした。次の手順で許可してください。"}
              </p>
              <ol className="mt-1.5 list-decimal space-y-0.5 pl-4">
                <li>アドレスバーの左端にあるアイコン（サイト情報）を押す</li>
                <li>「通知」の項目を「許可」に切り替える</li>
                <li>この画面に戻ると「許可されています」に変わります</li>
              </ol>
              <p className="mt-1.5">
                アドレスバーの右端に斜線付きのベルのアイコンが出ている場合は、そこを押して「許可」を選んでもかまいません。
              </p>
            </div>
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
