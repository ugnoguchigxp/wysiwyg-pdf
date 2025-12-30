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
 * 右上寄せが必要な文字かどうか（句読点 + 小書き仮名）
 */
export const isTopRightAlign = (char: string): boolean =>
    isSmallKana(char) || isPunctuation(char);

/**
 * 90度回転が必要な文字かどうか
 * 縦書きでは横向きに表示すべき文字（長音記号など）
 * 
 * 注意: 英数字は回転せず正立表示する（text-orientation: upright と同じ挙動）
 * これにより、日本語の縦書き文書で英数字が自然に表示される
 */
export const isRotatedChar = (char: string): boolean => {
    // 長音・ダッシュ系のみ回転
    if (ROTATED_SYMBOLS.includes(char)) return true;
    // 英数字は回転しない（正立表示）
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
