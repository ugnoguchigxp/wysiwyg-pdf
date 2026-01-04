# テーマ設定 修正ガイド

Tailwind CSS v4 + Vite プロジェクトでのテーマ共有・設定ガイド

---

## 1. PostCSS / Tailwind v3 設定の削除

以下のファイルがあれば削除する：

```bash
rm postcss.config.js
rm tailwind.config.js
```

### CSS内の古い参照も削除

```css
/* 削除: v4では不要 */
@config "../tailwind.config.js";
```

---

## 2. Vite設定の更新

`vite.config.ts` に Tailwind CSS v4 プラグインを追加：

```ts
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    // ... 他のプラグイン
  ],
});
```

---

## 3. CSSエントリーポイントの設定

`index.css`（または `globals.css`）の先頭に追加：

```css
/* メインのスタイル変数をインポート */
@import "../../../src/index.css";

/* Tailwind v4: クラススキャン対象のパス定義 */
@source "../../../src/**/*.{js,ts,jsx,tsx}";
@source "./**/*.{js,ts,jsx,tsx}";

/* テーマトークンを必要に応じてカスタマイズ */
@theme {
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

---

## 4. UI密度 (Density) 変数定義

3段階の密度設定に対応。`variables.css` または `index.css` に定義する。

### 標準 (standard) - デフォルト

```css
:root {
  --ui-component-height: 2.5rem;       /* 40px */
  --ui-list-row-height: 2.5rem;
  --ui-component-padding-x: 0.75rem;   /* 12px */
  --ui-component-padding-y: 0.5rem;    /* 8px */
  --ui-button-padding-x: 1rem;         /* 16px */
  --ui-button-padding-y: 0.5rem;       /* 8px */
  --ui-font-size-base: 0.875rem;       /* 14px */
  --ui-modal-padding: 1.5rem;          /* 24px */
  --ui-table-cell-padding: 0.75rem;    /* 12px */
  --radius: 0.5rem;                    /* 8px */
}
```

### コンパクト (compact)

```css
:root[data-density="compact"] {
  --ui-component-height: 2rem;         /* 32px */
  --ui-list-row-height: 2rem;
  --ui-component-padding-x: 0.5rem;    /* 8px */
  --ui-component-padding-y: 0.25rem;   /* 4px */
  --ui-button-padding-x: 0.5rem;       /* 8px */
  --ui-button-padding-y: 0.25rem;      /* 4px */
  --ui-font-size-base: 0.825rem;       /* 13.2px */
  --ui-modal-padding: 1rem;            /* 16px */
  --ui-table-cell-padding: 0.5rem;     /* 8px */
}
```

### ゆったり (spacious)

```css
:root[data-density="spacious"] {
  --ui-component-height: 3rem;         /* 48px */
  --ui-list-row-height: 3.5rem;        /* 56px */
  --ui-component-padding-x: 1.25rem;   /* 20px */
  --ui-component-padding-y: 0.75rem;   /* 12px */
  --ui-button-padding-x: 1.25rem;      /* 20px */
  --ui-button-padding-y: 0.75rem;      /* 12px */
  --ui-font-size-base: 1rem;           /* 16px */
  --ui-modal-padding: 2rem;            /* 32px */
  --ui-table-cell-padding: 1rem;       /* 16px */
}
```

---

## 5. 密度切り替えの実装

HTML の `<html>` または `<body>` に `data-density` 属性を設定：

```tsx
// React での例
<html data-density={density}>

// 切り替え
document.documentElement.dataset.density = "compact";  // コンパクト
document.documentElement.dataset.density = "spacious"; // ゆったり
delete document.documentElement.dataset.density;       // 標準（デフォルト）
```

---

## 6. 角丸のオーバーライド（必要に応じて）

Tailwind のユーティリティクラスを確実に適用するための強制上書き：

```css
.rounded-lg {
  border-radius: var(--radius) !important;
}

.rounded-md {
  border-radius: calc(var(--radius) - 4px) !important;
}

.rounded-sm {
  border-radius: calc(var(--radius) - 2px) !important;
}
```

---

---

## 7. `cn` ユーティリティの推奨構成

Tailwind CSS v4 では、`tailwind-merge` による動的な衝突解決を避け、バンドルサイズと実行時負荷を抑えるために `clsx` のみを使用したシンプルな構成を推奨する。

### `src/lib/utils.ts`

```ts
import { type ClassValue, clsx } from 'clsx';

/**
 * クラス名を条件に応じて結合するユーティリティ。
 * Tailwind v4 では、コンポーネント設計レベルでクラスの衝突を避けることを推奨し、
 * ライブラリによる自動マージ（tailwind-merge）は使用しない。
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
```

---

## 8. チェックリスト

新規プロジェクトまたは既存プロジェクトの修正時：

- [ ] `postcss.config.js` を削除
- [ ] `tailwind.config.js` を削除
- [ ] CSS内の `@config` 参照を削除
- [ ] `vite.config.ts` に `@tailwindcss/vite` を追加
- [ ] `@source` でクラススキャンパスを定義
- [ ] UI密度変数を共通CSSから読み込み or 定義
- [ ] `cn` ユーティリティを `clsx` ベースに更新
- [ ] 必要に応じて角丸オーバーライドを追加

---

## 注意事項

- IDEが `@source`、`@theme` を認識しない警告が出ても無視してOK（Tailwind v4の正式構文）
- `!important` の使用は最小限に抑える（Tailwindの上書きが必要な場合のみ）
- `cn` でのクラス衝突解決（Last-one-wins）が必要な場合は、明示的な設計変更で対応する
- 複数プロジェクトで共有する場合は、共通の `variables.css` を npm パッケージ化を検討
