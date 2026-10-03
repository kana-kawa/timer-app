// localStorage のキー（サーバーコンポーネントからも参照するため独立させている）
export const STORAGE_KEYS = {
  settings: "timer:settings",
  pomodoroSettings: "timer:pomodoro-settings",
  pomodoroState: "timer:pomodoro-state",
  alarms: "timer:alarms",
} as const;
