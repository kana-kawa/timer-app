// Web Notification API の薄いラッパー

export type PermissionState = NotificationPermission | "unsupported";

export function getPermission(): PermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/** 未確認（default）の場合のみ許可をリクエストする。ユーザー操作の中で呼ぶこと */
export async function ensurePermission(): Promise<PermissionState> {
  const current = getPermission();
  if (current !== "default") return current;
  try {
    return await Notification.requestPermission();
  } catch {
    return getPermission();
  }
}

export function showNotification(title: string, body: string) {
  if (getPermission() !== "granted") return;
  try {
    const n = new Notification(title, { body, tag: "timer-app" });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // 一部のモバイルブラウザは new Notification() に対応していない
  }
}
