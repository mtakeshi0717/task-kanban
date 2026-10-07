# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

タスクカンバン用の Next.js アプリ。App Router、TypeScript、Tailwind CSS v4 を使用。`@/*` は `./src/*` にマップされる。
タスクの CRUD（一覧・追加・編集・削除）と、todo / doing / done の3列カンバン表示を実装済み。ドラッグ&ドロップ・認証・並び替えは未実装。

## ディレクトリ構成

- `src/app/page.tsx` — Server Component。h1「タスクカンバン」と `<KanbanBoard />` のみを置く。
- `src/components/KanbanBoard.tsx` — `"use client"`。タスクを state に保持し、各操作の成功後に state を更新して即時反映する（再取得はしない）。初回のみ `useEffect` で取得。
- `src/components/TaskForm.tsx` — 追加／編集共用フォーム。`statusLabels`（todo→未着手、doing→進行中、done→完了）もここで export。
- `src/components/Dialog.tsx` / `ConfirmDialog.tsx` — `role="dialog"` の自前モーダル（編集・削除確認用）。`window.confirm` は使わない。
- `src/lib/tasks.ts` — データ層（`fetchTasks` / `createTask` / `updateTask` / `deleteTask`、`Task` 型、`taskStatuses`）。エラーは `Error` を throw。
- `src/test/fakeSupabase.ts` — テスト用のメモリ上フェイク（後述）。

## 重要: Next.js のバージョンについて

`AGENTS.md` にある通り、このプロジェクトの Next.js (16.x) は既知の Next.js から破壊的変更がある。コードを書く前に `node_modules/next/dist/docs/` 内の該当ガイド（App Router は `01-app/`）を読むこと。非推奨の通知にも従う。

## コマンド

- `npm run dev` — 開発サーバー起動 (http://localhost:3000)
- `npm run build` / `npm start` — 本番ビルド / 起動
- `npm run lint` — ESLint (`eslint-config-next` の core-web-vitals + typescript)
- `npm test` — Vitest（watch モード）
- `npm run test:run` — Vitest を1回だけ実行
- 単一テスト: `npx vitest run src/__tests__/page.test.tsx`、テスト名で絞るなら `npx vitest run -t "見出し"`

## アーキテクチャ・設定の要点

- `next.config.ts` で `cacheComponents: true` と `partialPrefetching: true` が有効。キャッシュ／データ取得まわりのコードは、この設定に対応した Next.js 16 のドキュメントに従って書くこと。
- CSS は Turbopack の `rules` で `@tailwindcss/turbopack` ローダー経由で処理される（PostCSS ではない）。スタイルは `src/app/globals.css` と Tailwind のユーティリティクラスで記述。
- `src/app/layout.tsx` は `LayoutProps<"/">` というグローバル型ヘルパーを使用（型付きルート）。フォントは `next/font/google` の Geist。

## Supabase

- 接続先は Supabase プロジェクト `task-kanban`（ref: `aeeohitbcpsmbodikyhp`、ap-northeast-1）。プロジェクト情報は Supabase MCP で確認する。
- 環境変数は `.env.example` にキーのみ記載（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`）。実際の値は `.env.local`（git 管理外）に置く。
- クライアントは `src/lib/supabase/client.ts` の `supabase`（`@supabase/supabase-js`）を使う。環境変数が未設定だと import 時に例外を投げる。
- `src/instrumentation.ts` の `register` がサーバー起動時に一度だけ `/auth/v1/health` へ接続確認を行う。正常時はログを出さず、異常時（環境変数未設定・HTTP エラー・通信失敗）のみ `console.error` で `[Supabase]` 接頭辞付きのログを出す。これは禁止事項の `console.log` 制限に対する意図的な例外ではなく、エラー出力のみである点に注意。
- `instrumentation.ts` は Node.js ランタイム（`NEXT_RUNTIME === "nodejs"`）でのみ処理する。
- 接続確認ロジックは現状テスト未整備。

### tasks テーブル

- `public.tasks`: `id`（uuid, PK）/ `title`（not null、空白のみは check 制約で拒否）/ `description`（null 可）/ `status`（`todo`・`doing`・`done` の check 制約、既定 `todo`）/ `created_at` / `updated_at`（更新トリガー `tasks_set_updated_at` で自動更新）。
- RLS は有効。認証未導入のため anon に SELECT/INSERT/UPDATE/DELETE を全許可（`tasks_*_anon`）。認証導入時はユーザー単位のポリシーに差し替えること。
- スキーマ変更は Supabase MCP の `apply_migration` で行う（先に `list_tables` で現状確認、後に `get_advisors` でセキュリティ確認）。MCP の各ツールは `project_id`（上記 ref）が必須。
- 型は `src/lib/supabase/database.types.ts`（`generate_typescript_types` の出力）で、`client.ts` が `createClient<Database>` に渡す。**スキーマを変えたら再生成して上書きする**。生成型の `status` は `string` なので、アプリ側では `src/lib/tasks.ts` の `TaskStatus` で絞り込む。
- ステータスを増減する場合は、DB の check 制約・`taskStatuses`・`statusLabels` の3か所を揃えて変更する。
- `src/lib/tasks.ts` のタイトルは前後の空白を除去し、空なら「タイトルを入力してください」を throw。説明が空白のみなら `null` で保存する。
- `.env.local` はツールから読めない場合がある。キーを使う実機確認はユーザーに依頼するか、MCP の `execute_sql` で DB 側を確認する。

## テスト

- Vitest + React Testing Library + jsdom。設定は `vitest.config.mts`、jest-dom マッチャーは `vitest.setup.ts` で有効化。
- テスト対象は `src/**/*.test.{ts,tsx}`。パスエイリアスは `resolve.tsconfigPaths: true` で解決（`vite-tsconfig-paths` は不要）。
- Vitest は `async` Server Component をサポートしない。そのようなコンポーネントは E2E テストで検証する。
- `@types/node` は vitest の peer 依存の都合で `^22` を使用（`^20` に戻すと `npm install` が ERESOLVE で失敗する）。
- Vitest の `globals` は無効。RTL の自動 cleanup が効かないため、`vitest.setup.ts` の `afterEach(cleanup)` でテスト間の DOM を破棄している。消さないこと。
- `@testing-library/user-event` は未導入。操作は `fireEvent` と `findBy*` / `waitFor` で書く。
- Supabase クライアントは `vi.mock("@/lib/supabase/client", async () => ({ supabase: (await import("@/test/fakeSupabase")).fakeSupabase }))` で差し替える。`Home` や `KanbanBoard` を描画するテストは必ずこのモックが必要（無いと環境変数未設定で import 時に例外）。
- `fakeDb`（`src/test/fakeSupabase.ts`）: `reset(rows)` で初期データを設定（`beforeEach` で必ず呼ぶ）、`failWith(message)` で以降のクエリを失敗させる、`getRows()` で DB 側の状態を検証する。`tasks.ts` で使うクエリメソッドを増やした場合（`.eq` 以外の絞り込み等）は、フェイクにも実装を足すこと。
- UI テストのクエリ規約: 列は `region`（名前＝未着手/進行中/完了）、追加フォームは `form`（名前「タスク追加」）、編集は `dialog`「タスクを編集」、削除確認は `dialog`「削除の確認」（ボタン「削除する」/「キャンセル」）、カードのボタンは aria-label `「{タイトル}を編集」「{タイトル}を削除」`。UI を変えるときはこの名前を保つか、テストも合わせて更新する。
- フォームは `noValidate` で、検証は `tasks.ts` 側のエラーをフォーム内の `role="alert"` に表示する方式（jsdom の標準検証に依存しない）。

## コーディングルール
- 変更後は必ず `npm test` でテストが通ることを確認してください
- 変更は1つの関心事に絞り、小さい単位で行ってください
- 指示された範囲以外のコードを変更しないでください

## コーディング規約
- コンポーネントは関数コンポーネントで記述してください
- 変数名・関数名はキャメルケースで書いてください
- コミットメッセージは日本語で書いてください

## テストルール
- 網羅性: 正常系・異常系・境界値を検討してください
- 可読性: テスト名に条件と期待する結果を明示してください
- 保守性: 実装の内部構造ではなくユーザーから見た振る舞いをテストしてください
- 独立性: テスト間で状態を共有しないでください
- 状態遷移: 画面遷移の順方向・逆方向を検証してください
- モック方針: 外部依存のみモック化してください

## 禁止事項
- console.logを本番コードに残さないでください
- 既存のテストを削除しないでください
- any型を使用しないでください

## MCP活用ルール
- Next.js・Supabase・Vitestなどの最新仕様はContext7 MCPを使って公式ドキュメントを確認してくだ
さい
