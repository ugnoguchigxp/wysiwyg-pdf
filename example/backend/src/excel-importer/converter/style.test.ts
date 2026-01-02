import { convertCellStyle, borderWidth, pickBorder } from '../converter/style';
import { convertCell } from '../converter/cell';
import { DEFAULT_IMPORT_OPTIONS } from '../types/options';

describe('borderWidth', () => {
    test('returns default width for undefined style', () => {
        expect(borderWidth(undefined)).toBe(0.2);
    });

    test('returns correct width for thin', () => {
        expect(borderWidth('thin')).toBe(0.2);
    });

    test('returns correct width for medium', () => {
        expect(borderWidth('medium')).toBe(0.5);
    });

    test('returns correct width for thick', () => {
        expect(borderWidth('thick')).toBe(0.7);
    });

    test('returns correct width for double', () => {
        expect(borderWidth('double')).toBe(0.7);
    });

    test('returns correct width for dotted', () => {
        expect(borderWidth('dotted')).toBe(0.2);
    });

    test('returns correct width for dashed', () => {
        expect(borderWidth('dashed')).toBe(0.25);
    });

    test('returns correct width for hair', () => {
        expect(borderWidth('hair')).toBe(0.1);
    });

    test('returns correct width for mediumDashed', () => {
        expect(borderWidth('mediumDashed')).toBe(0.5);
    });

    test('returns correct width for dashDot', () => {
        expect(borderWidth('dashDot')).toBe(0.25);
    });

    test('returns correct width for mediumDashDot', () => {
        expect(borderWidth('mediumDashDot')).toBe(0.5);
    });

    test('returns correct width for dashDotDot', () => {
        expect(borderWidth('dashDotDot')).toBe(0.25);
    });

    test('returns correct width for mediumDashDotDot', () => {
        expect(borderWidth('mediumDashDotDot')).toBe(0.5);
    });

    test('returns correct width for slantDashDot', () => {
        expect(borderWidth('slantDashDot')).toBe(0.35);
    });

    test('returns 0 for none', () => {
        expect(borderWidth('none')).toBe(0);
    });
});

describe('convertCellStyle', () => {
    test('returns empty object for undefined style', () => {
        expect(convertCellStyle(undefined, DEFAULT_IMPORT_OPTIONS)).toEqual({});
    });

    test('converts background fill', () => {
        const style = {
            fill: { type: 'solid' as const, color: { argb: 'FFFF0000' } },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.bg).toBeTruthy();
    });

    test('converts borders', () => {
        const style = {
            border: {
                top: { style: 'thin' as const, color: { argb: 'FF000000' } },
                right: { style: 'medium' as const, color: { argb: 'FF000000' } },
                bottom: { style: 'thick' as const, color: { argb: 'FF000000' } },
                left: { style: 'double' as const, color: { argb: 'FF000000' } },
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.borders).toBeDefined();
        expect(result.borders?.t?.style).toBe('solid');
        expect(result.borders?.t?.width).toBe(0.2);
        expect(result.borders?.r?.width).toBe(0.5);
        expect(result.borders?.b?.width).toBe(0.7);
        expect(result.borders?.l?.width).toBe(0.7);
    });

    test('converts single border side', () => {
        const style = {
            border: {
                top: { style: 'thick' as const, color: { argb: 'FFFF0000' } },
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.borders).toBeDefined();
        expect(result.borders?.t?.style).toBe('solid');
        expect(result.borders?.t?.width).toBe(0.7);
        expect(result.borders?.t?.color).toBe('#FF0000');
        expect(result.borders?.r).toBeUndefined();
        expect(result.borders?.b).toBeUndefined();
        expect(result.borders?.l).toBeUndefined();
    });

    test('converts border without color', () => {
        const style = {
            border: {
                top: { style: 'thick' as const },
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.borders?.t?.color).toBe('#000000');
    });

    test('sets legacy border properties for backward compatibility', () => {
        const style = {
            border: {
                top: { style: 'thick' as const, color: { argb: 'FFFF0000' } },
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.border).toBe('solid');
        expect(result.borderColor).toBeTruthy();
        expect(result.borderW).toBe(0.7);
    });

    test('does not set legacy border when no borders present', () => {
        const style = {};
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.border).toBeUndefined();
        expect(result.borderColor).toBeUndefined();
        expect(result.borderW).toBeUndefined();
    });

    test('converts font', () => {
        const style = {
            font: {
                name: 'Arial',
                size: 14,
                bold: true,
                italic: true,
                strike: true,
                color: { argb: 'FF000000' },
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.font).toBe('Noto Sans');
        expect(result.fontSize).toBeCloseTo(4.94, 2);
        expect(result.color).toBe('#000000');
        expect(result.bold).toBe(true);
        expect(result.italic).toBe(true);
        expect(result.strike).toBe(true);
    });

    test('handles font with undefined name', () => {
        const style: any = {
            font: { size: 12 },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.font).toBeUndefined();
        expect(result.fontSize).toBeCloseTo(4.2333, 4);
    });

    test('handles font without color', () => {
        const style: any = {
            font: { name: 'Arial', size: 14 },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.color).toBeUndefined();
    });

    test('handles font with underline property', () => {
        const style: any = {
            font: { name: 'Arial', size: 12, underline: true },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.font).toBe('Noto Sans');
    });

    test('handles font with only name', () => {
        const style: any = {
            font: { name: 'Arial' },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.font).toBe('Noto Sans');
        expect(result.fontSize).toBeUndefined();
    });

    test('handles font with only size', () => {
        const style: any = {
            font: { size: 14 },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.fontSize).toBeCloseTo(4.94, 2);
    });

    test('converts alignment', () => {
        const style = {
            alignment: {
                horizontal: 'center' as const,
                vertical: 'middle' as const,
                wrapText: true,
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.align).toBe('c');
        expect(result.vAlign).toBe('m');
        expect(result.wrap).toBe(true);
    });

    test('handles alignment without wrapText', () => {
        const style = {
            alignment: {
                horizontal: 'left' as const,
                vertical: 'top' as const,
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.align).toBe('l');
        expect(result.vAlign).toBe('t');
        expect(result.wrap).toBeUndefined();
    });

    test('handles fill alignment', () => {
        const style = {
            alignment: {
                horizontal: 'fill' as const,
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.align).toBe('l');
    });

    test('handles justify alignment', () => {
        const style = {
            alignment: {
                horizontal: 'justify' as const,
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.align).toBe('l');
    });

    test('handles centerContinuous alignment', () => {
        const style: any = {
            alignment: {
                horizontal: 'centerContinuous',
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.align).toBe('l');
    });

    test('handles distributed alignment', () => {
        const style: any = {
            alignment: {
                horizontal: 'distributed',
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.align).toBe('c');
    });

    test('handles undefined horizontal alignment', () => {
        const style = {
            alignment: {
                vertical: 'middle' as const,
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.align).toBeUndefined();
    });

    test('handles undefined vertical alignment', () => {
        const style = {
            alignment: {
                horizontal: 'center' as const,
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.vAlign).toBeUndefined();
    });

    test('maps Japanese fonts', () => {
        const style = {
            font: { name: 'MS Gothic', size: 12 },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.font).toBe('Noto Sans JP');
    });

    test('uses custom font mapping', () => {
        const style = {
            font: { name: 'CustomFont', size: 12 },
        };
        const options = { ...DEFAULT_IMPORT_OPTIONS, fontMapping: { CustomFont: 'MappedFont' } };
        const result = convertCellStyle(style, options);
        expect(result.font).toBe('MappedFont');
    });

    test('uses custom default font for font without name', () => {
        const style: any = {
            font: { size: 12 },
        };
        const options = { ...DEFAULT_IMPORT_OPTIONS, defaultFont: 'CustomDefault' };
        const result = convertCellStyle(style, options);
        expect(result.font).toBeUndefined();
    });

    test('handles border without color', () => {
        const style = {
            border: {
                top: { style: 'thick' as const },
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.borders?.t?.color).toBe('#000000');
    });

    test('converts all border sides', () => {
        const style = {
            border: {
                top: { style: 'thin' as const, color: { argb: 'FF000000' } },
                right: { style: 'medium' as const, color: { argb: 'FF000000' } },
                bottom: { style: 'thick' as const, color: { argb: 'FF000000' } },
                left: { style: 'double' as const, color: { argb: 'FF000000' } },
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.borders).toBeDefined();
        expect(result.borders?.t?.width).toBe(0.2);
        expect(result.borders?.r?.width).toBe(0.5);
        expect(result.borders?.b?.width).toBe(0.7);
        expect(result.borders?.l?.width).toBe(0.7);
    });
});

describe('pickBorder', () => {
    test('returns undefined for no borders', () => {
        expect(pickBorder(undefined)).toBeUndefined();
    });

    test('returns undefined for empty border object', () => {
        expect(pickBorder({})).toBeUndefined();
    });

    test('returns top border when all sides have borders', () => {
        const border = {
            top: { style: 'thin' as const, color: { argb: 'FF000000' } },
            right: { style: 'medium' as const, color: { argb: 'FF000000' } },
            bottom: { style: 'thick' as const, color: { argb: 'FF000000' } },
            left: { style: 'double' as const, color: { argb: 'FF000000' } },
        };
        const result = pickBorder(border);
        expect(result).toEqual({ style: 'thin', color: { argb: 'FF000000' } });
    });

    test('skips borders with none style', () => {
        const border = {
            top: { style: 'none' as const, color: { argb: 'FF000000' } },
            right: { style: 'medium' as const, color: { argb: 'FF000000' } },
            bottom: { style: 'thick' as const, color: { argb: 'FF000000' } },
            left: { style: 'double' as const, color: { argb: 'FF000000' } },
        };
        const result = pickBorder(border);
        expect(result).toEqual({ style: 'medium', color: { argb: 'FF000000' } });
    });

    test('returns diagonal border when other sides are none', () => {
        const border = {
            diagonal: { style: 'thin' as const, color: { argb: 'FF000000' } },
        };
        const result = pickBorder(border);
        expect(result).toEqual({ style: 'thin', color: { argb: 'FF000000' } });
    });
});

describe('convertCellStyle', () => {
    test('returns empty object for undefined style', () => {
        expect(convertCellStyle(undefined, DEFAULT_IMPORT_OPTIONS)).toEqual({});
    });

    test('converts background fill', () => {
        const style = {
            fill: { type: 'solid' as const, color: { argb: 'FFFF0000' } },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.bg).toBeTruthy();
    });

    test('converts borders', () => {
        const style = {
            border: {
                top: { style: 'thin' as const, color: { argb: 'FF000000' } },
                right: { style: 'medium' as const, color: { argb: 'FF000000' } },
                bottom: { style: 'thick' as const, color: { argb: 'FF000000' } },
                left: { style: 'double' as const, color: { argb: 'FF000000' } },
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.borders).toBeDefined();
        expect(result.borders?.t?.style).toBe('solid');
        expect(result.borders?.t?.width).toBe(0.2);
        expect(result.borders?.r?.width).toBe(0.5);
        expect(result.borders?.b?.width).toBe(0.7);
        expect(result.borders?.l?.width).toBe(0.7);
    });

    test('sets legacy border properties for backward compatibility', () => {
        const style = {
            border: {
                top: { style: 'thick' as const, color: { argb: 'FFFF0000' } },
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.border).toBe('solid');
        expect(result.borderColor).toBeTruthy();
        expect(result.borderW).toBe(0.7);
    });

    test('does not set legacy border when no borders present', () => {
        const style = {};
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.border).toBeUndefined();
        expect(result.borderColor).toBeUndefined();
        expect(result.borderW).toBeUndefined();
    });

    test('converts font', () => {
        const style = {
            font: {
                name: 'Arial',
                size: 14,
                bold: true,
                italic: true,
                strike: true,
                color: { argb: 'FF000000' },
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.font).toBe('Noto Sans');
        expect(result.fontSize).toBeCloseTo(4.94, 2);
        expect(result.color).toBe('#000000');
        expect(result.bold).toBe(true);
        expect(result.italic).toBe(true);
        expect(result.strike).toBe(true);
    });

    test('handles font with undefined name', () => {
        const style: any = {
            font: { size: 12 },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.font).toBeUndefined();
        expect(result.fontSize).toBeCloseTo(4.2333, 4);
    });

    test('handles font without color', () => {
        const style: any = {
            font: { name: 'Arial', size: 14 },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.color).toBeUndefined();
    });

    test('handles font with underline property', () => {
        const style: any = {
            font: { name: 'Arial', size: 12, underline: true },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.font).toBe('Noto Sans');
    });

    test('converts alignment', () => {
        const style = {
            alignment: {
                horizontal: 'center' as const,
                vertical: 'middle' as const,
                wrapText: true,
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.align).toBe('c');
        expect(result.vAlign).toBe('m');
        expect(result.wrap).toBe(true);
    });

    test('handles alignment without wrapText', () => {
        const style = {
            alignment: {
                horizontal: 'left' as const,
                vertical: 'top' as const,
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.align).toBe('l');
        expect(result.vAlign).toBe('t');
        expect(result.wrap).toBeUndefined();
    });

    test('handles fill alignment', () => {
        const style = {
            alignment: {
                horizontal: 'fill' as const,
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.align).toBe('l');
    });

    test('handles justify alignment', () => {
        const style = {
            alignment: {
                horizontal: 'justify' as const,
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.align).toBe('l');
    });

    test('handles centerContinuous alignment', () => {
        const style: any = {
            alignment: {
                horizontal: 'centerContinuous',
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.align).toBe('l');
    });

    test('handles distributed alignment', () => {
        const style = {
            alignment: {
                horizontal: 'distributed' as const,
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.align).toBe('c');
    });

    test('maps Japanese fonts', () => {
        const style = {
            font: { name: 'MS Gothic', size: 12 },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.font).toBe('Noto Sans JP');
    });

    test('uses custom font mapping', () => {
        const style = {
            font: { name: 'CustomFont', size: 12 },
        };
        const options = { ...DEFAULT_IMPORT_OPTIONS, fontMapping: { CustomFont: 'MappedFont' } };
        const result = convertCellStyle(style, options);
        expect(result.font).toBe('MappedFont');
    });

    test('uses custom default font for font without name', () => {
        const style: any = {
            font: { size: 12 },
        };
        const options = { ...DEFAULT_IMPORT_OPTIONS, defaultFont: 'CustomDefault' };
        const result = convertCellStyle(style, options);
        expect(result.font).toBeUndefined();
    });

    test('handles border without color', () => {
        const style = {
            border: {
                top: { style: 'thick' as const },
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.borders?.t?.color).toBe('#000000');
    });
});

describe('convertCell', () => {
    test('converts cell with string value', () => {
        const cell = {
            row: 0,
            col: 0,
            value: 'test',
            style: {},
        };
        const result = convertCell(cell, DEFAULT_IMPORT_OPTIONS);
        expect(result.r).toBe(0);
        expect(result.c).toBe(0);
        expect(result.v).toBe('test');
    });

    test('converts cell with number value', () => {
        const cell = {
            row: 0,
            col: 0,
            value: 123.45,
            style: {},
        };
        const result = convertCell(cell, DEFAULT_IMPORT_OPTIONS);
        expect(result.v).toBe('123.45');
    });

    test('converts cell with boolean value', () => {
        const cell = {
            row: 0,
            col: 0,
            value: true,
            style: {},
        };
        const result = convertCell(cell, DEFAULT_IMPORT_OPTIONS);
        expect(result.v).toBe('TRUE');
    });

    test('preserves formula when preserveFormulas is true', () => {
        const cell = {
            row: 0,
            col: 0,
            value: 50,
            formula: '=SUM(A1:A5)',
            style: {},
        };
        const options = { ...DEFAULT_IMPORT_OPTIONS, preserveFormulas: true };
        const result = convertCell(cell, options);
        expect(result.v).toBe('==SUM(A1:A5)');
    });

    test('formats currency values', () => {
        const cell = {
            row: 0,
            col: 0,
            value: 1234.56,
            style: { numberFormat: '$#,##0.00' },
        };
        const result = convertCell(cell, DEFAULT_IMPORT_OPTIONS);
        expect(result.v).toContain('$');
        expect(result.v).toContain('1,234.56');
    });

    test('formats date values', () => {
        const cell = {
            row: 0,
            col: 0,
            value: new Date('2024-01-01T00:00:00Z'),
            style: { numberFormat: 'yyyy/MM/dd' },
        };
        const result = convertCell(cell, DEFAULT_IMPORT_OPTIONS);
        expect(result.v).toContain('2024');
    });

    test('converts rich text', () => {
        const cell = {
            row: 0,
            col: 0,
            value: {
                richText: [
                    { text: 'Hello ', font: { name: 'Arial', size: 11, bold: true } },
                    { text: 'World', font: { name: 'Arial', size: 11, color: { argb: 'FFFF0000' } } },
                ],
            },
            style: {},
        };
        const result = convertCell(cell, DEFAULT_IMPORT_OPTIONS);
        expect(result.richText).toBeDefined();
        expect(result.richText).toHaveLength(2);
        expect(result.richText?.[0].text).toBe('Hello ');
        expect(result.richText?.[0].bold).toBe(true);
        expect(result.richText?.[1].text).toBe('World');
        expect(result.richText?.[1].color).toBeTruthy();
    });

    test('handles null value', () => {
        const cell = {
            row: 0,
            col: 0,
            value: null,
            style: {},
        };
        const result = convertCell(cell, DEFAULT_IMPORT_OPTIONS);
        expect(result.v).toBe('');
    });

    test('handles undefined value', () => {
        const cell = {
            row: 0,
            col: 0,
            value: undefined,
            style: {},
        };
        const result = convertCell(cell, DEFAULT_IMPORT_OPTIONS);
        expect(result.v).toBe('undefined');
    });
});

describe('convertCellStyle - detailed', () => {
    test('converts background fill without color', () => {
        const style = {
            fill: { type: 'solid' as const },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.bg).toBeUndefined();
    });

    test('converts borders with single side', () => {
        const style = {
            border: {
                top: { style: 'thin' as const, color: { argb: 'FF000000' } },
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.borders?.t).toBeDefined();
        expect(result.borders?.t?.width).toBe(0.2);
        expect(result.borders?.t?.color).toBe('#000000');
        expect(result.borders?.r).toBeUndefined();
        expect(result.borders?.b).toBeUndefined();
        expect(result.borders?.l).toBeUndefined();
    });

    test('converts borders with diagonal only', () => {
        const style: any = {
            border: {
                diagonal: { style: 'thin' as const, color: { argb: 'FF000000' } },
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.borders).toBeDefined();
    });

    test('converts font with only bold', () => {
        const style = {
            font: { name: 'Arial', bold: true },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.font).toBe('Noto Sans');
        expect(result.bold).toBe(true);
        expect(result.fontSize).toBeUndefined();
        expect(result.italic).toBeUndefined();
        expect(result.strike).toBeUndefined();
    });

    test('converts font with only italic', () => {
        const style = {
            font: { name: 'Arial', italic: true },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.font).toBe('Noto Sans');
        expect(result.bold).toBeUndefined();
        expect(result.italic).toBe(true);
        expect(result.strike).toBeUndefined();
    });

    test('converts font with only strike', () => {
        const style = {
            font: { name: 'Arial', strike: true },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.font).toBe('Noto Sans');
        expect(result.strike).toBe(true);
        expect(result.bold).toBeUndefined();
        expect(result.italic).toBeUndefined();
    });

    test('converts alignment with all properties', () => {
        const style: any = {
            alignment: {
                horizontal: 'center',
                vertical: 'bottom',
                wrapText: false,
                indent: 2,
                textRotation: 45,
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.align).toBe('c');
        expect(result.vAlign).toBe('b');
        expect(result.wrap).toBeUndefined();
    });

    test('converts complex style with all properties', () => {
        const style = {
            fill: { type: 'solid' as const, color: { argb: 'FFFFFF00' } },
            border: {
                top: { style: 'thin' as const, color: { argb: 'FF000000' } },
                right: { style: 'medium' as const, color: { argb: 'FF000000' } },
                bottom: { style: 'thick' as const, color: { argb: 'FF000000' } },
                left: { style: 'double' as const, color: { argb: 'FF000000' } },
            },
            font: {
                name: 'Arial',
                size: 14,
                bold: true,
                italic: false,
                strike: false,
                color: { argb: 'FF0000FF' },
            },
            alignment: {
                horizontal: 'center' as const,
                vertical: 'middle' as const,
                wrapText: true,
            },
        };
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.bg).toBeDefined();
        expect(result.borders).toBeDefined();
        expect(result.font).toBe('Noto Sans');
        expect(result.fontSize).toBeCloseTo(4.94, 2);
        expect(result.color).toBe('#0000FF');
        expect(result.bold).toBe(true);
        expect(result.align).toBe('c');
        expect(result.vAlign).toBe('m');
        expect(result.wrap).toBe(true);
    });

    test('handles empty style object', () => {
        const style = {};
        const result = convertCellStyle(style, DEFAULT_IMPORT_OPTIONS);
        expect(result.bg).toBeUndefined();
        expect(result.borders).toBeUndefined();
        expect(result.font).toBeUndefined();
        expect(result.fontSize).toBeUndefined();
        expect(result.color).toBeUndefined();
        expect(result.bold).toBeUndefined();
        expect(result.italic).toBeUndefined();
        expect(result.strike).toBeUndefined();
        expect(result.align).toBeUndefined();
        expect(result.vAlign).toBeUndefined();
        expect(result.wrap).toBeUndefined();
    });
});
