# Slide Object Z-Index Control (前後関係変更機能) 設計書

report/bedLayout/Slide におけるオブジェクト（ベッドや什器など）の前後関係（Z-index）を変更する機能の設計案です。

## 1. 概要

ユーザーが配置したオブジェクトの重なり順を変更できるようにします。4つのアクションを提供します。

| アクション名 | Translation Key | アイコン (lucide-react) | 処理内容 |
| :--- | :--- | :--- | :--- |
| **最前面へ移動** | `ctx_bring_to_front` | `BringToFront` | 配列の末尾に移動 |
| **最背面へ移動** | `ctx_send_to_back` | `SendToBack` | 配列の先頭に移動 |
| **前面へ移動** | `ctx_bring_forward` | `ArrowUp` | 配列内で一つ後ろ(index+1)に移動 |
| **背面へ移動** | `ctx_send_backward` | `ArrowDown` | 配列内で一つ前(index-1)に移動 |

## 2. UI/UX デザイン

### 操作方法
オブジェクトを**右クリック**することでコンテキストメニューを表示します。

## 3. 技術的実装案

### 3.1 ファイル変更一覧

| ファイル | 変更内容 |
| :--- | :--- |
| `src/components/canvas/KonvaCanvasEditor.tsx` | `onContextMenu` prop追加 |
| `src/features/bed-layout-editor/BedLayoutEditor.tsx` | コンテキストメニュー状態管理、並び替えロジック追加 |
| `src/features/bed-layout-editor/components/ObjectContextMenu/ObjectContextMenu.tsx` | **新規作成** |
| `src/i18n/locales/ja.json` | 翻訳キー追加 |
| `src/i18n/locales/en.json` | 翻訳キー追加 |

### 3.2 `KonvaCanvasEditor` の変更

`onContextMenu` propを追加し、`CanvasElementRenderer` に渡します。

```typescript
// src/components/canvas/KonvaCanvasEditor.tsx

interface KonvaCanvasEditorProps {
  // ... existing props
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>, element: UnifiedNode) => void
}

export const KonvaCanvasEditor = forwardRef<KonvaCanvasEditorHandle, KonvaCanvasEditorProps>(
  (
    {
      // ... existing props
      onContextMenu, // 追加
    },
    ref
  ) => {
    // ...
    return (
      // ...
      <CanvasElementRenderer
        // ... existing props
        onContextMenu={(e) => onContextMenu?.(e, element)} // 追加
      />
    )
  }
)
```

### 3.3 `BedLayoutEditor` の変更

コンテキストメニューの状態管理と並び替えロジックを追加します。

```typescript
// src/features/bed-layout-editor/BedLayoutEditor.tsx
export const BedLayoutEditor = React.forwardRef<BedLayoutEditorHandle, KonvaEditorProps>(
  (props, ref) => {
    // ... destructuring including onReorderNodes
    
    // 並び替えハンドラ
    const handleReorder = React.useCallback(
      (action: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => {
        if (!contextMenu.elementId || !props.onReorderNodes) return

        const elements = document.nodes.filter((n) => n.s === resolvedSurfaceId)
        const currentIndex = elements.findIndex((el) => el.id === contextMenu.elementId)
        if (currentIndex === -1) return

        const newElements = [...elements]
        // ... (reorder logic) ...
        
        const otherNodes = document.nodes.filter((n) => n.s !== resolvedSurfaceId)
        const allOrderedNodes = [...otherNodes, ...newElements]
        props.onReorderNodes(allOrderedNodes.map(n => n.id))
      },
      [/*...*/]
    )

    // ...
  }
)
```

### 3.4 `BedLayoutEditorPage` (Consumer) の変更

コンシューマー側で `onReorderNodes` を受け取り、`reorder-elements` 操作を実行します。

```typescript
// BedLayoutEditorPage.tsx

<BedLayoutEditor
  // ...
  onReorderNodes={(nodeIds) => {
      executeBedOp({
          kind: 'reorder-elements',
          prevOrder: bedDoc.nodes.map(n => n.id),
          nextOrder: nodeIds,
      })
  }}
/>
```

### 3.4 `ObjectContextMenu` 新規作成

`TableContextMenu` を参考にしたコンテキストメニューコンポーネントです。

```typescript
// src/features/bed-layout-editor/components/ObjectContextMenu/ObjectContextMenu.tsx

import { ArrowDown, ArrowUp, BringToFront, SendToBack } from 'lucide-react'
import type React from 'react'
import { useEffect, useRef } from 'react'
import { useI18n } from '@/i18n/I18nContext'

interface ObjectContextMenuProps {
  visible: boolean
  x: number
  y: number
  onClose: () => void
  onAction: (action: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => void
}

export const ObjectContextMenu: React.FC<ObjectContextMenuProps> = ({
  visible,
  x,
  y,
  onClose,
  onAction,
}) => {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [visible, onClose])

  if (!visible) return null

  const itemClass =
    'flex items-center w-full px-3 py-2 text-sm text-left hover:bg-accent text-foreground gap-2 cursor-pointer'

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-popover text-popover-foreground border border-border rounded shadow-lg w-48 py-1"
      style={{ top: y, left: x }}
      onContextMenu={(e) => e.preventDefault()}
      role="menu"
      tabIndex={-1}
    >
      <button type="button" onClick={() => onAction('bringToFront')} className={itemClass}>
        <BringToFront className="w-4 h-4" />
        {t('ctx_bring_to_front', '最前面へ移動')}
      </button>
      <button type="button" onClick={() => onAction('sendToBack')} className={itemClass}>
        <SendToBack className="w-4 h-4" />
        {t('ctx_send_to_back', '最背面へ移動')}
      </button>
      <div className="my-1 border-t border-border" />
      <button type="button" onClick={() => onAction('bringForward')} className={itemClass}>
        <ArrowUp className="w-4 h-4" />
        {t('ctx_bring_forward', '前面へ移動')}
      </button>
      <button type="button" onClick={() => onAction('sendBackward')} className={itemClass}>
        <ArrowDown className="w-4 h-4" />
        {t('ctx_send_backward', '背面へ移動')}
      </button>
    </div>
  )
}
```

### 3.5 翻訳キー追加

```json
// src/i18n/locales/ja.json (追加分)
{
  "ctx_bring_to_front": "最前面へ移動",
  "ctx_send_to_back": "最背面へ移動",
  "ctx_bring_forward": "前面へ移動",
  "ctx_send_backward": "背面へ移動"
}
```

```json
// src/i18n/locales/en.json (追加分)
{
  "ctx_bring_to_front": "Bring to Front",
  "ctx_send_to_back": "Send to Back",
  "ctx_bring_forward": "Bring Forward",
  "ctx_send_backward": "Send Backward"
}
```

## 4. 検証計画

### 4.1 自動テスト

`Test/src/features/konva-editor/bedLayout/BedLayoutEditor.test.tsx` に以下のテストケースを追加します。

```typescript
// 追加テストケース概要
describe('Z-Index Context Menu', () => {
  it('shows context menu on right-click', () => {
    // 1. 複数要素を持つdocumentをrender
    // 2. 要素の右クリックをシミュレート
    // 3. コンテキストメニューが表示されることを確認
  })

  it('moves element to front when "Bring to Front" is clicked', () => {
    // 1. elements = [el1, el2, el3] をrender
    // 2. el1 を右クリック
    // 3. "最前面へ移動" をクリック
    // 4. onChangeElement が [el2, el3, el1] の順で呼ばれることを確認
  })
})
```

### 4.2 手動検証

1. アプリを起動
2. 複数のオブジェクトを重なるように配置
3. 下にあるオブジェクトを右クリック
4. 「最前面へ移動」をクリック
5. オブジェクトが最前面に移動することを確認
