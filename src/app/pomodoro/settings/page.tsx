"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePomodoro } from "@/contexts/PomodoroContext";
import { useHydrated } from "@/lib/storage";
import type { PomodoroSettings } from "@/lib/pomodoro";
import { buttonStyles, Card, PageTitle } from "@/components/ui";

const PRESETS: PomodoroSettings[] = [
  { workMinutes: 25, breakMinutes: 5 },
  { workMinutes: 50, breakMinutes: 10 },
  { workMinutes: 15, breakMinutes: 3 },
];

const LIMITS = {
  workMinutes: { min: 1, max: 180 },
  breakMinutes: { min: 1, max: 60 },
};

export default function PomodoroSettingsPage() {
  const hydrated = useHydrated();
  const { settings } = usePomodoro();

  return (
    <div>
      <PageTitle backHref="/pomodoro">ポモドーロの時間設定</PageTitle>
      {/* 保存値を読み込んでからフォームを初期化する */}
      {hydrated && <SettingsForm key={JSON.stringify(settings)} initial={settings} />}
    </div>
  );
}

function SettingsForm({ initial }: { initial: PomodoroSettings }) {
  const router = useRouter();
  const { updateSettings, state } = usePomodoro();
  const [values, setValues] = useState({
    workMinutes: String(initial.workMinutes),
    breakMinutes: String(initial.breakMinutes),
  });

  const parsed = {
    workMinutes: Number(values.workMinutes),
    breakMinutes: Number(values.breakMinutes),
  };
  const errors = (Object.keys(LIMITS) as (keyof typeof LIMITS)[]).filter((k) => {
    const v = parsed[k];
    return !Number.isInteger(v) || v < LIMITS[k].min || v > LIMITS[k].max;
  });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (errors.length > 0) return;
    updateSettings(parsed);
    router.push("/pomodoro");
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <Card className="divide-y divide-border">
        {(
          [
            ["workMinutes", "作業時間", "text-work"],
            ["breakMinutes", "休憩時間", "text-break"],
          ] as const
        ).map(([key, label, color]) => (
          <label key={key} className="flex items-center justify-between gap-4 p-4">
            <span className={`font-medium ${color}`}>{label}</span>
            <span className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={LIMITS[key].min}
                max={LIMITS[key].max}
                value={values[key]}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                aria-invalid={errors.includes(key)}
                className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-right font-mono text-lg tabular-nums aria-invalid:border-work"
              />
              <span className="text-muted">分</span>
            </span>
          </label>
        ))}
      </Card>
      {errors.length > 0 && (
        <p className="text-sm text-work" role="alert">
          作業時間は1〜180分、休憩時間は1〜60分の整数で入力してください。
        </p>
      )}

      <div>
        <p className="mb-2 text-sm text-muted">よく使う組み合わせ</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={`${p.workMinutes}-${p.breakMinutes}`}
              type="button"
              onClick={() =>
                setValues({
                  workMinutes: String(p.workMinutes),
                  breakMinutes: String(p.breakMinutes),
                })
              }
              className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm hover:bg-surface-muted"
            >
              {p.workMinutes}分 / {p.breakMinutes}分
            </button>
          ))}
        </div>
      </div>

      {state.status !== "idle" && (
        <p className="text-xs text-muted">
          ※ 進行中のタイマーの残り時間は変わりません。次のフェーズから新しい時間が使われます。
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => router.push("/pomodoro")} className={buttonStyles.secondary}>
          キャンセル
        </button>
        <button type="submit" disabled={errors.length > 0} className={buttonStyles.primary}>
          保存
        </button>
      </div>
    </form>
  );
}
