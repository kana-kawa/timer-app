# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 概要

ポモドーロタイマーとアラームのWebアプリ（Next.js 16 App Router / React 19 / Tailwind CSS v4 / TypeScript）。バックエンドやDBはなく、状態はすべてブラウザの localStorage に保存する。UI文言・コメント・コミットメッセージは日本語。

## コマンド

```bash
npm run dev      # 開発サーバー（http://localhost:3000）
npm run build    # 本番ビルド（型チェックも兼ねる）
npm run lint     # ESLint
npm test         # Vitest（全テスト）
npx vitest run src/lib/pomodoro.test.ts   # 単一ファイル
npx vitest run -t "テスト名の一部"          # 名前で絞り込み
```

テストは `src/lib/*.test.ts` の純粋関数のみが対象（vitest の設定ファイルはなく既定設定で動く）。

## アーキテクチャ

**ロジックと UI の分離**: `src/lib/pomodoro.ts` と `src/lib/alarm.ts` は時刻（`now`）を引数で受け取る純粋関数で、状態遷移・判定をすべてここに置く。React 側（`src/contexts/`）はこれを呼んで保存・通知・音を担当するだけ。ロジックを変えるときは lib 側を変更しテストを追加する。

**状態管理 = localStorage を外部ストアとして使う**（`src/lib/storage.ts`）:
- `useStoredState(key, fallback)` は `useSyncExternalStore` ベース。SSR ではフォールバック値、クライアントでは保存値を返しハイドレーション不一致を防ぐ。別タブの変更も `storage` イベントで反映される。
- `fallback` には必ずモジュールレベルの定数を渡す（毎回新しいオブジェクトだと無限再レンダー）。
- 保存値がオブジェクトなら既定値とマージされるので、設定項目の追加は既定値に足すだけで後方互換になる。
- キーは `src/lib/keys.ts` に集約（`layout.tsx` のサーバー側インラインスクリプトからも参照するため `"use client"` のファイルから分離している）。
- `setInterval` のコールバック内では古いクロージャを避けるため `readStore` / `writeStore` で直接読み書きしている。

**Provider 構成**（`src/components/Providers.tsx`）: `SettingsProvider` → `PomodoroProvider` → `AlarmProvider`。Pomodoro/Alarm は `useSettings().playSound` に依存する。Provider はルートレイアウトにあるので、ページを移動してもタイマーとアラームは動き続ける。

**タイマーの時刻管理**: ポモドーロは残り時間をカウントダウンせず、終了時刻 `endAt` を保存する。`advance()` が `endAt` 基準で何フェーズ分でも進めるので、タブがスリープしても正しく追いつく。アラームは `lastFiredKey`（"YYYY-MM-DD HH:MM"）で二重発火を防ぎ、最大5分遡って取りこぼしを拾う。1回のみのアラームは鳴ったら自動で OFF になる。

**通知と音**: Service Worker やプッシュはなく、タブを開いている間だけ動く（`TabOpenNotice` で常時表示）。
- `src/lib/notify.ts`: Web Notification API。`showNotification` に `tag` を付けない（同じ tag が通知センターに残っていると新しい通知がポップアップしないため）。許可リクエストはユーザー操作内で行う。
- `src/lib/sound.ts`: Web Audio API でビープ音を生成（音声ファイルなし）。自動再生制限のため、最初の pointerdown/keydown で `unlockAudio()` する。

**テーマ**: `globals.css` の CSS 変数（`--work` / `--break` など）を `@theme inline` で Tailwind の色として公開し、`.dark` クラスで切り替える（`@custom-variant dark`）。初回描画のちらつき防止に `layout.tsx` のインラインスクリプトが localStorage からテーマを読んで `.dark` を付ける。共通 UI 部品は `src/components/ui.tsx`。

## デプロイ

Vercel を使うが、`vercel.json` で `git.deploymentEnabled: false` にしているため GitHub への push では自動デプロイされない。デプロイは手動で行う。

## プロジェクト固有のルール

### やり取り
- ユーザーへの説明・途中経過・報告、コマンド実行時の説明文もすべて日本語で書く

### 作業の流れ
- 実装したら、報告する前に `npm test`・`npm run lint`・`npm run build` がすべて通ることを確認する
- 本番へのデプロイは次の順番で行う。Claude の判断だけでデプロイしない
  1. `npm run dev -- -p 3100` でローカルの開発サーバーを起動する
  2. ユーザーに URL と確認してほしい項目を伝える
  3. ユーザーから OK をもらう
  4. コミットして GitHub に push し、`vercel deploy --prod` を実行する
- `vercel.json` の自動デプロイ停止の設定（`git.deploymentEnabled: false`）は変えない
- Windows では、開発サーバーを止めてもプロセスが残ってポート3100を使い続けることがある。止めたあとは `Get-NetTCPConnection -LocalPort 3100` でポートが空いたか確認し、残っていればそのプロセスを停止する

### 要件として守ること（`要件定義書.md`）
- データはブラウザの localStorage だけに保存する。サーバー・データベース・ログイン機能は追加しない
- 通知と音はタブを開いている間だけ動く前提にする。この制約は画面上のバナーで利用者に伝え続ける
- 要件定義書の「含まないもの」（統計・PWA化・同期など）を実装する場合は、先にユーザーに確認する
