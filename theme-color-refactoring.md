# CSSテーマを shadcn 形式へ寄せるリファクタリング計画

## 背景
現状はテーマトークンが二重化しています。

- **グローバルCSS（またはアプリのエントリCSS）**に **独自トークン**（`--theme-*`）と **shadcn系トークン**（`--background`, `--primary` など）が併存
- **Tailwind の設定**（`colors` マッピング）でも **shadcn系** と **theme-* 系**が併存
- **UIプリミティブ層（Button/Modal 等）**を中心に Tailwind class が `bg-theme-*` / `text-theme-*` に強く依存

この状態だと、新規参加者が「どれが正？」「どのトークンを使うべき？」で迷いやすく、運用コストが上がります。

## ゴール（最終状態）
- **shadcn のトークン体系を唯一の Source of Truth** にする
  - `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--ring`, `--card`, `--popover`, `--radius` など
- コンポーネント実装は **基本 `bg-background` / `text-foreground` / `bg-primary` / `text-primary-foreground` …** に寄せる
- テーマ切替は現在の流儀（`.dark` / `[data-theme="dark"]`）を維持しつつ、
  - どちらか片方に整理（推奨: `.dark`）
- **`theme-*` の変数・Tailwind color 定義を最終的に廃止**（移行完了後）

## 非ゴール
- UIデザインの刷新（配色の大幅変更）
- 既存コンポーネントを全面的に shadcn の生成物へ置換
- Tailwind v4 の OKLCH への完全移行（必要なら別タスク）

---

## 現状整理（観測された事実）
- **グローバルCSS（またはアプリのエントリCSS）**
  - `:root` と `.dark`（または `[data-theme="dark"]`）の2セットで色定義
  - `--theme-bg-primary` 等（hsl() で保持）
  - `--background` 等（数値のみ: `0 0% 100%` の形式）
- **Tailwind の設定**
  - `colors.background = 'hsl(var(--background))'` のように shadcn 形式に対応している
  - ただし `theme-*` 系の独自カラーも追加されている
- **UIプリミティブ層（Button 等）**
  - `bg-theme-object-primary` 等が中心（= 独自トークン依存）

---

## 進め方（段階移行）

### Phase 0: ベースライン確立（破壊を検知できる状態にする）
- **[成果物]** 変更前のスクリーンショット/動画（light/dark 両方）
- **[確認]** 既存の検証手段（lint/typecheck/build/test など）が一通り通る
- **[棚卸し]** `bg-theme-` / `text-theme-` / `border-theme-` の使用箇所を一覧化

完了条件:
- ベースラインが残っていて、差分検知できる

---

### Phase 1: 互換レイヤー（Bridge）導入：まずは「壊さずに」shadcn を正にする
目的: 既存の `theme-*` 依存コンポーネントを **即時に全置換せず**、トークンの正を shadcn 側へ寄せる。

- **[実装方針]** グローバルCSS（またはアプリのエントリCSS）で
  - `--background` / `--foreground` / `--primary` … を **正** として定義
  - 既存の `--theme-*` は **shadcn 変数を参照する別名**に変更（または逆にしても良いが、最終状態を考えるとこちらが推奨）

#### 互換マッピング案（例）
`theme-*` を shadcn へ寄せる:
- `--theme-bg-primary` -> `hsl(var(--background))`
- `--theme-text-primary` -> `hsl(var(--foreground))`
- `--theme-object-primary` -> `hsl(var(--primary))`
- `--theme-text-on-color` -> `hsl(var(--primary-foreground))`
- `--theme-border` -> `hsl(var(--border))`
- `--theme-accent` -> `hsl(var(--accent))`
- `--theme-danger` -> `hsl(var(--destructive))`

> 注: `--theme-*` は hsl() 付き、shadcn の `--primary` 等は「数値（H S L）」で保持しているので、橋渡しは `hsl(var(--primary))` の形にする。

- **[成果物]** 互換レイヤー導入後も見た目が変わらない（少なくとも意図しない差がない）

完了条件:
- `theme-*` を使っている既存コンポーネントが従来通り描画される
- かつ shadcn トークンが実際に使える状態になっている（`bg-primary` 等が期待通りの色になる）

---

### Phase 2: コンポーネントのクラスを shadcn 形式へ移行（段階的）
目的: `bg-theme-*` 依存を減らし、参加者が「shadcn の文脈」で理解できる状態に寄せる。

- **優先度順（例）**
  1. Button（影響大）
  2. Modal/Dialog/DropdownMenu/Select/Tooltip 等のUIプリミティブ
  3. アプリ機能層（features/pages 等）で直接 `theme-*` class を書いている箇所

- **移行ルール**
  - primary action: `bg-primary text-primary-foreground`
  - cancel/close: `bg-secondary text-secondary-foreground` or `outline`/`ghost` のいずれかに統一
  - delete: `bg-destructive text-destructive-foreground`
  - surface: `bg-background text-foreground`
  - 境界線: `border-border`

完了条件:
- `src/` 配下の `theme-*` class の利用が大幅に減っている（最終的にはゼロを目標）
- 画面の見た目がベースラインと整合

---

### Phase 3: 独自トークン（theme-*）の撤去と Tailwind 設定の整理
- Tailwind の設定から `theme-*` 系 color 定義を削除
- グローバルCSS（またはアプリのエントリCSS）から `--theme-*` 変数を削除（互換レイヤー終了）
- `.dark` と `[data-theme="dark"]` の二重サポートを整理（推奨: `.dark` のみに）

完了条件:
- `--theme-*` が CSS から消えている
- `theme-*` Tailwind colors が消えている
- 既存の検証手段（lint/typecheck/build/test など）が一通り通る

---

## Tailwind v4（@theme inline）への対応方針
現状は `tailwind.config.js` が `hsl(var(--token))` をマップしているため、このままでも運用可能。
ただし shadcn の Tailwind v4 ガイドに寄せるなら、将来的に以下を検討:

- `@theme inline { --color-background: var(--background); ... }` へ寄せる
- OKLCH への移行（必要性が出たら）

> この計画では「まずトークン体系の一本化」を優先し、@theme inline は Phase 3 以降の拡張とする。

---

## 影響範囲
- グローバルCSS（またはアプリのエントリCSS）
- Tailwind の設定
- UIプリミティブ層およびアプリ機能層の Tailwind class
- （必要なら）README/利用者向けのテーマ設定手順

---

## テスト/検証チェックリスト
- light/dark の両方で主要画面が破綻しない
- `Button` の variants:
  - primary / secondary / destructive
  - outline / ghost / link
  が最低限成立
- focus ring / hover state が視認できる
- 既存の検証手段（lint/typecheck/build/test など）が一通り通る

---

## ロールバック戦略
- Phase 1 は「互換レイヤー」なので、問題があればグローバルCSS（またはアプリのエントリCSS）の差分を戻せば復旧できる
- Phase 2 はコンポーネント単位でコミットを分け、UI差分が出た箇所のみ戻せるようにする

---

## 作業順の提案（コミット粒度）
1. Phase 1（CSS変数の互換レイヤーのみ）
2. Button 移行（最小限の variants のみ）
3. Modal/Dialog など周辺UI
4. features 内の残差
5. `theme-*` 完全撤去
