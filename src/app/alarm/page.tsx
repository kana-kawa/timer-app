"use client";

import Link from "next/link";
import { useAlarms } from "@/contexts/AlarmContext";
import { formatRepeat } from "@/lib/alarm";
import { useHydrated } from "@/lib/storage";
import { Card, PageTitle, Toggle } from "@/components/ui";
import { AlarmIcon, ChevronRightIcon, PlusIcon } from "@/components/Icons";

export default function AlarmListPage() {
  const { alarms, toggleAlarm } = useAlarms();
  const hydrated = useHydrated();

  return (
    <div>
      <PageTitle
        action={
          <Link
            href="/alarm/settings"
            className="flex items-center gap-1 rounded-xl bg-foreground px-3.5 py-2 text-sm font-semibold text-background active:scale-[0.98]"
          >
            <PlusIcon className="size-4" />
            新規作成
          </Link>
        }
      >
        アラーム
      </PageTitle>

      {!hydrated ? null : alarms.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <AlarmIcon className="size-10 text-muted" />
          <p className="text-muted">アラームはまだありません</p>
          <Link href="/alarm/settings" className="text-sm font-medium underline underline-offset-4">
            最初のアラームを作成する
          </Link>
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {alarms.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-4">
              <Link
                href={`/alarm/settings?id=${a.id}`}
                className={`flex min-w-0 flex-1 items-center gap-3 ${a.enabled ? "" : "opacity-50"}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-3xl font-semibold tabular-nums">{a.time}</p>
                  <p className="truncate text-sm text-muted">
                    {formatRepeat(a.days)}
                    {a.label && ` ・ ${a.label}`}
                  </p>
                </div>
                <ChevronRightIcon className="size-4 shrink-0 text-muted" />
              </Link>
              <Toggle
                checked={a.enabled}
                onChange={() => toggleAlarm(a.id)}
                label={`${a.time} のアラームを${a.enabled ? "OFF" : "ON"}にする`}
              />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
