# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

タスクカンバン用の Next.js アプリ（`create-next-app` で作成。現状はほぼ初期テンプレート）。App Router、TypeScript、Tailwind CSS v4 を使用。`@/*` は `./src/*` にマップされる。

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

## テスト

- Vitest + React Testing Library + jsdom。設定は `vitest.config.mts`、jest-dom マッチャーは `vitest.setup.ts` で有効化。
- テスト対象は `src/**/*.test.{ts,tsx}`。パスエイリアスは `resolve.tsconfigPaths: true` で解決（`vite-tsconfig-paths` は不要）。
- Vitest は `async` Server Component をサポートしない。そのようなコンポーネントは E2E テストで検証する。
- `@types/node` は vitest の peer 依存の都合で `^22` を使用（`^20` に戻すと `npm install` が ERESOLVE で失敗する）。

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
