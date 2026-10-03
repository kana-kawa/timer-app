// アラームの判定ロジック（純粋関数）

export type Alarm = {
  id: string;
  /** "HH:MM"（24時間表記） */
  time: string;
  /** 繰り返す曜日（0=日〜6=土）。空なら1回のみ */
  days: number[];
  label: string;
  enabled: boolean;
  /** 最後に鳴った分（"YYYY-MM-DD HH:MM"）。同じ分に二重に鳴らないために使う */
  lastFiredKey: string | null;
};

export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const pad = (n: number) => String(n).padStart(2, "0");

export function minuteKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function matchesMinute(alarm: Alarm, d: Date) {
  const [h, m] = alarm.time.split(":").map(Number);
  if (d.getHours() !== h || d.getMinutes() !== m) return false;
  return alarm.days.length === 0 || alarm.days.includes(d.getDay());
}

/** タブが一時的に止まって分をまたいでも取りこぼさないよう、遡って確認する最大分数 */
const MAX_LOOKBACK_MINUTES = 5;

/**
 * 前回のチェック（from）から今回（to）までの間に鳴らすべき分があれば、その分のキーを返す。
 */
export function findFiringMinute(
  alarm: Alarm,
  from: Date,
  to: Date,
): string | null {
  if (!alarm.enabled) return null;
  const cursor = new Date(to);
  cursor.setSeconds(0, 0);
  const floor = new Date(from);
  floor.setSeconds(0, 0);
  for (let i = 0; i <= MAX_LOOKBACK_MINUTES && cursor >= floor; i++) {
    if (matchesMinute(alarm, cursor)) {
      const key = minuteKey(cursor);
      return key === alarm.lastFiredKey ? null : key;
    }
    cursor.setMinutes(cursor.getMinutes() - 1);
  }
  return null;
}

/** 次に鳴る日時（ONでなければ null） */
export function nextOccurrence(alarm: Alarm, now: Date): Date | null {
  if (!alarm.enabled) return null;
  const [h, m] = alarm.time.split(":").map(Number);
  const currentMinute = new Date(now);
  currentMinute.setSeconds(0, 0);
  for (let offset = 0; offset <= 7; offset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    d.setHours(h, m, 0, 0);
    // 過ぎた時刻、または今の分ですでに鳴ったものは対象外
    if (d < currentMinute || minuteKey(d) === alarm.lastFiredKey) continue;
    if (alarm.days.length === 0 || alarm.days.includes(d.getDay())) return d;
  }
  return null;
}

export function formatRepeat(days: number[]) {
  const sorted = [...days].sort((a, b) => a - b);
  const key = sorted.join(",");
  if (sorted.length === 0) return "1回のみ";
  if (sorted.length === 7) return "毎日";
  if (key === "1,2,3,4,5") return "平日";
  if (key === "0,6") return "週末";
  // 月曜始まりで表示する
  return [...sorted.filter((d) => d !== 0), ...sorted.filter((d) => d === 0)]
    .map((d) => WEEKDAY_LABELS[d])
    .join("・");
}

export function formatNext(d: Date, now: Date) {
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(d) - startOfDay(now)) / 86_400_000);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (diffDays === 0) return `今日 ${time}`;
  if (diffDays === 1) return `明日 ${time}`;
  return `${d.getMonth() + 1}/${d.getDate()}（${WEEKDAY_LABELS[d.getDay()]}） ${time}`;
}
