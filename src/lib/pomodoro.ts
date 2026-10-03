// ポモドーロタイマーの状態遷移（純粋関数）

export type Phase = "work" | "break";
export type TimerStatus = "idle" | "running" | "paused";

export type PomodoroSettings = {
  workMinutes: number;
  breakMinutes: number;
};

export type PomodoroState = {
  phase: Phase;
  status: TimerStatus;
  /** 実行中のみ: フェーズが終わる時刻（ms） */
  endAt: number | null;
  /** 一時停止中のみ: 残り時間（ms） */
  remainingMs: number;
  /** 完了した作業セッション数（リセットで0に戻る） */
  completedWork: number;
};

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  breakMinutes: 5,
};

export const INITIAL_POMODORO_STATE: PomodoroState = {
  phase: "work",
  status: "idle",
  endAt: null,
  remainingMs: 0,
  completedWork: 0,
};

export const PHASE_LABEL: Record<Phase, string> = {
  work: "作業",
  break: "休憩",
};

export function phaseDurationMs(phase: Phase, s: PomodoroSettings) {
  return (phase === "work" ? s.workMinutes : s.breakMinutes) * 60_000;
}

export function getRemainingMs(
  state: PomodoroState,
  now: number,
  s: PomodoroSettings,
) {
  switch (state.status) {
    case "running":
      return Math.max(0, (state.endAt ?? now) - now);
    case "paused":
      return state.remainingMs;
    case "idle":
      return phaseDurationMs(state.phase, s);
  }
}

export function start(
  state: PomodoroState,
  now: number,
  s: PomodoroSettings,
): PomodoroState {
  if (state.status === "running") return state;
  return {
    ...state,
    status: "running",
    endAt: now + getRemainingMs(state, now, s),
  };
}

export function pause(
  state: PomodoroState,
  now: number,
  s: PomodoroSettings,
): PomodoroState {
  if (state.status !== "running") return state;
  return {
    ...state,
    status: "paused",
    endAt: null,
    remainingMs: getRemainingMs(state, now, s),
  };
}

export function reset(): PomodoroState {
  return INITIAL_POMODORO_STATE;
}

function nextPhase(phase: Phase): Phase {
  return phase === "work" ? "break" : "work";
}

/** 現在のフェーズを飛ばして次へ。実行中なら次のフェーズをそのまま開始する */
export function skip(
  state: PomodoroState,
  now: number,
  s: PomodoroSettings,
): PomodoroState {
  const phase = nextPhase(state.phase);
  const running = state.status === "running";
  return {
    ...state,
    phase,
    status: running ? "running" : "idle",
    endAt: running ? now + phaseDurationMs(phase, s) : null,
    remainingMs: 0,
  };
}

/**
 * 実行中に終了時刻を過ぎていたら、次のフェーズへ自動で進める。
 * タブが長時間止まっていた場合も、endAt を基準に何回分でも正しく進める。
 * transitions は切り替わった回数（0なら変化なし）。
 */
export function advance(
  state: PomodoroState,
  now: number,
  s: PomodoroSettings,
): { state: PomodoroState; transitions: number } {
  if (state.status !== "running" || state.endAt === null) {
    return { state, transitions: 0 };
  }
  let { phase, endAt, completedWork } = state;
  let transitions = 0;
  // 設定値が不正でも無限ループにならないよう上限を設ける
  while (endAt <= now && transitions < 1000) {
    if (phase === "work") completedWork++;
    phase = nextPhase(phase);
    endAt += Math.max(60_000, phaseDurationMs(phase, s));
    transitions++;
  }
  if (transitions === 0) return { state, transitions };
  return { state: { ...state, phase, endAt, completedWork }, transitions };
}

export function formatMs(ms: number) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
