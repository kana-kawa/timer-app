"use client";

import { useEffect, useRef } from "react";
import { useAlarms } from "@/contexts/AlarmContext";
import { AlarmIcon } from "./Icons";

export function AlarmRingingDialog() {
  const { ringing, stopRinging } = useAlarms();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (ringing) buttonRef.current?.focus();
  }, [ringing]);

  if (!ringing) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="ringing-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center shadow-xl">
        <AlarmIcon className="mx-auto size-12 animate-bounce text-work" />
        <p id="ringing-title" className="mt-3 font-mono text-5xl font-semibold tabular-nums">
          {ringing.time}
        </p>
        <p className="mt-2 text-muted">{ringing.label || "設定した時刻になりました"}</p>
        <button
          ref={buttonRef}
          type="button"
          onClick={stopRinging}
          className="mt-6 w-full rounded-xl bg-work py-3.5 text-lg font-semibold text-white active:scale-[0.98]"
        >
          停止
        </button>
      </div>
    </div>
  );
}
