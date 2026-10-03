import { describe, expect, it } from "vitest";
import {
  advance,
  formatMs,
  getRemainingMs,
  INITIAL_POMODORO_STATE,
  pause,
  skip,
  start,
  type PomodoroSettings,
} from "./pomodoro";

const s: PomodoroSettings = { workMinutes: 25, breakMinutes: 5 };
const MIN = 60_000;

describe("pomodoro", () => {
  it("idle のときは設定値どおりの残り時間を返す", () => {
    expect(getRemainingMs(INITIAL_POMODORO_STATE, 0, s)).toBe(25 * MIN);
    expect(
      getRemainingMs(INITIAL_POMODORO_STATE, 0, { ...s, workMinutes: 50 }),
    ).toBe(50 * MIN);
  });

  it("開始→一時停止→再開で残り時間が保たれる", () => {
    let st = start(INITIAL_POMODORO_STATE, 0, s);
    expect(st.endAt).toBe(25 * MIN);
    st = pause(st, 10 * MIN, s);
    expect(st.status).toBe("paused");
    expect(getRemainingMs(st, 99 * MIN, s)).toBe(15 * MIN);
    st = start(st, 100 * MIN, s);
    expect(st.endAt).toBe(115 * MIN);
  });

  it("作業が終わると休憩が自動で始まる", () => {
    const st = start(INITIAL_POMODORO_STATE, 0, s);
    expect(advance(st, 25 * MIN - 1, s).transitions).toBe(0);
    const r = advance(st, 25 * MIN, s);
    expect(r.transitions).toBe(1);
    expect(r.state.phase).toBe("break");
    expect(r.state.status).toBe("running");
    expect(r.state.endAt).toBe(30 * MIN);
    expect(r.state.completedWork).toBe(1);
  });

  it("長時間止まっていても endAt 基準で正しく追いつく", () => {
    const st = start(INITIAL_POMODORO_STATE, 0, s);
    // 25+5+25 = 55分後 → 2回目の作業が終わって休憩中
    const r = advance(st, 56 * MIN, s);
    expect(r.transitions).toBe(3);
    expect(r.state.phase).toBe("break");
    expect(r.state.endAt).toBe(60 * MIN);
    expect(r.state.completedWork).toBe(2);
  });

  it("スキップは実行中なら次のフェーズを開始、停止中なら idle にする", () => {
    const running = skip(start(INITIAL_POMODORO_STATE, 0, s), 3 * MIN, s);
    expect(running).toMatchObject({ phase: "break", status: "running", endAt: 8 * MIN });
    const idle = skip(INITIAL_POMODORO_STATE, 0, s);
    expect(idle).toMatchObject({ phase: "break", status: "idle", endAt: null });
  });

  it("formatMs は秒を切り上げて mm:ss にする", () => {
    expect(formatMs(25 * MIN)).toBe("25:00");
    expect(formatMs(59_001)).toBe("01:00");
    expect(formatMs(0)).toBe("00:00");
  });
});
