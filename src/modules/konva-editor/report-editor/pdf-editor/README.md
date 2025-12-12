# Report PDF Module

TLF (Thinreports Layout Format) 形式の帳票テンプレートを作成・編集するための WYSIWYG エディタモジュール。

## 📋 概要

このモジュールは、nephroflow-api の `/api/report_templates` エンドポイントと連携し、Canvas ベースの WYSIWYG エディタで TLF 形式の帳票テンプレートを編集できます。

## 🎯 Phase 1 (MVP) 機能

### サポート要素

- **Text**: テキスト要素（フォント、サイズ、色、配置）
- **Rect**: 矩形要素（塗りつぶし色、枠線、角丸）
- **Line**: 線要素（色、太さ、スタイル）

### 機能一覧

- ✅ Canvas ベース WYSIWYG エディタ
- ✅ ドラッグ & ドロップで要素移動
- ✅ クリックで要素選択
- ✅ プロパティパネルで詳細編集
- ✅ ツールバーから要素追加
- ✅ テンプレート一覧表示
- ✅ テンプレート保存（新規作成 / 更新）
- ✅ テンプレート読み込み
- ✅ 日本語 i18n 対応

## 📁 ディレクトリ構造

```
src/modules/report-pdf/
├── types/
│   └── tlf.ts                         # TLF型定義
├── services/
│   └── tlfApi.ts                      # TLF APIクライアント
├── hooks/
│   └── useTLFQuery.ts                 # TanStack Query hooks
├── utils/
│   └── coordinates.ts                 # 座標変換ユーティリティ (px ↔ pt)
├── components/
│   ├── Editor/
│   │   ├── CanvasRenderer.tsx         # Canvas描画ロジック
│   │   └── CanvasEditor.tsx           # メインエディタコンポーネント
│   ├── Toolbar/
│   │   └── EditorToolbar.tsx          # 要素追加ツールバー
│   ├── PropertiesPanel/
│   │   └── PropertiesPanel.tsx        # プロパティ編集パネル
│   └── TemplateList/
└── README.md
```

## 🚀 使い方

### 1. テンプレート一覧ページ

```typescript
import ReportTemplatesPage from '@src/pages/ReportTemplatesPage';

// ルーティング
<Route path="/report-templates" element={<ReportTemplatesPage />} />
```

### 2. エディタページ

```typescript
import ReportEditorPage from '@src/pages/ReportEditorPage';

// 新規作成
<Route path="/report-editor" element={<ReportEditorPage />} />

// 既存テンプレート編集
<Route path="/report-editor/:id" element={<ReportEditorPage />} />
```

## 🔧 API 統合

### TLF API Client

```typescript
import { useTLFApi } from '@src/modules/report-pdf/services/tlfApi';

const tlfApi = useTLFApi();

// テンプレート一覧取得
const templates = await tlfApi.listTemplates();

// テンプレート取得 (Blob → JSON 変換)
const document = await tlfApi.getTemplate(id);

// テンプレート保存 (FormData アップロード)
const savedTemplate = await tlfApi.saveTemplate(name, document, orientation);
```

### TanStack Query Hooks

```typescript
import {
  useTemplateList,
  useTemplate,
  useSaveTemplate,
} from '@src/modules/report-pdf/hooks/useTLFQuery';

// 一覧取得
const { data: templates, isLoading } = useTemplateList();

// 単一テンプレート取得
const { data: document } = useTemplate(id);

// 保存 mutation
const saveTemplateMutation = useSaveTemplate();
await saveTemplateMutation.mutateAsync({ name, document, orientation });
```

## 📐 座標系

### PDF Points (pt) と Canvas Pixels (px)

- **PDF Points**: TLF ファイル内で使用される座標系（1pt = 1/72 inch）
- **Canvas Pixels**: Canvas 描画で使用される座標系（96dpi）
- **変換比率**: `96px = 72pt` → `1pt = 1.333px`, `1px = 0.75pt`

### A4 サイズ

- **Portrait (縦)**: 595.28pt × 841.89pt (793.71px × 1122.52px)
- **Landscape (横)**: 841.89pt × 595.28pt

### 座標変換ユーティリティ

```typescript
import { ptToPx, pxToPt, roundPt, roundPx } from '@src/modules/report-pdf/utils/coordinates';

// PT → PX
const px = ptToPx(100); // 133.33px

// PX → PT
const pt = pxToPt(133); // 99.75pt

// 丸め処理
const roundedPt = roundPt(99.756); // 99.76pt (小数点2桁)
const roundedPx = roundPx(133.45); // 133px (整数)
```

## 🎨 Canvas レンダリング

### CanvasRenderer クラス

```typescript
import { CanvasRenderer } from '@src/modules/report-pdf/components/Editor/CanvasRenderer';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const renderer = new CanvasRenderer(ctx);

// 描画
renderer.render(document.items, selectedItemId);
```

### サポートされる描画要素

- **Text**: フォントスタイル、配置、下線・取り消し線
- **Rect**: 塗りつぶし、枠線、角丸
- **Line**: 色、太さ、点線・破線

## 🔍 実装詳細

### API エンドポイント対応

| エンドポイント                  | メソッド | 説明                                       | 実装状況 |
| ------------------------------- | -------- | ------------------------------------------ | -------- |
| `/api/report_templates`         | GET      | テンプレート一覧取得                       | ✅       |
| `/api/report_templates/:id`     | GET      | テンプレート取得 (Blob 返却)              | ✅       |
| `/api/report_templates`         | POST     | テンプレート保存 (FormData アップロード)  | ✅       |
| `/api/report_templates/base`    | GET      | ベーステンプレート取得                     | ✅       |

### 重要な実装ポイント

#### 1. Blob レスポンス処理

```typescript
// API は send_data で Blob を返却するため、JSON への変換が必要
const response = await apiClient.get(`/api/report_templates/${id}`, {
  responseType: 'blob',
});

const blob = response as unknown as Blob;
const text = await blob.text();
const tlfDoc: ITLFDocument = JSON.parse(text);
```

#### 2. FormData アップロード

```typescript
// POST エンドポイントは FormData でファイルアップロードを期待
const tlfBlob = new Blob([JSON.stringify(tlfDoc, null, 2)], {
  type: 'application/json',
});

const formData = new FormData();
formData.append('template[name]', name);
formData.append('template[orientation]', orientation);
formData.append('template[file]', tlfBlob, `${name}.tlf`);

const response = await apiClient.post('/api/report_templates', formData);
```

#### 3. 更新処理

```typescript
// PUT エンドポイントは存在しない
// POST エンドポイントが name でマッチングして自動的に更新
// 新規作成と更新で同じエンドポイントを使用
```

## 📝 TLF 型定義

### ITLFDocument

```typescript
interface ITLFDocument {
  version: string; // "0.9.1" or "0.12.0"
  items: ITLFItem[];
}
```

### ITLFText

```typescript
interface ITLFText {
  id: string;
  type: 'text';
  x: number; // PT
  y: number; // PT
  width: number; // PT
  height: number; // PT
  display: boolean;
  style: {
    'font-family': string[];
    'font-size': number;
    'color': string;
    'text-align': 'left' | 'center' | 'right';
    'vertical-align': 'top' | 'middle' | 'bottom';
    'font-style': string[]; // ['bold', 'italic', 'underline', 'linethrough']
  };
  texts: string[];
}
```

### ITLFRect

```typescript
interface ITLFRect {
  id: string;
  type: 'rect';
  x: number; // PT
  y: number; // PT
  width: number; // PT
  height: number; // PT
  display: boolean;
  style: {
    'border-color': string;
    'border-width': number;
    'border-style': 'none' | 'solid' | 'dotted' | 'dashed';
    'fill-color': string;
  };
  'border-radius': number; // PT
}
```

### ITLFLine

```typescript
interface ITLFLine {
  id: string;
  type: 'line';
  x: number; // PT (bounding box)
  y: number; // PT (bounding box)
  width: number; // PT (bounding box)
  height: number; // PT (bounding box)
  display: boolean;
  x1: number; // Start X (PT)
  y1: number; // Start Y (PT)
  x2: number; // End X (PT)
  y2: number; // End Y (PT)
  style: {
    'border-color': string;
    'border-width': number;
    'border-style': 'none' | 'solid' | 'dotted' | 'dashed';
  };
}
```

## 🌐 i18n 翻訳

```json
{
  "report_pdf": {
    "templates": {
      "title": "帳票テンプレート一覧",
      "create_new": "新規作成"
    },
    "editor": {
      "template_name": "テンプレート名",
      "save_success": "テンプレートを保存しました"
    },
    "toolbar": {
      "text": "テキスト",
      "rect": "矩形",
      "line": "線"
    },
    "properties": {
      "title": "プロパティ",
      "x": "X座標",
      "y": "Y座標",
      "width": "幅",
      "height": "高さ"
    }
  }
}
```

## 🚧 今後の拡張 (Phase 2+)

### Phase 2 (予定)

- TextBlock 要素 (データバインディング)
- Ellipse 要素
- Undo/Redo 機能

### Phase 3 (予定)

- Image 要素
- PageNumber 要素

### Phase 4 (将来)

- List 要素 (複雑なため後回し)
- Multi-page サポート

## 📖 関連ドキュメント

- [pdf-template-spec.md](/Users/y.noguchi/Code/diacom2Concept/pdf-template-spec.md) - 詳細な実装仕様
- [fitGap.md](/Users/y.noguchi/Code/diacom2Concept/fitGap.md) - sampleProject との FitGap 分析

## 🔧 開発者向けメモ

### デバッグログ

```typescript
import { createContextLogger } from '@logger';
const log = createContextLogger('ComponentName');

log.debug('Debug message', { data });
log.info('Info message');
log.warn('Warning message');
log.error('Error occurred', error);
```

### 型チェック & ビルド

```bash
# 型チェック
pnpm type-check

# ビルド
pnpm build
```

---

**Version**: 1.0.0 (Phase 1 MVP)
**Created**: 2025-10-20
**Module**: report-pdf
