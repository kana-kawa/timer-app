"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAlarms, type AlarmInput } from "@/contexts/AlarmContext";
import { formatRepeat, WEEKDAY_LABELS } from "@/lib/alarm";
import { ensurePermission } from "@/lib/notify";
import { useHydrated } from "@/lib/storage";
import { buttonStyles, Card, PageTitle } from "@/components/ui";

// 月曜始まりで並べる
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const REPEAT_PRESETS: { label: string; days: number[] }[] = [
  { label: "1回のみ", days: [] },
  { label: "毎日", days: [0, 1, 2, 3, 4, 5, 6] },
  { label: "平日", days: [1, 2, 3, 4, 5] },
  { label: "週末", days: [0, 6] },
];

export default function AlarmSettingsPage() {
  return (
    <Suspense fallback={null}>
      <AlarmSettingsContent />
    </Suspense>
  );
}

function defaultTime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 5);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function AlarmSettingsContent() {
  const id = useSearchParams().get("id");
  const hydrated = useHydrated();
  const { alarms } = useAlarms();

  const editing = id ? alarms.find((a) => a.id === id) : undefined;
  const title = id ? "アラームを編集" : "アラームを作成";

  if (!hydrated) return <PageTitle backHref="/alarm">{title}</PageTitle>;

  if (id && !editing) {
    return (
      <div>
        <PageTitle backHref="/alarm">{title}</PageTitle>
        <Card className="p-6 text-center">
          <p className="text-muted">アラームが見つかりませんでした。</p>
          <Link href="/alarm" className="mt-3 inline-block text-sm font-medium underline underline-offset-4">
            一覧に戻る
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageTitle backHref="/alarm">{title}</PageTitle>
      <AlarmForm
        key={id ?? "new"}
        id={id}
        initial={
          editing ?? { time: defaultTime(), days: [], label: "", enabled: true }
        }
      />
    </div>
  );
}

function AlarmForm({ id, initial }: { id: string | null; initial: AlarmInput }) {
  const router = useRouter();
  const { addAlarm, updateAlarm, removeAlarm } = useAlarms();
  const [time, setTime] = useState(initial.time);
  const [days, setDays] = useState<number[]>(initial.days);
  const [label, setLabel] = useState(initial.label);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!time) return;
    void ensurePermission();
    // 保存したアラームは ON にする（編集時も、時刻を見直したなら鳴ってほしいはず）
    const input: AlarmInput = { time, days: [...days].sort(), label: label.trim(), enabled: true };
    if (id) updateAlarm(id, input);
    else addAlarm(input);
    router.push("/alarm");
  };

  const remove = () => {
    if (!id) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    removeAlarm(id);
    router.push("/alarm");
  };

  const sortedKey = [...days].sort().join(",");

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <Card className="p-5">
        <label className="flex justify-center">
          <span className="sr-only">時刻</span>
          <input
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="bg-transparent font-mono text-5xl font-semibold tabular-nums outline-none"
          />
        </label>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="font-medium">繰り返し</span>
          <span className="text-sm text-muted">{formatRepeat(days)}</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEK_ORDER.map((d) => {
            const on = days.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                aria-pressed={on}
                className={`aspect-square rounded-full text-sm font-medium transition-colors ${
                  on
                    ? "bg-foreground text-background"
                    : `bg-surface-muted ${d === 0 ? "text-work" : d === 6 ? "text-sky-600 dark:text-sky-400" : ""}`
                }`}
              >
                {WEEKDAY_LABELS[d]}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {REPEAT_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setDays(p.days)}
              className={`rounded-full border px-3 py-1 text-xs ${
                p.days.join(",") === sortedKey
                  ? "border-foreground font-medium"
                  : "border-border text-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          曜日を選ばない場合は1回だけ鳴り、鳴ったあと自動でOFFになります。
        </p>
      </Card>

      <Card className="p-4">
        <label className="flex items-center gap-3">
          <span className="shrink-0 font-medium">ラベル</span>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={40}
            placeholder="例: 会議の準備"
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => router.push("/alarm")} className={buttonStyles.secondary}>
          キャンセル
        </button>
        <button type="submit" className={buttonStyles.primary}>
          保存
        </button>
      </div>

      {id && (
        <button type="button" onClick={remove} className={buttonStyles.danger}>
          {confirmDelete ? "もう一度押すと削除します" : "このアラームを削除"}
        </button>
      )}
    </form>
  );
}
