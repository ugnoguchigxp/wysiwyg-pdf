import { useEffect, useState } from 'react';
import { Rect } from 'react-konva';

interface VerticalCaretProps {
    x: number;
    y: number;
    width: number; // カレットの幅（横向きなので文字幅程度）
    visible?: boolean;
}

/**
 * 縦書きテキスト用の点滅カレット（入力位置表示）
 * 縦書きでは横向きのカレット（─）を使用
 */
export function VerticalCaret({ x, y, width, visible = true }: VerticalCaretProps) {
    const [isVisible, setIsVisible] = useState(true);

    // 点滅アニメーション
    useEffect(() => {
        if (!visible) return;

        const interval = setInterval(() => {
            setIsVisible((prev) => !prev);
        }, 530); // 標準的なカーソル点滅速度

        return () => clearInterval(interval);
    }, [visible]);

    if (!visible) return null;

    // 縦書き用の横向きカレット
    // 幅 = フォントサイズ程度、高さ = 2px（細い線）
    return (
        <Rect
            x={x}
            y={y}
            width={width}
            height={1.5} // 細い線
            fill={isVisible ? '#007AFF' : 'transparent'}
            listening={false}
        />
    );
}
