import { parseCellStyle } from '../parser/style';

describe('parseCellStyle', () => {
    test('returns empty object for undefined style', () => {
        expect(parseCellStyle(undefined)).toEqual({});
    });

    test('parses font information', () => {
        const style = {
            font: {
                name: 'Arial',
                size: 12,
                bold: true,
                italic: true,
                underline: true,
                strike: true,
                color: { argb: 'FFFF0000' },
            },
        };
        const result = parseCellStyle(style);
        expect(result.font).toEqual({
            name: 'Arial',
            size: 12,
            bold: true,
            italic: true,
            underline: true,
            strike: true,
            color: { argb: 'FFFF0000' },
        });
    });

    test('uses default font values when not specified', () => {
        const style = { font: {} };
        const result = parseCellStyle(style);
        expect(result.font).toEqual({
            name: 'Calibri',
            size: 11,
        });
    });

    test('parses solid fill', () => {
        const style = {
            fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF00FF00' },
            },
        };
        const result = parseCellStyle(style);
        expect(result.fill).toEqual({
            type: 'solid',
            color: { argb: 'FF00FF00' },
        });
    });

    test('returns undefined for none pattern fill', () => {
        const style = {
            fill: {
                type: 'pattern',
                pattern: 'none',
            },
        };
        const result = parseCellStyle(style);
        expect(result.fill).toBeUndefined();
    });

    test('parses pattern fill with background color', () => {
        const style = {
            fill: {
                type: 'pattern',
                pattern: 'gray125',
                fgColor: { argb: 'FF000000' },
                bgColor: { argb: 'FFFFFFFF' },
            },
        };
        const result = parseCellStyle(style);
        expect(result.fill).toEqual({
            type: 'pattern',
            patternType: 'gray125',
            color: { argb: 'FF000000' },
            patternColor: { argb: 'FFFFFFFF' },
        });
    });

    test('parses gradient fill', () => {
        const style = {
            fill: {
                type: 'gradient',
                fgColor: { argb: 'FF0000FF' },
            },
        };
        const result = parseCellStyle(style);
        expect(result.fill).toEqual({
            type: 'gradient',
            color: { argb: 'FF0000FF' },
        });
    });

    test('parses border information', () => {
        const style = {
            border: {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'medium', color: { argb: 'FF000000' } },
                bottom: { style: 'thick', color: { argb: 'FF000000' } },
                left: { style: 'double', color: { argb: 'FF000000' } },
            },
        };
        const result = parseCellStyle(style);
        expect(result.border).toBeDefined();
        expect(result.border?.top).toEqual({ style: 'thin', color: { argb: 'FF000000' } });
        expect(result.border?.right).toEqual({ style: 'medium', color: { argb: 'FF000000' } });
        expect(result.border?.bottom).toEqual({ style: 'thick', color: { argb: 'FF000000' } });
        expect(result.border?.left).toEqual({ style: 'double', color: { argb: 'FF000000' } });
    });

    test('parses diagonal border', () => {
        const style = {
            border: {
                diagonal: { style: 'thin', color: { argb: 'FF000000' } },
                diagonalUp: true,
                diagonalDown: false,
            },
        };
        const result = parseCellStyle(style);
        expect(result.border?.diagonal).toEqual({ style: 'thin', color: { argb: 'FF000000' } });
        expect(result.border?.diagonalUp).toBe(true);
        expect(result.border?.diagonalDown).toBe(false);
    });

    test('parses alignment information', () => {
        const style = {
            alignment: {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true,
                shrinkToFit: true,
                indent: 2,
                textRotation: 45,
            },
        };
        const result = parseCellStyle(style);
        expect(result.alignment).toEqual({
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
            shrinkToFit: true,
            indent: 2,
            textRotation: 45,
        });
    });

    test('parses number format', () => {
        const style = { numFmt: '0.00' };
        const result = parseCellStyle(style);
        expect(result.numberFormat).toBe('0.00');
    });

    test('parses complex style with all properties', () => {
        const style = {
            font: { name: 'Arial', size: 14, bold: true, color: { argb: 'FF000000' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } },
            border: { top: { style: 'thin', color: { argb: 'FF000000' } } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            numFmt: '#,##0.00',
        };
        const result = parseCellStyle(style);
        expect(result.font).toBeDefined();
        expect(result.fill).toBeDefined();
        expect(result.border).toBeDefined();
        expect(result.alignment).toBeDefined();
        expect(result.numberFormat).toBe('#,##0.00');
    });
});
