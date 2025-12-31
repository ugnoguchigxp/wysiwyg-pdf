# wysiwyg-pdf - 開発ガイドライン

## 🎯 プロジェクト概要
**React + Konva WYSIWYG Editor Toolkit**
- **Stack**: React 19.x + TypeScript + Vite + Konva
- **CSS**: Tailwind CSS (clsx, tailwind-merge)
- **UI Primitives**: Radix UI + Lucide React
- **Test**: Vitest + React Testing Library
- **Lint/Format**: Biome

## ⚡ 必須遵守
### コーディング規約
1.  **console.log禁止**: 本番ビルドに含まれないようにする（開発中のデバッグは可だがコミット前に削除）
2.  **any禁止**: 適切な型定義か `unknown` を使用する（Biome `noExplicitAny` ルール準拠）
3.  **i18n対応**: UI文字列のハードコード禁止。`src/i18n` の仕組みを使用する
4.  **Schema-First**: データ型定義には Zod を活用する
5.  **マジックナンバー禁止**: 定数化必須
6.  **Component指向**: `src/components/ui` の基本コンポーネントを再利用する
7.  **依存関係**: 循環参照を避ける

### プロジェクト設定
- **言語**: TypeScript
- **コメント**: JSDocを含むすべてのコードコメントは **日本語** で記述する
- **フォーマット**: 2スペース、100文字、シングルクォート、セミコロン必須（Biome設定準拠）
- **パスエイリアス**: `@/*` を使用して `src/*` を参照する

### 命名規則
| 対象 | 規則 | 例 |
| :--- | :--- | :--- |
| **ファイル（TSX/UI）** | PascalCase | `ReportEditor.tsx`, `SlideEditor.tsx` |
| **ファイル（ts/utils）** | camelCase | `canvasUtils.ts`, `hooks.ts` |
| **コンポーネント名** | PascalCase | `const ReportEditor = () => {...}` |
| **関数・変数** | camelCase | `calculateLayout`, `isLoading` |
| **定数** | UPPER_SNAKE_CASE | `DEFAULT_FONT_SIZE`, `MAX_ZOOM` |
| **型・インターフェース** | PascalCase | `type UnifiedNode`, `interface Doc` |

## 🏛️ 設計原則
- **DRY (Don't Repeat Yourself)**: 重複コードは共通化する
- **KISS + YAGNI**: シンプルであることを優先し、現在必要でない機能は作らない（未確定機能作成禁止）
- **単一責任・関心分離**: 1コンポーネント1責務。UI・ロジック・データ取得は明確に分離する
- **最小驚愕の原則 (Principle of Least Astonishment)**: 利用者や開発者が直感的に予測できる命名と振る舞いを採用する
- **Feature-First**: 機能単位でディレクトリを分割する (`src/features`)
- **Composition**: コンポーネントは継承ではなく合成で拡張する
- **Immutable**: KonvaのNode状態管理等はイミュータブルに行う

## 🎨 実装ルール

### リファクタリング基準
- **ファイルサイズ**: 600行を超えるファイルは、責務に応じて分割（カスタムフック、サブコンポーネント抽出など）を必ず実施する。

- **`src/components/ui/`**
    - Radix UIベースの汎用UIコンポーネント (`Button`, `Dialog`, `DropdownMenu` 等)
    - デザインシステムの基礎となるため、ここにあるコンポーネントを優先的に使用する

- **`src/features/{feature}/`** (旧 modules)
    - 機能ごとの実装をここに集約する (`konva-editor`, `report-editor`, `slide-editor` 等)
    - **構成**:
        - `components/`: 機能固有のUIコンポーネント
        - `hooks/`: カスタムフック
        - `utils/`: ヘルパー関数
        - `types.ts` or `schema.ts`: 型定義

- **`src/utils/`**
    - アプリケーション全体で共有される汎用ユーティリティ

### テスト (Testing)
- **ツール**: Vitest
- **配置**: **Co-location** を原則とする。
    - ✅ `src/features/report-editor/utils/tableOperations.test.ts`
    - ⚠️ 現状の `Test/` ディレクトリはレガシーとし、新規テストは実装ファイルと同階層 (`src/` 内) に配置することを推奨する。
- **カバレッジ**: ロジックの複雑なユーティリティやコア機能（レイアウト計算など）は重点的にテストする

### スタイリング
- **Tailwind CSS**: スタイリングは原則 Tailwind CSS のユーティリティクラスで行う
- **Konva Styling**: Canvas内のスタイリングはKonvaのプロパティで行う

### 状態管理
- **Editor State**: エディタの状態（History, Selection）はカスタムフック (`useReportHistory` 等) で管理する
- **Context API**: グローバルな設定（i18n, Theme）等は React Context を使用する

## 🤝 運用ルール
- **Lint/Format**: コミット前に必ず `pnpm verify` (lint, format, test, buildチェック) をパスすること
- **ライブラリ設計**: `src/index.ts` から公開するAPIを意識して実装する

### コミット規約 (Conventional Commits)
- **形式**: `<type>(<scope>): <subject>`
- **type**:
    - `feat`: 新機能
    - `fix`: バグ修正
    - `docs`: ドキュメント
    - `refactor`: リファクタリング
    - `test`: テスト関連
    - `chore`: その他ビルド周り等
- **例**: `feat(pdf): 縦書きテキストのPDFエクスポートに対応`, `fix(editor): 画像のドラッグ＆ドロップの不具合修正`
