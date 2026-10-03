"use client";

import { useCallback, useSyncExternalStore } from "react";

// localStorage を小さな外部ストアとして扱う。
// useSyncExternalStore で読むことで、SSR時はフォールバック値、
// クライアントでは保存値を使い、ハイドレーションの不一致を防ぐ。

export { STORAGE_KEYS } from "./keys";

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function notify(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

if (typeof window !== "undefined") {
  // 別タブでの変更も反映する
  window.addEventListener("storage", (e) => {
    if (e.key && listeners.has(e.key)) notify(e.key);
  });
}

export function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return fallback;
  }
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  let value: T = fallback;
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      // オブジェクトは既定値とマージして、項目が増えても壊れないようにする
      value = (
        isPlainObject(fallback) && isPlainObject(parsed)
          ? { ...fallback, ...parsed }
          : parsed
      ) as T;
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

export function writeStore<T>(key: string, value: T) {
  const raw = JSON.stringify(value);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    // 保存できない環境（プライベートモード等）でもメモリ上では動かす
  }
  cache.set(key, { raw, value });
  notify(key);
}

function subscribe(key: string, listener: Listener) {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}

/**
 * localStorage に保存される state。fallback はモジュールレベルの定数を渡すこと
 * （毎回新しいオブジェクトを渡すと無限再レンダーになる）。
 */
export function useStoredState<T>(
  key: string,
  fallback: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    useCallback((l: Listener) => subscribe(key, l), [key]),
    () => readStore(key, fallback),
    () => fallback,
  );
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readStore(key, fallback);
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeStore(key, resolved);
    },
    [key, fallback],
  );
  return [value, set];
}

const noopSubscribe = () => () => {};

/** クライアントでマウント済みなら true（SSR・ハイドレーション中は false） */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
