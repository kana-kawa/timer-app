import { describe, expect, it } from "vitest";
import {
  findFiringMinute,
  formatNext,
  formatRepeat,
  nextOccurrence,
  type Alarm,
} from "./alarm";

const base: Alarm = {
  id: "a",
  time: "07:30",
  days: [],
  label: "",
  enabled: true,
  lastFiredKey: null,
};

// 2026-10-05 は月曜日
const at = (d: string) => new Date(d);

describe("findFiringMinute", () => {
  it("時刻が一致した分に鳴る", () => {
    expect(
      findFiringMinute(base, at("2026-10-05T07:29:59"), at("2026-10-05T07:30:01")),
    ).toBe("2026-10-05 07:30");
  });

  it("OFFなら鳴らない", () => {
    expect(
      findFiringMinute({ ...base, enabled: false }, at("2026-10-05T07:30:00"), at("2026-10-05T07:30:01")),
    ).toBeNull();
  });

  it("同じ分に二重に鳴らない", () => {
    const fired = { ...base, lastFiredKey: "2026-10-05 07:30" };
    expect(
      findFiringMinute(fired, at("2026-10-05T07:30:01"), at("2026-10-05T07:30:02")),
    ).toBeNull();
  });

  it("曜日が一致しなければ鳴らない", () => {
    const weekend = { ...base, days: [0, 6] };
    expect(
      findFiringMinute(weekend, at("2026-10-05T07:30:00"), at("2026-10-05T07:30:01")),
    ).toBeNull();
    expect(
      findFiringMinute(weekend, at("2026-10-04T07:30:00"), at("2026-10-04T07:30:01")),
    ).toBe("2026-10-04 07:30");
  });

  it("タブが止まって分をまたいでも取りこぼさない", () => {
    expect(
      findFiringMinute(base, at("2026-10-05T07:29:10"), at("2026-10-05T07:32:10")),
    ).toBe("2026-10-05 07:30");
  });

  it("前回チェックより前の時刻では鳴らない", () => {
    expect(
      findFiringMinute(base, at("2026-10-05T07:31:00"), at("2026-10-05T07:31:01")),
    ).toBeNull();
  });
});

describe("nextOccurrence", () => {
  it("今日まだなら今日、過ぎていれば明日", () => {
    expect(nextOccurrence(base, at("2026-10-05T07:00:00"))).toEqual(at("2026-10-05T07:30:00"));
    expect(nextOccurrence(base, at("2026-10-05T08:00:00"))).toEqual(at("2026-10-06T07:30:00"));
  });

  it("曜日指定なら次の該当曜日", () => {
    const sat = { ...base, days: [6] };
    expect(nextOccurrence(sat, at("2026-10-05T08:00:00"))).toEqual(at("2026-10-10T07:30:00"));
  });

  it("OFFなら null", () => {
    expect(nextOccurrence({ ...base, enabled: false }, at("2026-10-05T07:00:00"))).toBeNull();
  });
});

describe("format", () => {
  it("繰り返しの表示", () => {
    expect(formatRepeat([])).toBe("1回のみ");
    expect(formatRepeat([0, 1, 2, 3, 4, 5, 6])).toBe("毎日");
    expect(formatRepeat([5, 1, 2, 3, 4])).toBe("平日");
    expect(formatRepeat([6, 0])).toBe("週末");
    expect(formatRepeat([0, 1, 3])).toBe("月・水・日");
  });

  it("次回の表示", () => {
    const now = at("2026-10-05T08:00:00");
    expect(formatNext(at("2026-10-05T09:05:00"), now)).toBe("今日 09:05");
    expect(formatNext(at("2026-10-06T07:30:00"), now)).toBe("明日 07:30");
    expect(formatNext(at("2026-10-10T07:30:00"), now)).toBe("10/10（土） 07:30");
  });
});
