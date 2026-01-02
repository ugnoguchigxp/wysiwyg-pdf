import { parseCell, formatCellValue } from '../parser/cell';

describe('parseCell', () => {
    test('parses cell with string value', () => {
        const excelCell = {
            row: 1,
            col: 1,
            value: 'test',
            style: {},
            type: 3,
        };
        const result = parseCell(excelCell, 0, 0);
        expect(result.row).toBe(0);
        expect(result.col).toBe(0);
        expect(result.value).toBe('test');
        expect(result.style).toEqual({});
    });

    test('parses cell with number value', () => {
        const excelCell = {
            row: 1,
            col: 1,
            value: 123.45,
            style: {},
            type: 2,
        };
        const result = parseCell(excelCell, 0, 0);
        expect(result.value).toBe(123.45);
    });

    test('parses cell with boolean value', () => {
        const excelCell = {
            row: 1,
            col: 1,
            value: true,
            style: {},
            type: 9,
        };
        const result = parseCell(excelCell, 0, 0);
        expect(result.value).toBe(true);
    });

    test('parses cell with formula', () => {
        const excelCell = {
            row: 1,
            col: 1,
            value: 10,
            formula: '=SUM(A1:A5)',
            result: 50,
            style: {},
            type: 6,
        };
        const result = parseCell(excelCell, 0, 0);
        expect(result.formula).toBe('=SUM(A1:A5)');
        expect(result.value).toBe(50);
    });

    test('handles null value', () => {
        const excelCell = {
            row: 1,
            col: 1,
            value: null,
            style: {},
            type: 0,
        };
        const result = parseCell(excelCell, 0, 0);
        expect(result.value).toBeNull();
    });

    test('handles undefined value', () => {
        const excelCell = {
            row: 1,
            col: 1,
            value: undefined,
            style: {},
            type: 0,
        };
        const result = parseCell(excelCell, 0, 0);
        expect(result.value).toBeNull();
    });

    test('extracts rich text', () => {
        const excelCell = {
            row: 1,
            col: 1,
            value: {
                richText: [
                    { text: 'Hello ', font: { bold: true } },
                    { text: 'World', font: { color: { argb: 'FFFF0000' } } },
                ],
            },
            style: {},
            type: 8,
        };
        const result = parseCell(excelCell, 0, 0);
        expect(result.value).toHaveProperty('richText');
        if (typeof result.value === 'object' && result.value !== null && 'richText' in result.value) {
            expect(result.value.richText).toHaveLength(2);
        }
    });

    test('extracts hyperlink text', () => {
        const excelCell = {
            row: 1,
            col: 1,
            value: {
                text: 'Click here',
                hyperlink: 'https://example.com',
            },
            style: {},
            type: 5,
        };
        const result = parseCell(excelCell, 0, 0);
        expect(result.value).toBe('Click here');
    });

    test('formats error value', () => {
        const excelCell = {
            row: 1,
            col: 1,
            value: { error: 'DIV/0!' },
            style: {},
            type: 10,
        };
        const result = parseCell(excelCell, 0, 0);
        expect(result.value).toBe('#DIV/0!');
    });

    test('handles date value', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        const excelCell = {
            row: 1,
            col: 1,
            value: date,
            style: {},
            type: 4,
        };
        const result = parseCell(excelCell, 0, 0);
        expect(result.value).toBeInstanceOf(Date);
    });
});

describe('formatCellValue', () => {
    test('formats null value as empty string', () => {
        expect(formatCellValue(null)).toBe('');
    });

    test('formats string value', () => {
        expect(formatCellValue('test')).toBe('test');
    });

    test('formats boolean value', () => {
        expect(formatCellValue(true)).toBe('TRUE');
        expect(formatCellValue(false)).toBe('FALSE');
    });

    test('formats number value', () => {
        expect(formatCellValue(123.45)).toBe('123.45');
    });

    test('formats date value', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        const result = formatCellValue(date);
        expect(result).toContain('2024');
    });

    test('formats rich text as string', () => {
        const richText = {
            richText: [
                { text: 'Hello ' },
                { text: 'World' },
            ],
        };
        expect(formatCellValue(richText)).toBe('[object Object]');
    });
});
