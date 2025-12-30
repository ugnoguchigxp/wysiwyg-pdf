import { describe, it, expect } from 'vitest';
import { calculateVerticalLayout } from '../utils/vertical-layout';

describe('vertical-layout', () => {
    const fontSize = 20;
    const startX = 100;
    const startY = 0;

    it('should layout basic characters vertically', () => {
        // 3文字の単純なテキスト
        const text = 'あいう';
        const metrics = calculateVerticalLayout(text, startX, startY, { fontSize });

        expect(metrics).toHaveLength(3);

        // 1列目なので X は変わらない
        expect(metrics[0].x).toBe(startX);
        expect(metrics[1].x).toBe(startX);
        expect(metrics[2].x).toBe(startX);

        // Y は 1文字分(fontSize) ずつ増える (autoIndent=false がデフォルトになった)
        expect(metrics[0].y).toBe(startY);
        expect(metrics[1].y).toBe(startY + fontSize);
        expect(metrics[2].y).toBe(startY + fontSize * 2);
    });

    it('should handle indentation correctly', () => {
        const text = 'あ';

        // autoIndent: true
        const metricsWithIndent = calculateVerticalLayout(text, startX, startY, { fontSize, indentSize: 1, autoIndent: true });
        // row 0 はスキップされ、row 1 から始まるはず
        expect(metricsWithIndent[0].row).toBe(1);
        expect(metricsWithIndent[0].y).toBe(startY + fontSize);

        // autoIndent: false (default)
        const metricsNoIndent = calculateVerticalLayout(text, startX, startY, { fontSize });
        // row 0 から始まるはず
        expect(metricsNoIndent[0].row).toBe(0);
        expect(metricsNoIndent[0].y).toBe(startY);
    });

    it('should handle multiple columns (newlines)', () => {
        const text = 'あい\nうえ'; // 2文字 + 改行 + 2文字
        const metrics = calculateVerticalLayout(text, startX, startY, { fontSize, columnSpacing: 1.5 });

        // あ
        expect(metrics[0].char).toBe('あ');
        expect(metrics[0].column).toBe(0);
        expect(metrics[0].x).toBe(startX);

        // い
        expect(metrics[1].char).toBe('い');
        expect(metrics[1].column).toBe(0);
        expect(metrics[1].x).toBe(startX);

        // う (2列目)
        expect(metrics[2].char).toBe('う');
        expect(metrics[2].column).toBe(1);
        // colWidth = 20 * 1.5 = 30
        // 2列目のX = startX - 30
        expect(metrics[2].x).toBe(startX - 30);

        // え
        expect(metrics[3].char).toBe('え');
        expect(metrics[3].column).toBe(1);
    });

    it('should handle auto-wrap (maxHeight)', () => {
        // maxHeight を 2文字分 (40px) に設定 -> 3文字目は次列へ行くはず
        const text = 'あいう';
        const metrics = calculateVerticalLayout(text, startX, startY, {
            fontSize,
            maxHeight: 40,
        });

        // あ (y=0) -> OK
        expect(metrics[0].char).toBe('あ');
        expect(metrics[0].column).toBe(0);

        // い (y=20) -> 20 + 20(fontSize) = 40 <= 40 -> OK
        expect(metrics[1].char).toBe('い');
        expect(metrics[1].column).toBe(0);

        // う (y=40) -> 40 + 20 = 60 > 40 -> Wrap! (column 1)
        expect(metrics[2].char).toBe('う');
        expect(metrics[2].column).toBe(1);
        expect(metrics[2].row).toBe(0); // 新しい列の先頭
    });

    it('should align punctuation to top-right', () => {
        const text = '。';
        const metrics = calculateVerticalLayout(text, startX, startY, { fontSize });

        // isTopRightAlign('。') is true
        // offsetX = fontSize * 0.55 = 11
        // offsetY = -fontSize * 0.55 = -11
        expect(metrics[0].offsetX).toBe(11);
        expect(metrics[0].offsetY).toBe(-11);
    });

    it('should display english characters upright (not rotated)', () => {
        const text = 'A';
        const metrics = calculateVerticalLayout(text, startX, startY, { fontSize });

        // 英数字は回転せず正立表示する
        expect(metrics[0].rotation).toBe(0);
        // 回転しないのでオフセットは 0
        expect(metrics[0].offsetX).toBe(0);
        expect(metrics[0].offsetY).toBe(0);
    });
});
