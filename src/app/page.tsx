"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePomodoro } from "@/contexts/PomodoroContext";
import { useAlarms } from "@/contexts/AlarmContext";
import { formatMs, PHASE_LABEL } from "@/lib/pomodoro";
import { formatNext, nextOccurrence } from "@/lib/alarm";
import { useHydrated } from "@/lib/storage";
import { Card } from "@/components/ui";
import { AlarmIcon, ChevronRightIcon, GearIcon, TimerIcon } from "@/components/Icons";

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export default function Home() {
  const hydrated = useHydrated();
  const { state, remainingMs } = usePomodoro();
  const { alarms } = useAlarms();
  const now = useNow(15_000);

  const upcoming = alarms
    .map((a) => nextOccurrence(a, now))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const enabledCount = alarms.filter((a) => a.enabled).length;

  const pomodoroStatus =
    state.status === "idle"
      ? "停止中"
      : `${PHASE_LABEL[state.phase]}${state.status === "paused" ? "（一時停止）" : "中"} ・ 残り ${formatMs(remainingMs)}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold">作業タイマー</h1>
        <p className="mt-1 text-sm text-muted">ポモドーロとアラームで、作業時間を区切りましょう。</p>
      </div>

      <Link href="/pomodoro" className="group">
        <Card className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5 transition-colors group-hover:bg-surface-muted">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-12 bg-work-soft text-work">
            <TimerIcon className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">ポモドーロタイマー</p>
            <p className="text-sm text-muted">{hydrated ? pomodoroStatus : " "}</p>
          </div>
          <ChevronRightIcon className="size-5 shrink-0 text-muted" />
        </Card>
      </Link>

      <Link href="/alarm" className="group">
        <Card className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5 transition-colors group-hover:bg-surface-muted">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-12 bg-break-soft text-break">
            <AlarmIcon className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-semibold">
              アラーム
              {hydrated && enabledCount > 0 && (
                <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-normal text-muted">
                  {enabledCount}件ON
                </span>
              )}
            </p>
            <p className="text-sm text-muted">
              {!hydrated
                ? " "
                : upcoming
                  ? `次のアラーム: ${formatNext(upcoming, now)}`
                  : alarms.length === 0
                    ? "アラームは登録されていません"
                    : `ONのアラームはありません（${alarms.length}件登録）`}
            </p>
          </div>
          <ChevronRightIcon className="size-5 shrink-0 text-muted" />
        </Card>
      </Link>

      <Link href="/settings" className="group">
        <Card className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5 transition-colors group-hover:bg-surface-muted">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-12 bg-surface-muted text-muted">
            <GearIcon className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">設定</p>
            <p className="text-sm text-muted">通知音・音量・テーマ</p>
          </div>
          <ChevronRightIcon className="size-5 shrink-0 text-muted" />
        </Card>
      </Link>
    </div>
  );
}
