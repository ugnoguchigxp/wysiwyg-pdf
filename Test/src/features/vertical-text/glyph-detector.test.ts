import { describe, it, expect } from 'vitest';
import {
    isSmallKana,
    isPunctuation,
    isTopRightAlign,
    isRotatedChar,
    isBracket,
} from '@/features/vertical-text/utils/glyph-detector';

describe('glyph-detector', () => {
    describe('isSmallKana', () => {
        it('should return true for small hiragana', () => {
            expect(isSmallKana('っ')).toBe(true);
            expect(isSmallKana('ゃ')).toBe(true);
            expect(isSmallKana('ょ')).toBe(true);
            // 新しく追加した文字
            expect(isSmallKana('ゎ')).toBe(true);
        });

        it('should return true for small katakana', () => {
            expect(isSmallKana('ッ')).toBe(true);
            expect(isSmallKana('ャ')).toBe(true);
            // 新しく追加した文字
            expect(isSmallKana('ヮ')).toBe(true);
            expect(isSmallKana('ヵ')).toBe(true);
            expect(isSmallKana('ヶ')).toBe(true);
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

    describe('isTopRightAlign', () => {
        it('should return true for small kana and punctuation', () => {
            expect(isTopRightAlign('っ')).toBe(true);
            expect(isTopRightAlign('。')).toBe(true);
        });
        it('should return false for others', () => {
            expect(isTopRightAlign('あ')).toBe(false);
        });
    });

    describe('isRotatedChar', () => {
        it('should return true for long vowel mark and similar symbols', () => {
            expect(isRotatedChar('ー')).toBe(true);
            expect(isRotatedChar('〜')).toBe(true);
            expect(isRotatedChar('～')).toBe(true);
            expect(isRotatedChar('…')).toBe(true);
            expect(isRotatedChar('‥')).toBe(true);
        });

        it('should return false for alphanumeric (displayed upright)', () => {
            // 英数字は回転せず正立表示する
            expect(isRotatedChar('A')).toBe(false);
            expect(isRotatedChar('z')).toBe(false);
            expect(isRotatedChar('5')).toBe(false);
        });

        it('should return false for fullwidth alphanumeric (displayed upright)', () => {
            // 全角英数字も回転せず正立表示する
            expect(isRotatedChar('Ａ')).toBe(false);
            expect(isRotatedChar('ｚ')).toBe(false);
            expect(isRotatedChar('５')).toBe(false);
        });

        it('should return false for kanji', () => {
            expect(isRotatedChar('漢')).toBe(false);
        });
    });

    describe('isBracket', () => {
        it('should return true for brackets', () => {
            expect(isBracket('「')).toBe(true);
            expect(isBracket('」')).toBe(true);
            expect(isBracket('（')).toBe(true);
            expect(isBracket('）')).toBe(true);
        });
        it('should return false for non-brackets', () => {
            expect(isBracket('あ')).toBe(false);
        });
    });
});
