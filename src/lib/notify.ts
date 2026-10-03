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

export type TestResult = "shown" | "error" | "no-response" | "not-granted" | "exception";

/**
 * テスト通知を1件出し、ブラウザがどう反応したかを返す。
 * "shown" なのに画面に出ない場合は OS 側（Windowsの通知設定など）が原因と分かる。
 */
export function sendTestNotification(): Promise<TestResult> {
  if (getPermission() !== "granted") return Promise.resolve("not-granted");
  return new Promise((resolve) => {
    try {
      const n = new Notification("作業タイマー（テスト）", {
        body: "この通知が見えていれば、通知は正しく届いています。",
        tag: "timer-app-test",
      });
      const timer = window.setTimeout(() => resolve("no-response"), 4000);
      n.onshow = () => {
        window.clearTimeout(timer);
        resolve("shown");
      };
      n.onerror = () => {
        window.clearTimeout(timer);
        resolve("error");
      };
    } catch {
      resolve("exception");
    }
  });
}

export function showNotification(title: string, body: string) {
  if (getPermission() !== "granted") return;
  try {
    // tag は付けない。同じ tag の通知が通知センターに残っていると、
    // 新しい通知がポップアップせず静かに置き換わってしまうため
    const n = new Notification(title, { body });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // 一部のモバイルブラウザは new Notification() に対応していない
  }
}
