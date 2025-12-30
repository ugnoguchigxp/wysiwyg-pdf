# 縦書きテキスト（Vertical Text）実装計画

## 背景
`Konva.Text` は標準で縦書き非対応のため、カスタム実装が必要です。
単なる「文字の積み重ね」ではなく、**日本語組版ルール（原稿用紙のようなマス目概念）** に則った美しいレンダリングを目指します。

---

## 要求仕様

### 1. データ構造
`TextNode` に `vertical: boolean` フラグを追加済み（`src/types/canvas.ts`）。

```typescript
// src/types/canvas.ts - TextNode に追加済み
export interface TextNode extends BaseNode {
  t: 'text';
  // ... 既存プロパティ ...
  
  // Vertical Orientation
  vertical?: boolean; // true if text is vertical (Tategaki)
}
```

将来の拡張に備え、`verticalOptions` を追加することも検討：

```typescript
// 将来的に追加する場合
interface VerticalTextOptions {
  autoIndent?: boolean;       // 段落頭の自動字下げ
  indentSize?: number;        // 字下げ量（0.5 = 半角分, 1 = 全角分）
  autoWrap?: boolean;         // 高さを超えた場合の自動折り返し
}
```

### 2. グリッドレイアウト（仮想ボディ）
各文字は正方形の「仮想マス（em-box）」の中央に配置されることを基本とする。

```
┌───────┐
│       │
│   あ  │  ← 通常文字: マス中央
│       │
└───────┘

┌───────┐
│ 。    │  ← 句読点・小書き: マス左上
│       │
│       │
└───────┘
```

### 3. 特例の配置ルール（日本語タイポグラフィ）

| カテゴリ | 対象文字 | 処理 |
|:---|:---|:---|
| **左上寄せ** | 句読点: `。、` | マスの左上に配置 |
| **左上寄せ** | 小書き平仮名: `っゃゅょぁぃぅぇぉゎ` | マスの左上に配置 |
| **左上寄せ** | 小書き片仮名: `ァィゥェォッャュョヮヵヶ` | マスの左上に配置 |
| **回転（90°）** | 長音: `ー` | 時計回り90度回転 |
| **回転（90°）** | 波ダッシュ: `〜～` | 時計回り90度回転 |
| **回転（90°）** | 省略符: `…‥` | 時計回り90度回転 |
| **回転（90°）** | 欧文・数字: `A-Za-z0-9` | 時計回り90度回転 |
| **縦書き用グリフ** | 括弧類: `「」『』（）【】〔〕` | 回転またはフォント内縦書きグリフを使用 |

### 4. 段落インデント（字下げ）
改行後の行頭は「半文字分〜1文字分」の空白を空ける。

### 5. 自動折り返し（Auto Wrap）
指定された高さを超えた場合、次の列（左隣）へテキストを送る。

---

## 実装コード例

### Phase 1: 文字種判定ロジック

**ファイル: `src/features/vertical-text/utils/glyph-detector.ts`**

```typescript
/**
 * 縦書き時の文字種判定ユーティリティ
 */

// 明示的な文字列で定義（Unicode範囲指定のミスを防ぐ）
const SMALL_HIRAGANA = 'っゃゅょぁぃぅぇぉゎ';
const SMALL_KATAKANA = 'ァィゥェォッャュョヮヵヶ';
const PUNCTUATION = '。、';
const ROTATED_SYMBOLS = 'ー〜～…‥－—';
const OPENING_BRACKETS = '「『（【〔［｛〈《';
const CLOSING_BRACKETS = '」』）】〕］｝〉》';

/**
 * 小書き仮名かどうかを判定
 */
export const isSmallKana = (char: string): boolean =>
  SMALL_HIRAGANA.includes(char) || SMALL_KATAKANA.includes(char);

/**
 * 句読点かどうかを判定
 */
export const isPunctuation = (char: string): boolean =>
  PUNCTUATION.includes(char);

/**
 * 左上寄せが必要な文字かどうか（句読点 + 小書き仮名）
 */
export const isTopLeftAlign = (char: string): boolean =>
  isSmallKana(char) || isPunctuation(char);

/**
 * 90度回転が必要な文字かどうか
 */
export const isRotatedChar = (char: string): boolean => {
  // 長音・ダッシュ系
  if (ROTATED_SYMBOLS.includes(char)) return true;
  // 半角英数字
  if (/^[a-zA-Z0-9]$/.test(char)) return true;
  return false;
};

/**
 * 括弧類かどうか（縦書き用グリフまたは回転が必要）
 */
export const isBracket = (char: string): boolean =>
  OPENING_BRACKETS.includes(char) || CLOSING_BRACKETS.includes(char);

/**
 * 開き括弧かどうか
 */
export const isOpeningBracket = (char: string): boolean =>
  OPENING_BRACKETS.includes(char);

/**
 * 閉じ括弧かどうか
 */
export const isClosingBracket = (char: string): boolean =>
  CLOSING_BRACKETS.includes(char);
```

---

### Phase 2: レイアウト計算エンジン

**ファイル: `src/features/vertical-text/utils/vertical-layout.ts`**

```typescript
import {
  isTopLeftAlign,
  isRotatedChar,
  isBracket,
} from './glyph-detector';

/**
 * 1文字分の描画情報
 */
export interface CharMetric {
  char: string;
  x: number;        // 描画X座標（マス左上基準）
  y: number;        // 描画Y座標（マス左上基準）
  offsetX: number;  // マス内でのX方向オフセット
  offsetY: number;  // マス内でのY方向オフセット
  rotation: number; // 回転角度（度）
  column: number;   // 何列目か（0始まり）
  row: number;      // 何行目か（0始まり）
}

export interface VerticalLayoutOptions {
  fontSize: number;
  columnSpacing?: number;   // 列間（fontSize に対する倍率, default: 1.5）
  letterSpacing?: number;   // 字間（fontSize に対する倍率, default: 0）
  autoIndent?: boolean;     // 段落頭の自動字下げ
  indentSize?: number;      // 字下げ量（default: 1 = 1文字分）
  maxHeight?: number;       // 自動折り返し用の最大高さ
}

/**
 * テキストを縦書きレイアウトに変換する
 * 
 * @param text - 入力テキスト（改行含む）
 * @param startX - 開始X座標（最初の列の右端）
 * @param startY - 開始Y座標（最初の行の上端）
 * @param options - レイアウトオプション
 * @returns 各文字の描画情報配列
 */
export function calculateVerticalLayout(
  text: string,
  startX: number,
  startY: number,
  options: VerticalLayoutOptions
): CharMetric[] {
  const {
    fontSize,
    columnSpacing = 1.5,
    letterSpacing = 0,
    autoIndent = true,
    indentSize = 1,
    maxHeight,
  } = options;

  const result: CharMetric[] = [];
  const paragraphs = text.split('\n');

  // 列間の実際のピクセル幅
  const columnWidth = fontSize * columnSpacing;
  // 文字送りの実際のピクセル高さ
  const charHeight = fontSize * (1 + letterSpacing);

  let currentColumn = 0;

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const paragraph = paragraphs[pIdx];
    const chars = Array.from(paragraph); // サロゲートペア対応

    // 段落の先頭かどうか
    const isParagraphStart = true;
    let rowInColumn = 0;

    // 段落インデント
    if (autoIndent && isParagraphStart && chars.length > 0) {
      rowInColumn = indentSize;
    }

    for (let cIdx = 0; cIdx < chars.length; cIdx++) {
      const char = chars[cIdx];

      // 現在の描画位置を計算
      let x = startX - currentColumn * columnWidth;
      let y = startY + rowInColumn * charHeight;

      // 自動折り返し判定
      if (maxHeight && y + fontSize > startY + maxHeight) {
        currentColumn++;
        rowInColumn = 0;
        x = startX - currentColumn * columnWidth;
        y = startY + rowInColumn * charHeight;
      }

      // 文字種別のオフセット・回転を計算
      const metric = calculateCharMetric(char, x, y, fontSize, currentColumn, rowInColumn);
      result.push(metric);

      rowInColumn++;
    }

    // 段落が変わるたびに新しい列へ（改行 = 次列へ進む）
    // ※ここではシンプルに「改行 = 次列」としているが、
    // 要件によっては「改行 = 同列で続ける」も考えられる
    currentColumn++;
  }

  return result;
}

/**
 * 1文字の描画メトリクスを計算
 */
function calculateCharMetric(
  char: string,
  baseX: number,
  baseY: number,
  fontSize: number,
  column: number,
  row: number
): CharMetric {
  let offsetX = 0;
  let offsetY = 0;
  let rotation = 0;

  if (isTopLeftAlign(char)) {
    // 左上寄せ: マスの左上1/4あたりに配置
    // Konvaの座標系: X右が正、Y下が正
    // 「左上」= X方向は負（左へ）、Y方向も負（上へ）
    offsetX = -fontSize * 0.25;
    offsetY = -fontSize * 0.25;
  } else if (isRotatedChar(char)) {
    // 90度回転
    rotation = 90;
    // 回転後の中央揃えのためのオフセット調整
    // Konvaでは rotation は図形の中心を基準に回転するため、
    // Text の場合は位置調整が必要になることがある
    offsetX = fontSize * 0.1;
    offsetY = fontSize * 0.1;
  } else if (isBracket(char)) {
    // 括弧は回転させる（フォントに縦書きグリフがない場合）
    rotation = 90;
  }

  return {
    char,
    x: baseX,
    y: baseY,
    offsetX,
    offsetY,
    rotation,
    column,
    row,
  };
}
```

---

### Phase 3: Konva レンダラーコンポーネント

**ファイル: `src/features/vertical-text/components/VerticalKonvaText.tsx`**

```tsx
import { Group, Text } from 'react-konva';
import type { TextNode } from '@/types/canvas';
import { calculateVerticalLayout, type CharMetric } from '../utils/vertical-layout';

interface VerticalKonvaTextProps {
  node: TextNode;
}

/**
 * 縦書きテキストをKonvaでレンダリングするコンポーネント
 */
export function VerticalKonvaText({ node }: VerticalKonvaTextProps) {
  const {
    x,
    y,
    w,
    h,
    text,
    fontSize = 16,
    font = 'Noto Sans JP',
    fill = '#000000',
  } = node;

  // レイアウト計算
  const charMetrics = calculateVerticalLayout(text, x + w, y, {
    fontSize,
    columnSpacing: 1.5,
    letterSpacing: 0,
    autoIndent: true,
    indentSize: 1,
    maxHeight: h,
  });

  return (
    <Group x={0} y={0}>
      {charMetrics.map((metric, index) => (
        <Text
          key={`${node.id}-char-${index}`}
          text={metric.char}
          x={metric.x + metric.offsetX}
          y={metric.y + metric.offsetY}
          fontSize={fontSize}
          fontFamily={font}
          fill={fill}
          rotation={metric.rotation}
          // 回転の基準点を文字の中央にする
          offsetX={metric.rotation !== 0 ? fontSize / 2 : 0}
          offsetY={metric.rotation !== 0 ? fontSize / 2 : 0}
        />
      ))}
    </Group>
  );
}
```

---

### Phase 4: 編集UI（オーバーレイ `<textarea>`）

**ファイル: `src/features/vertical-text/components/VerticalTextEditor.tsx`**

```tsx
import { useState, useRef, useEffect } from 'react';
import type { TextNode } from '@/types/canvas';

interface VerticalTextEditorProps {
  node: TextNode;
  stagePosition: { x: number; y: number };
  scale: number;
  onTextChange: (newText: string) => void;
  onClose: () => void;
}

/**
 * 縦書きテキスト編集用のオーバーレイエディタ
 * Canvas上に透明な <textarea> を重ねて編集させる
 */
export function VerticalTextEditor({
  node,
  stagePosition,
  scale,
  onTextChange,
  onClose,
}: VerticalTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(node.text);

  // マウント時にフォーカス
  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  // フォーカスが外れたら閉じる
  const handleBlur = () => {
    onTextChange(value);
    onClose();
  };

  // 位置・サイズ計算
  const style: React.CSSProperties = {
    position: 'absolute',
    left: stagePosition.x + node.x * scale,
    top: stagePosition.y + node.y * scale,
    width: node.w * scale,
    height: node.h * scale,
    fontSize: (node.fontSize ?? 16) * scale,
    fontFamily: node.font ?? 'Noto Sans JP',
    color: node.fill ?? '#000000',
    // 縦書きスタイル
    writingMode: 'vertical-rl',
    textOrientation: 'upright',
    // 背景を透明に
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: '1px dashed #007AFF',
    padding: '4px',
    resize: 'none',
    outline: 'none',
    overflow: 'hidden',
    zIndex: 1000,
  };

  return (
    <textarea
      ref={textareaRef}
      style={style}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        // Escapeで閉じる
        if (e.key === 'Escape') {
          onClose();
        }
      }}
    />
  );
}
```

---

### Phase 5: 統合（TextNodeレンダラーへの組み込み）

**概念コード: 既存のTextレンダラーに分岐を追加**

```tsx
// 既存の TextRenderer コンポーネント内

import { Text } from 'react-konva';
import { VerticalKonvaText } from '@/features/vertical-text';

function TextRenderer({ node }: { node: TextNode }) {
  // vertical フラグで分岐
  if (node.vertical) {
    return <VerticalKonvaText node={node} />;
  }

  // 従来の横書きレンダリング
  return (
    <Text
      x={node.x}
      y={node.y}
      width={node.w}
      height={node.h}
      text={node.text}
      fontSize={node.fontSize}
      fontFamily={node.font}
      fill={node.fill}
      // ... その他のプロパティ
    />
  );
}
```

---

## テスト計画

### ファイル構成

```
src/features/vertical-text/__tests__/
├── glyph-detector.test.ts
├── vertical-layout.test.ts
└── VerticalKonvaText.test.tsx
```

### テストケース例

**`glyph-detector.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  isSmallKana,
  isPunctuation,
  isTopLeftAlign,
  isRotatedChar,
} from '../utils/glyph-detector';

describe('glyph-detector', () => {
  describe('isSmallKana', () => {
    it('should return true for small hiragana', () => {
      expect(isSmallKana('っ')).toBe(true);
      expect(isSmallKana('ゃ')).toBe(true);
      expect(isSmallKana('ょ')).toBe(true);
    });

    it('should return true for small katakana', () => {
      expect(isSmallKana('ッ')).toBe(true);
      expect(isSmallKana('ャ')).toBe(true);
    });

    it('should return false for regular kana', () => {
      expect(isSmallKana('あ')).toBe(false);
      expect(isSmallKana('ア')).toBe(false);
    });
  });

  describe('isPunctuation', () => {
    it('should return true for Japanese punctuation', () => {
      expect(isPunctuation('。')).toBe(true);
      expect(isPunctuation('、')).toBe(true);
    });

    it('should return false for other characters', () => {
      expect(isPunctuation('.')).toBe(false);
      expect(isPunctuation(',')).toBe(false);
    });
  });

  describe('isRotatedChar', () => {
    it('should return true for long vowel mark', () => {
      expect(isRotatedChar('ー')).toBe(true);
    });

    it('should return true for alphanumeric', () => {
      expect(isRotatedChar('A')).toBe(true);
      expect(isRotatedChar('z')).toBe(true);
      expect(isRotatedChar('5')).toBe(true);
    });

    it('should return false for kanji', () => {
      expect(isRotatedChar('漢')).toBe(false);
    });
  });
});
```

---

## まとめ

本ドキュメントでは、以下の要素を含む **日本語縦書きレンダリングエンジン** の実装計画を示しました：

1. **仮想グリッド**: 原稿用紙のようなマス目ベースの配置
2. **文字種別オフセット**: 句読点・小書き文字の左上寄せ
3. **文字回転**: 長音・欧文の90度回転
4. **段落インデント**: 自動字下げ
5. **自動折り返し**: 高さ超過時の次列送り
6. **編集UI**: 縦書き `<textarea>` オーバーレイ

各フェーズの具体的なコード例を参照しながら実装を進めてください。
