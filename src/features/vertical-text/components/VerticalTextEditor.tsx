import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import type { TextNode } from '@/types/canvas';
import { calculateVerticalLayout } from '../utils/vertical-layout';
import type Konva from 'konva';

interface VerticalTextEditorProps {
    node: TextNode;
    stageNode: Konva.Stage | null;
    scale: number;
    onTextChange: (newText: string, rect?: { x: number; y: number; w: number; h: number }) => void;
    onClose: () => void;
}

/**
 * 縦書きテキスト編集用のオーバーレイエディタ
 * Canvas上に透明な <textarea> を重ねて編集させる
 */
export function VerticalTextEditor({
    node,
    stageNode,
    scale,
    onTextChange,
    onClose,
}: VerticalTextEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [value, setValue] = useState(node.text);
    const [style, setStyle] = useState<React.CSSProperties>({});

    // パディング（VerticalKonvaTextと合わせる）
    const padding = node.padding !== undefined ? node.padding : 10;

    // マウント時にフォーカス
    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    // スタイル計算（StandardTextEditOverlayと同じアプローチ）
    useLayoutEffect(() => {
        if (!stageNode || !node) return;

        // Konvaステージからノードを検索して絶対座標を取得
        const konvaNode = stageNode.findOne(`#${node.id}`);

        // ノードが見つからない場合はフォールバック座標を使用
        const absolutePosition = konvaNode
            ? konvaNode.getAbsolutePosition()
            : { x: (node.x || 0) * scale, y: (node.y || 0) * scale };

        if (!konvaNode) {
            console.warn(`VerticalTextEditor: Konva node not found for id "${node.id}". Using fallback position.`);
        }

        // 縦書きでは幅が列方向、高さが文字送り方向
        // min-width/min-heightで最小サイズを保証しつつ、コンテンツに合わせて拡張させる
        const newStyle: React.CSSProperties = {
            position: 'absolute',
            left: `${absolutePosition.x}px`,
            top: `${absolutePosition.y}px`,
            // 固定サイズではなく最小サイズを指定し、auto で拡張可能に
            minWidth: `${(node.w || 100) * scale}px`,
            minHeight: `${(node.h || 100) * scale}px`,
            width: 'auto',
            height: 'auto',
            fontSize: `${(node.fontSize ?? 16) * scale}px`,
            fontFamily: node.font ?? 'Noto Sans JP',
            color: node.fill ?? '#000000',
            // 縦書きスタイル（ブラウザ標準）
            // text-orientation: mixed を使用することで、
            // 英数字が横向き（Konva描画と同じ）になり、WYSIWYG体験が向上する
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            // 背景を半透明にして編集エリアをわかりやすくする
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            outline: '1px solid #007AFF',
            padding: `${padding * scale}px`,
            resize: 'none',
            overflow: 'visible',
            zIndex: 1000,
            lineHeight: 1.5,
            boxSizing: 'border-box',
            margin: 0,
            transformOrigin: 'top left',
            // テキストが折り返さないようにして、列方向（横）に拡張させる
            whiteSpace: 'pre',
        };

        setStyle(newStyle);
    }, [stageNode, node.id, node.x, node.y, scale, padding, node.fontSize, node.font, node.fill]);

    // フォーカスが外れたら閉じる
    const handleBlur = () => {
        onTextChange(value, {
            x: node.x || 0,
            y: node.y || 0,
            w: node.w || 100,
            h: node.h || 100
        });
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setValue(newValue);

        // サイズ再計算
        // 注意: VerticalKonvaText と同じオプションを使用して一貫性を確保
        const fontSize = node.fontSize ?? 16;
        const metrics = calculateVerticalLayout(newValue, 0, 0, {
            fontSize,
            columnSpacing: 1.5,
            letterSpacing: 0,
            // autoIndent は VerticalKonvaText と合わせて false（デフォルト）
        });

        if (metrics.length > 0) {
            const maxY = metrics.reduce((max, m) => Math.max(max, m.y + fontSize), 0);
            const minX = metrics.reduce((min, m) => Math.min(min, m.x), 0);
            const maxX = metrics.reduce((max, m) => Math.max(max, m.x), 0);

            const colWidth = fontSize * 1.5;
            const calculatedContentWidth = (maxX - minX) + colWidth;
            const calculatedContentHeight = maxY;

            const newW = calculatedContentWidth + (padding * 2);
            const newH = calculatedContentHeight + (padding * 2);

            const currentW = node.w || 100;
            const currentX = node.x || 0;
            const deltaW = newW - currentW;
            const newX = currentX - deltaW;

            onTextChange(newValue, {
                x: newX,
                y: node.y || 0,
                w: newW,
                h: newH
            });
        } else {
            onTextChange(newValue, {
                x: node.x || 0,
                y: node.y || 0,
                w: node.w || 100,
                h: node.h || 100
            });
        }
    };

    return (
        <textarea
            ref={textareaRef}
            style={style}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={(e) => {
                if (e.key === 'Escape') {
                    textareaRef.current?.blur();
                }
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    textareaRef.current?.blur();
                }
            }}
        />
    );
}
