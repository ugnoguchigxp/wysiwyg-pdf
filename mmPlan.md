# mm-first refactoring plan (wysiwyg-pdf)

## 目的 / ゴール
- **内部表現（Doc JSON の正規形）を mm に統一**する。
- **描画（Konva/Canvas）時のみ mm→px**（DPI 基準）へ変換し、`zoom` は px 変換後に掛ける。
- **印刷/PDF（PrintLayout）時のみ mm→pt**（72dpi）へ変換し、版面が一致する。
- **フォントサイズは UI では pt のまま編集**できてよいが、**内部（Doc 保持・計算）は mm に統一**する。
- 「サイズ」と名の付くもの（Canvas サイズ、Surface サイズ、Grid サイズ、Margin、Stroke/Border、Table row/col 等）を **mm 基準**で動くようにする。

## 前提（dtpStrategy.md の要点）
- デフォルト単位は mm（`Doc.unit` 省略時は `mm` とみなす）。
- 変換式はライブラリ側で一元化する。
  - mm↔px: `px = mm * (dpi / 25.4)`（default dpi=96）
  - mm↔pt: `pt = mm * (72 / 25.4)`
- 余白キーは `t/r/b/l` を正とし、`top/right/bottom/left` も受理して mm として解釈する。
- `ReportKonvaEditor` / `PrintLayout` / `useReportHistory` が mm Doc を保持する。

---

## 現状観測（コードから見える混在ポイント）
- **Grid 設定 UI が pt 表記**
  - `SettingsDrawer.tsx` に `Grid Size (pt)` と表示。
  - `WysiwygPropertiesPanel.tsx` / `bed-layout-editor PropertyPanel.tsx` の grid select も `xxpt` 表記。
- **印刷レンダラが pt/px をハードコード**
  - `ReportPrintLayout.tsx` の table で `width: ${element.w}pt` 等。
  - `BedPrintLayout.tsx` は `left/top/width/height` を `${...}px`。
- **pageUtils の変換が dpi=72 相当で `mmToPx` と命名されている**
  - `pageUtils.ts` の `mmToPx = (mm) => Math.round((mm*72)/25.4)` は実質 pt 換算に近く、表示用 dpi=96 とズレる。
- **座標ユーティリティが pt↔px のみ**
  - `src/utils/coordinates.ts` は pt/px 前提。
- **Doc 型は unit を持つが、利用箇所が統一されていない**
  - `src/types/canvas.ts` に `unit: 'mm' | 'pt' | 'px' | 'in'` がある。
  - 実際のレンダリングや UI が unit を参照していない/参照が不足している可能性。

---

## 単位ポリシー（新）
### 1) Doc 正規形（Canonical）
- **Doc の全長さ（length）は mm**。
  - `Surface.w/h`
  - Node: `x/y/w/h/r`（r は角度なので除外）
  - Style: `strokeW`, `borderW`, `radius` 等
  - Table: `table.rows/cols`（row 高さ・col 幅）, cell の `borderW` 等
  - Signature: `strokeW`, `strokes` の座標
  - Grid: `gridSize`, snapStrength（距離）
- `Doc.unit` は保存時に **必ず `mm`**。

### 2) UI 表示 / 入力
- **寸法 UI（w/h/x/y/margin/grid 等）: mm 表示・mm 入力**。
- **フォントサイズ UI: pt 表示・pt 入力**。
  - 内部保存は mm。
  - UI 層で `mm↔pt` 変換して見せる。

### 3) レンダリング境界
- **Konva 表示**: mm→px（`dpi`）→ `zoom`。
- **印刷/レイアウト**: mm→pt（固定 72）。（CSS に pt を出す/または内部 pt 計算を使う）

---

## 設計方針（実装の骨格）
### A. 単位変換ユーティリティの中央集約
- 新規に「単位変換の唯一の真実（Single Source of Truth）」を用意する。
- 要件:
  - 変換式が散らばらない（pageUtils/coordinates 等の重複排除）
  - dpi を一箇所で管理できる
  - 丸め/最小ステップを統一できる

提案 API（案）:
- `mmToPx(mm, dpi)` / `pxToMm(px, dpi)`
- `mmToPt(mm)` / `ptToMm(pt)`
- `normalizeDocToMm(docLike, options)`
- `normalizeMargin(marginLike)`（t/r/b/l 正規化）
- `roundMm(mm, precision)` / `snapMm(mm, stepMm)`

### B. 型/境界を明確化（数値の意味を固定）
- できればブランド型（`type Mm = number & {__brand:'mm'}`）等で混入を減らす（導入は段階的）。
- まずは「関数名で単位を表現」し、引数/返り値が何単位か明確化する。

### C. 正規化のタイミング
- **入ってきた Doc を最初に mm に正規化**し、以降は mm として扱う。
  - 例: Editor 初期化時、サーバからテンプレート JSON を読み込んだ直後。
- **保存前にも mm 正規化 + key 正規化（margin 等）**を行う。

---

## 影響範囲（修正対象の代表）
### 1) データモデル（Doc/Surface/Node）
- `src/types/canvas.ts`
  - 既存の `unit` を活かす。
  - フォントサイズ・stroke/border 等の「単位の意味」を mm に固定する方針を明文化（コード側の invariant）。

### 2) Editor（Konva）
- `src/features/report-editor/ReportKonvaEditor.tsx`
  - `currentSurface.w/h` や node の `x/y/w/h` を **mm として保持**。
  - Stage/Layer に渡す値は **px** へ変換する（現状は生値のまま）。
  - テキスト編集 overlay / measureText / auto-resize の結果（px）を mm に戻して Doc 更新する必要がある。

- `src/components/canvas/KonvaCanvasEditor.tsx`
  - `paperWidth/paperHeight`（現状 number）を mm と定義し直し、内部で px 化した値を Stage に渡す設計へ。
  - `handleMove(dx,dy)` の step（キーボード移動）も mm で定義し、px から逆変換を避ける。

- `src/components/canvas/GridLayer.tsx`
  - `gridSize` は mm。
  - 描画時に px へ変換して線を引く。

- `src/components/canvas/CanvasElementRenderer.tsx`
  - Konva ノードの座標・サイズは px が必須。
  - よって `element`（mm）→ `commonProps`（px）への変換層を作る。
  - Transformer の操作結果（px）を mm に変換して `onChange` する。

### 3) PrintLayout（HTML/CSS）
- `src/features/konva-editor/renderers/print/ReportPrintLayout.tsx`
  - 現状 `pt` を直接埋めている箇所（table の width/height/left/top/col/row 等）を、mm Doc を前提に **mm→pt 変換**した値で出す。

- `src/features/konva-editor/renderers/print/BedPrintLayout.tsx`
  - 現状 `px` 埋め込み。
  - mm Doc を前提に **mm→pt** へ統一する（印刷表現を統一するため）。

### 4) UI（プロパティ/設定/表示ラベル）
- `SettingsDrawer.tsx`
  - `Grid Size (pt)` を `Grid Size (mm)` に変更。
  - 選択肢（Fibonacci）は単位が変わるので再設計（例: 1,2,5,10,20,50mm 等）。

- `WysiwygPropertiesPanel.tsx` / `bed-layout PropertyPanel.tsx`
  - grid の表示 `xxpt` → `xxmm`。
  - 幅・高さ等の入力が mm と一致するように。

- フォントサイズ UI（Text/Table）
  - UI は pt。
  - 内部保存は mm。
  - 既存の `fontSizes`（pt list）は維持しつつ、Doc 更新時に pt→mm へ変換。

### 5) 入出力/変換
- `src/features/konva-editor/utils/pageUtils.ts`
  - 名前/式を整理。
  - `mmToPx` は dpi=96 を受け取る形に統一。
  - 「用紙サイズ（A4等）」は mm をソースにし、表示/印刷で必要な単位へ変換する。

- `src/utils/coordinates.ts`
  - pt/px 専用の util は mm-first では境界が不明瞭。
  - mm の変換ユーティリティへ置き換え、既存 util の呼び出しを段階的に削除。

- `src/features/konva-editor/utils/dashboardAdapter.ts`
  - 現状 `unit:'px'` の Doc を生成。
  - 仕様として「bed dashboard の入力が px なのか実寸なのか」を確定する必要あり。
    - 入力が px なら `dpi` を使って px→mm して Doc を `unit:'mm'` で生成。
    - 入力が実寸（mm）ならそのまま `unit:'mm'`。

- `useReportHistory`
  - 受け取る `initialDocument` を mm に正規化してから history に載せる。

---

## 互換性方針（重要）
### 1) 旧データ受理
- `Doc.unit` が `pt/px/in` の場合:
  - ライブラリ側で **mm へ正規化**してから扱う。
  - 可能なら **warning log** を出す（開発時のみでも可）。

### 2) `unit` 欠落
- `unit` が無い Doc は `mm` とみなす（dtpStrategy 準拠）。
  - ただし現実には「unit 無し = pt 運用」だったデータが存在し得るため、移行期間は option で `assumeUnit` を切り替え可能にする（後述）。

### 3) margin キー
- 入力:
  - `t/r/b/l` 正
  - `top/right/bottom/left` もフォールバックで読み、mm として扱う
- 出力:
  - `t/r/b/l` に正規化して保存

### 4) 保存時
- 保存前に必ず `normalizeDocToMm()` を通し、`unit:'mm'` を書き出す。

---

## 設定（オプション化が必要なもの）
- `dpi`（default 96）
- `minStepMm`（例: 0.1mm）
- `rounding`:
  - 表示: 2 桁
  - 保存: 3 桁
- `assumeUnitIfMissing`:
  - 移行期のみ `pt` などを許容し、段階的に `mm` に固定

---

## 実装ステップ（段階的リファクタリング計画）
### Phase 0: 仕様確定（短期・着手前）
- 決めるべきこと:
  - **既存テンプレート JSON で `unit` が省略されているケースがあるか**
  - `dashboardAdapter` の入力座標の単位（px / 実寸）
  - PDF 生成の実体（PrintLayout の印刷か、jsPDF 等か）と単位要件
- 成果物:
  - 単位ポリシー（本書）を `dtpStrategy.md` の next step と整合させて確定

### Phase 1: 変換ユーティリティ導入（挙動変更を最小化）
- 変換ロジックを 1 箇所へ集約（mm↔px, mm↔pt, px↔mm, pt↔mm）。
- 既存の `pageUtils.ts` / `coordinates.ts` / 各所の直書き計算を、まずは util 呼び出しへ置換。
- ここでは **Doc の単位はまだ混在していてもよい**が、以後の Phase で mm 正規化に寄せる。

### Phase 2: Doc 正規化（mm-first の中核）
- `normalizeDocToMm(doc)` を実装し、以下を確実に行う:
  - `unit` に応じた全長さの変換
  - margin key の正規化
  - 必須値の補完（surface/node の欠落値がある場合の扱いを定義）
  - 丸め（保存 3 桁）
- 正規化の適用点:
  - エディタ初期化時（読み込み直後）
  - undo/redo の初期 doc
  - 保存直前
- 成果:
  - 履歴・保存・内部状態が **mm で統一**される

### Phase 3: Konva 表示を mm→px 化（見た目の一致を取る）
- 目標: Konva に渡す値は常に px、Doc は常に mm。
- 対象:
  - `ReportKonvaEditor.tsx`
  - `KonvaCanvasEditor.tsx`
  - `CanvasElementRenderer.tsx`
  - `GridLayer.tsx`
  - `TextEditOverlay` / `measureText` 周辺
- 重要ポイント:
  - **ユーザー操作（ドラッグ/リサイズ/回転）結果は px** で返ってくるため、mm に戻して保存。
  - テキスト自動リサイズで算出される `w/h` も mm に戻して保存。

### Phase 4: PrintLayout を mm→pt 化（印刷寸法の一致）
- 目標: PrintLayout で使う座標・サイズ・stroke/border が pt になり、A4 等が期待値に一致。
- 対象:
  - `ReportPrintLayout.tsx`（table の `pt` 直書きの前提を「mm→pt 変換」に置換）
  - `BedPrintLayout.tsx`（px を廃止し pt に統一）
- フォント:
  - UI は pt 入力だが、Doc は mm なので、PrintLayout では `fontSizeMm→pt` を使う。

### Phase 5: UI の単位表示統一（mm 基準の UX）
- Grid:
  - UI 文言 `pt` を `mm` へ。
  - 選択肢を mm 用に再設計（細かいグリッド用途があるなら 0.5mm, 1mm, 2mm, 5mm, 10mm…等）。
- PropertyPanel:
  - width/height/x/y/margin 等は mm。
  - fontSize は pt 表示を維持（内部は mm）。

### Phase 6: 旧コード撤去と整合性チェック
- 変換が util に集約されたことを確認し、直書き式を削除。
- `coordinates.ts` の pt/px ユーティリティの役割を見直し（不要なら削除/非推奨化）。
- `pageUtils.ts` の命名と式の修正。

---

## テスト/検証計画
### 1) 単位変換のユニットテスト
- mm↔pt, mm↔px の逆変換で誤差が許容範囲に収まること。
- A4:
  - mm: 210×297
  - pt: 595.276×841.89（期待）

### 2) スナップショット（見た目）
- 代表テンプレート（A4/A5、縦横）で:
  - Konva 表示（px）と PrintLayout（pt）の配置が一致すること。

### 3) 移行互換テスト
- `unit:'pt'` / `unit:'px'` / `unit:'in'` の doc を投入して、保存時に `unit:'mm'` で出ること。
- `margin` が `top/right/bottom/left` の doc を投入して、保存時に `t/r/b/l` で出ること。

---

## リスクと対策
- **テキスト計測/自動リサイズの単位齟齬**
  - `measureText` は px ベースになりやすい。
  - 対策: UI/描画で使う fontSize は `fontSizeMm→px` を明示し、Doc へ保存する値は mm に戻す。

- **ブラウザ印刷の CSS 単位の解釈差**
  - pt/mm の扱いが環境差を生む可能性。
  - 対策: PrintLayout は mm→pt の数値を生成し、最終的に pt を使うことで環境差を最小化。

- **unit 省略の既存データ**
  - `unit` 欠落が pt 運用だった場合、mm と解釈すると破壊的。
  - 対策: 移行期は `assumeUnitIfMissing` を用意し、既存データの実態に合わせて段階的に固定。

---

## 追加で確認したい質問（レビュー時に確定したい）
- 既存テンプレート JSON で `unit` は必ず入っていますか？（省略データの有無）
- 既存 doc の `surface.w/h` や `node.w/h` は実際には pt 想定でしょうか？px 想定でしょうか？
- `dashboardAdapter` の入力（room.width/height, bed.x/y 等）は px でしょうか？それとも実寸（mm）でしょうか？
- PDF 出力は「ブラウザ印刷」を想定ですか？それとも別途 PDF ライブラリ（例: jsPDF）を使う計画がありますか？

---

## 完了条件（Definition of Done）
- 保存される Doc は常に `unit:'mm'`。
- Konva 表示は mm→px（dpi）→zoom の順で計算され、ズームしても Doc の mm 値は汚染されない。
- PrintLayout は mm→pt（72）で計算され、A4 等が期待 pt に一致する。
- Grid/Snap/Canvas サイズ等、あらゆる「サイズ」が mm 入力・mm 基準で動作する。
- フォントサイズは UI では pt のまま編集でき、内部では mm として保存・計算される。
