"use client";

import Link from "next/link";
import { usePomodoro } from "@/contexts/PomodoroContext";
import { formatMs, PHASE_LABEL } from "@/lib/pomodoro";
import { useHydrated } from "@/lib/storage";
import { buttonStyles, PageTitle } from "@/components/ui";
import { GearIcon } from "@/components/Icons";

const RADIUS = 120;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function PomodoroPage() {
  const { state, settings, remainingMs, totalMs, start, pause, reset, skip } = usePomodoro();
  const hydrated = useHydrated();

  const isWork = state.phase === "work";
  const progress = totalMs > 0 ? 1 - remainingMs / totalMs : 0;
  const running = state.status === "running";

  const statusText = {
    idle: "スタートを押すと始まります",
    running: isWork ? "集中して取り組みましょう" : "ひと休みしましょう",
    paused: "一時停止中",
  }[state.status];

  return (
    <div>
      <PageTitle
        action={
          <Link
            href="/pomodoro/settings"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted hover:bg-surface-muted hover:text-foreground"
          >
            <GearIcon className="size-4" />
            時間設定
          </Link>
        }
      >
        ポモドーロ
      </PageTitle>

      {/* フェーズ切り替え表示 */}
      <div className="mx-auto mb-5 flex w-fit rounded-full bg-surface-muted p-1 text-sm">
        {(["work", "break"] as const).map((p) => (
          <span
            key={p}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              state.phase === p
                ? `${p === "work" ? "bg-work" : "bg-break"} font-medium text-white`
                : "text-muted"
            }`}
          >
            {PHASE_LABEL[p]} {p === "work" ? settings.workMinutes : settings.breakMinutes}分
          </span>
        ))}
      </div>

      {/* 円形プログレス */}
      <div className="relative mx-auto aspect-square w-full max-w-[250px] sm:max-w-[300px]">
        <svg viewBox="0 0 280 280" className="size-full -rotate-90">
          <circle cx="140" cy="140" r={RADIUS} fill="none" strokeWidth="12" className="stroke-surface-muted" />
          <circle
            cx="140"
            cy="140"
            r={RADIUS}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            className={`${isWork ? "stroke-work" : "stroke-break"} transition-[stroke-dashoffset] duration-300 ease-linear`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-sm font-medium ${isWork ? "text-work" : "text-break"}`}>
            {PHASE_LABEL[state.phase]}
          </span>
          <span
            className="font-mono text-5xl font-semibold tabular-nums sm:text-7xl"
            aria-live="off"
          >
            {hydrated ? formatMs(remainingMs) : "--:--"}
          </span>
          <span className="mt-1 text-xs text-muted">{statusText}</span>
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="mt-6 flex flex-col gap-3 sm:mt-8">
        <button
          type="button"
          onClick={running ? pause : start}
          className={`rounded-2xl py-4 text-lg font-semibold text-white transition active:scale-[0.98] ${
            isWork ? "bg-work" : "bg-break"
          }`}
        >
          {running ? "一時停止" : state.status === "paused" ? "再開" : "スタート"}
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={reset}
            disabled={state.status === "idle" && state.phase === "work" && state.completedWork === 0}
            className={`${buttonStyles.secondary} disabled:opacity-40`}
          >
            リセット
          </button>
          <button type="button" onClick={skip} className={buttonStyles.secondary}>
            {isWork ? "休憩へ進む" : "作業へ進む"}
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        完了した作業: <span className="font-semibold text-foreground">{state.completedWork}</span> 回
      </p>
      <p className="mt-2 text-center text-xs text-muted">
        作業と休憩は自動で切り替わります。他のページに移動してもタイマーは動き続けます。
      </p>
    </div>
  );
}
