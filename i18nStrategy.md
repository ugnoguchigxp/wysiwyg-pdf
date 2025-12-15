# i18n Strategy (Host-driven Translator Injection)

このドキュメントは、`markdownWysiwyg`（= `markdown-wysiwyg-editor`）を **ホストアプリ主導の i18n** に揃えるための実装指示書です。

- パッケージ自身は **i18n ライブラリに依存しない**（`react-i18next` / `i18next` などを不要にする）
- 代わりにホストが `t(key, fallback)` 形式の **translator 関数を注入**する
- 注入が無い場合でも UI が壊れないよう、**`fallback ?? key` を表示**できることを保証する

> 目的は、`wysiwyg-pdf` と `markdownWysiwyg` が **同じ i18n 契約**（translator injection + fallback）を採用し、同一ホストプロジェクトで並べて使っても設計がブレない状態にすること。

---

## 1. 要件

### 1.1 必須要件

- **パッケージ内依存ゼロ**
  - `markdownWysiwyg` は i18n ライブラリ（例: `react-i18next`）に依存しない。
- **ホストが任意の i18n 実装で注入可能**
  - `react-i18next` / `next-intl` / 独自辞書など、どれでも使える。
- **Provider/Context で注入**（推奨）
  - props 伝播を避け、ホストが上位で 1 回包むだけで良い。
- **fallback 表示**
  - translator 未注入なら `fallback ?? key` を返して、ラベルが必ず表示される。

### 1.2 非目標（やらないこと）

- パッケージが言語切り替え UI を提供する
- i18n リソース（`en.json` 等）をパッケージが同梱する
- i18n の初期化（`i18next.init` 等）をパッケージが行う

---

## 2. 共通インターフェース（Translator）

### 2.1 型

`markdownWysiwyg` と `wysiwyg-pdf` で共通化する translator の形:

```ts
export type Translator = (key: string, fallback?: string) => string
```

### 2.2 デフォルト実装

translator が注入されていない場合の挙動:

```ts
export const defaultT: Translator = (key, fallback) => fallback ?? key
```

---

## 3. Provider/Context 方式（A案）の実装指針

### 3.1 `I18nProvider` と `useI18n()`

`markdownWysiwyg` に以下のような Context を追加する（ファイル例: `src/i18n/I18nContext.tsx`）。

```tsx
import React from 'react'

export type Translator = (key: string, fallback?: string) => string

export const defaultT: Translator = (key, fallback) => fallback ?? key

type I18nContextValue = {
  t: Translator
}

const I18nContext = React.createContext<I18nContextValue>({ t: defaultT })

export function I18nProvider({
  t,
  children,
}: {
  t?: Translator
  children: React.ReactNode
}) {
  return <I18nContext.Provider value={{ t: t ?? defaultT }}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  return React.useContext(I18nContext)
}
```

### 3.2 パッケージ外部 API として export

`src/index.ts`（エントリ）から export する:

- `I18nProvider`
- `useI18n`
- `Translator`
- `defaultT`

ホストは `markdownWysiwyg` を利用する際に、上位で以下のように包める。

---

## 4. 既存の `texts` / `DEFAULT_TEXTS` / `I18N_KEYS` との整合

`markdownWysiwyg` には現在:

- `texts?: Partial<ITexts>`
- `DEFAULT_TEXTS`
- `I18N_KEYS`（`markdown_editor.*`）

があり、ここを壊さずに Provider 方式へ移行する。

### 4.1 重要方針

- `texts` は **引き続き最優先の上書き**として残す（後方互換）。
- `texts` が未指定の場合に限り、Provider の `t()` を使って `texts` を自動生成する。

優先順位:

1. 呼び出し側 props の `texts`（最優先）
2. Provider から注入された `t(key,fallback)`
3. `DEFAULT_TEXTS`（fallback）

### 4.2 `createMarkdownEditorTexts(t)` ヘルパー（推奨）

Provider を使う場合でも内部で同じ処理をしたいので、`texts` を生成する純関数を追加する:

```ts
import { DEFAULT_TEXTS, I18N_KEYS, type ITexts } from '../types'
import type { Translator } from '../i18n/I18nContext'

export function createMarkdownEditorTexts(t: Translator): ITexts {
  return {
    ...DEFAULT_TEXTS,
    placeholder: t(I18N_KEYS.placeholder, DEFAULT_TEXTS.placeholder),
    deleteButton: t(I18N_KEYS.deleteButton, DEFAULT_TEXTS.deleteButton),
    // ...同様に全キー
    table: {
      ...DEFAULT_TEXTS.table,
      rowOperations: t(I18N_KEYS.table.rowOperations, DEFAULT_TEXTS.table.rowOperations),
      addRowAbove: t(I18N_KEYS.table.addRowAbove, DEFAULT_TEXTS.table.addRowAbove),
      // ...
    },
  }
}
```

> これにより、ホスト側が Provider を使わない場合でも `texts={createMarkdownEditorTexts(t)}` の形で統一できる。

### 4.3 `MarkdownEditor` 内での利用

`src/components/MarkdownEditor.tsx` 内で以下のように `texts` を確定する（概念）:

```tsx
const { t } = useI18n()

const resolvedTexts = React.useMemo(() => {
  // 1) props.texts があればそれを優先
  if (props.texts) {
    return { ...DEFAULT_TEXTS, ...props.texts }
  }

  // 2) Provider の t() から生成
  return createMarkdownEditorTexts(t)
}, [props.texts, t])

return <MarkdownToolbar texts={resolvedTexts} ... />
```

---

## 5. ホストアプリ側の使用例

### 5.1 react-i18next

```tsx
import { useTranslation } from 'react-i18next'
import { I18nProvider as MarkdownI18nProvider, MarkdownEditor } from 'markdown-wysiwyg-editor'

export function Page() {
  const { t } = useTranslation()

  return (
    <MarkdownI18nProvider t={t}>
      <MarkdownEditor value={...} onChange={...} />
    </MarkdownI18nProvider>
  )
}
```

### 5.2 next-intl（例）

```tsx
import { useTranslations } from 'next-intl'
import { I18nProvider, type Translator } from 'markdown-wysiwyg-editor'

export function Page() {
  const tNext = useTranslations()

  const t: Translator = (key, fallback) => {
    // next-intl は fallback の API が異なるため自前で吸収
    try {
      return tNext(key)
    } catch {
      return fallback ?? key
    }
  }

  return (
    <I18nProvider t={t}>
      {/* ... */}
    </I18nProvider>
  )
}
```

---

## 6. 移行手順（markdownWysiwyg）

1. **新規追加**: `src/i18n/I18nContext.tsx`（`I18nProvider` / `useI18n` / `Translator` / `defaultT`）
2. **新規追加（推奨）**: `createMarkdownEditorTexts(t)`
3. **既存コンポーネント修正**:
   - `MarkdownEditor.tsx` 内で `texts` を `props.texts ?? createMarkdownEditorTexts(t)` で確定
   - `MarkdownToolbar` / `TableContextMenu` など、`texts` を参照している箇所は **resolvedTexts を渡す**
4. **export**: `src/index.ts` から `I18nProvider` / `useI18n` / `createMarkdownEditorTexts` を公開
5. **後方互換の確認**:
   - `texts` prop を渡している既存ホストは壊れない
   - Provider を導入したホストは `texts` を渡さなくても翻訳可能になる

---

## 7. 翻訳キー（namespace）

`markdownWysiwyg` は既に `I18N_KEYS` を持っているため、ホスト側の翻訳リソースはこれに従う。

- Namespace: `markdown_editor`
- 例:
  - `markdown_editor.bold`
  - `markdown_editor.table.row_operations`

> `wysiwyg-pdf` 側も将来的に `I18N_KEYS` を export することで、同様の運用が可能になる。

---

## 8. 期待される最終状態

- ホストアプリは、アプリ上位で
  - `wysiwyg-pdf` 用 `I18nProvider`
  - `markdownWysiwyg` 用 `I18nProvider`

  を同じ `t` で包むだけで、両コンポーネントの i18n が統一される。

- パッケージは translator が無くても
  - `fallback` または `key` を必ず表示できる。

