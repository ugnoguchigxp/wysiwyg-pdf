import { convertToTableNode } from '../converter/table';
import type { ExcelSheet, ExcelRow } from '../types/excel';
import { DEFAULT_IMPORT_OPTIONS } from '../types/options';

function createMockSheet(rows: ExcelRow[], mergedCells = []): ExcelSheet {
    return {
        name: 'TestSheet',
        index: 0,
        pageSetup: {
            paperSize: 'a4',
            orientation: 'portrait',
            margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0 },
        },
        rows,
        columns: [],
        mergedCells,
        images: [],
    };
}

function createMockCell(row: number, col: number, value: string): any {
    return {
        row,
        col,
        value,
        style: {},
    };
}

function createMockRow(index: number, height: number, cells: any[]): ExcelRow {
    return {
        index,
        height,
        hidden: false,
        cells,
    };
}

describe('convertToTableNode', () => {
    test('creates table node from sheet', () => {
        const rows = [
            createMockRow(0, 15, [createMockCell(0, 0, 'A1'), createMockCell(0, 1, 'B1')]),
            createMockRow(1, 20, [createMockCell(1, 0, 'A2'), createMockCell(1, 1, 'B2')]),
        ];
        const sheet = createMockSheet(rows);
        const range = { startRow: 0, endRow: 1, startCol: 0, endCol: 1 };
        const rowHeights = [15, 20];
        const colWidths = [10, 15];
        const position = { x: 0, y: 0 };

        const result = convertToTableNode(sheet, range, rowHeights, colWidths, 'surface1', DEFAULT_IMPORT_OPTIONS, position);

        expect(result.t).toBe('table');
        expect(result.s).toBe('surface1');
        expect(result.x).toBe(0);
        expect(result.y).toBe(0);
        expect(result.w).toBe(25);
        expect(result.h).toBe(35);
        expect(result.table.rows).toHaveLength(2);
        expect(result.table.cols).toHaveLength(2);
    });

    test('handles single cell table', () => {
        const rows = [
            createMockRow(0, 15, [createMockCell(0, 0, 'A1')]),
        ];
        const sheet = createMockSheet(rows);
        const range = { startRow: 0, endRow: 0, startCol: 0, endCol: 0 };
        const rowHeights = [15];
        const colWidths = [10];
        const position = { x: 0, y: 0 };

        const result = convertToTableNode(sheet, range, rowHeights, colWidths, 'surface1', DEFAULT_IMPORT_OPTIONS, position);

        expect(result.table.cells).toHaveLength(1);
        expect(result.table.cells[0].v).toBe('A1');
    });

    test('handles merged cells', () => {
        const rows = [
            createMockRow(0, 15, [createMockCell(0, 0, 'Merged')]),
        ];
        const mergedCells = [
            { startRow: 0, startCol: 0, endRow: 0, endCol: 2 },
        ];
        const sheet = createMockSheet(rows, mergedCells);
        const range = { startRow: 0, endRow: 0, startCol: 0, endCol: 2 };
        const rowHeights = [15];
        const colWidths = [10, 10, 10];
        const position = { x: 0, y: 0 };

        const result = convertToTableNode(sheet, range, rowHeights, colWidths, 'surface1', DEFAULT_IMPORT_OPTIONS, position);

        expect(result.table.cells).toHaveLength(1);
        expect(result.table.cells[0].rs).toBe(1);
        expect(result.table.cells[0].cs).toBe(3);
    });

    test('generates unique id for table', () => {
        const rows = [
            createMockRow(0, 15, [createMockCell(0, 0, 'A1')]),
        ];
        const sheet = createMockSheet(rows);
        const range = { startRow: 0, endRow: 0, startCol: 0, endCol: 0 };
        const rowHeights = [15];
        const colWidths = [10];
        const position = { x: 0, y: 0 };

        const result1 = convertToTableNode(sheet, range, rowHeights, colWidths, 'surface1', DEFAULT_IMPORT_OPTIONS, position);
        const result2 = convertToTableNode(sheet, range, rowHeights, colWidths, 'surface2', DEFAULT_IMPORT_OPTIONS, position);

        expect(result1.id).not.toBe(result2.id);
    });

    test('calculates correct dimensions', () => {
        const rows = [
            createMockRow(0, 10, []),
            createMockRow(1, 20, []),
            createMockRow(2, 30, []),
        ];
        const sheet = createMockSheet(rows);
        const range = { startRow: 0, endRow: 2, startCol: 0, endCol: 2 };
        const rowHeights = [10, 20, 30];
        const colWidths = [5, 10, 15];
        const position = { x: 10, y: 20 };

        const result = convertToTableNode(sheet, range, rowHeights, colWidths, 'surface1', DEFAULT_IMPORT_OPTIONS, position);

        expect(result.w).toBe(30);
        expect(result.h).toBe(60);
        expect(result.x).toBe(10);
        expect(result.y).toBe(20);
    });

    test('handles empty rows', () => {
        const rows = [
            createMockRow(0, 15, []),
            createMockRow(1, 20, []),
        ];
        const sheet = createMockSheet(rows);
        const range = { startRow: 0, endRow: 1, startCol: 0, endCol: 0 };
        const rowHeights = [15, 20];
        const colWidths = [10];
        const position = { x: 0, y: 0 };

        const result = convertToTableNode(sheet, range, rowHeights, colWidths, 'surface1', DEFAULT_IMPORT_OPTIONS, position);

        expect(result.table.cells).toHaveLength(0);
    });

    test('handles cells with styles', () => {
        const rows = [
            createMockRow(0, 15, [
                {
                    ...createMockCell(0, 0, 'Styled'),
                    style: {
                        font: { name: 'Arial', size: 12, bold: true },
                        fill: { color: { argb: 'FFFF0000' } },
                    },
                },
            ]),
        ];
        const sheet = createMockSheet(rows);
        const range = { startRow: 0, endRow: 0, startCol: 0, endCol: 0 };
        const rowHeights = [15];
        const colWidths = [10];
        const position = { x: 0, y: 0 };

        const result = convertToTableNode(sheet, range, rowHeights, colWidths, 'surface1', DEFAULT_IMPORT_OPTIONS, position);

        expect(result.table.cells[0].v).toBe('Styled');
        expect(result.table.cells[0].font).toBe('Noto Sans');
        expect(result.table.cells[0].bold).toBe(true);
    });

    test('resolves border conflicts', () => {
        const rows = [
            createMockRow(0, 15, [
                {
                    ...createMockCell(0, 0, 'A1'),
                    style: {
                        border: {
                            right: { style: 'thin' as const, color: { argb: 'FF000000' } },
                        },
                    },
                },
                {
                    ...createMockCell(0, 1, 'B1'),
                    style: {
                        border: {
                            left: { style: 'thick' as const, color: { argb: 'FF000000' } },
                        },
                    },
                },
            ]),
        ];
        const sheet = createMockSheet(rows);
        const range = { startRow: 0, endRow: 0, startCol: 0, endCol: 1 };
        const rowHeights = [15];
        const colWidths = [10, 10];
        const position = { x: 0, y: 0 };

        const result = convertToTableNode(sheet, range, rowHeights, colWidths, 'surface1', DEFAULT_IMPORT_OPTIONS, position);

        const cellA1 = result.table.cells.find((c: any) => c.c === 0);
        const cellB1 = result.table.cells.find((c: any) => c.c === 1);

        expect(cellA1).toBeDefined();
        expect(cellB1).toBeDefined();
        expect(cellA1?.borders?.r?.width).toBe(0.7);
        expect(cellB1?.borders?.l?.width).toBe(0.7);
    });

    test('handles borders with different styles but same width', () => {
        const rows = [
            createMockRow(0, 15, [
                {
                    ...createMockCell(0, 0, 'A1'),
                    style: {
                        border: {
                            right: { style: 'solid' as const, color: { argb: 'FF000000' } },
                        },
                    },
                },
                {
                    ...createMockCell(0, 1, 'B1'),
                    style: {
                        border: {
                            left: { style: 'double' as const, color: { argb: 'FF000000' } },
                        },
                    },
                },
            ]),
        ];
        const sheet = createMockSheet(rows);
        const range = { startRow: 0, endRow: 0, startCol: 0, endCol: 1 };
        const rowHeights = [15];
        const colWidths = [10, 10];
        const position = { x: 0, y: 0 };

        const result = convertToTableNode(sheet, range, rowHeights, colWidths, 'surface1', DEFAULT_IMPORT_OPTIONS, position);

        const cellA1 = result.table.cells.find((c: any) => c.c === 0);
        const cellB1 = result.table.cells.find((c: any) => c.c === 1);

         expect(cellA1?.borders?.r?.style).toBe('solid');
         expect(cellB1?.borders?.l?.style).toBe('solid');
    });

    test('handles vertical border conflicts', () => {
        const rows = [
            createMockRow(0, 15, [
                {
                    ...createMockCell(0, 0, 'A1'),
                    style: {
                        border: {
                            bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
                        },
                    },
                }
            ]),
            createMockRow(1, 20, [
                {
                    ...createMockCell(0, 0, 'A1'),
                    style: {
                        border: {
                            bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
                        },
                    },
                }
            ]),
            createMockRow(1, 20, [
                {
                    ...createMockCell(1, 0, 'A2'),
                    style: {
                        border: {
                            top: { style: 'thick' as const, color: { argb: 'FF000000' } },
                        },
                    },
                }
            ]),
        ];
        const sheet = createMockSheet(rows);
        const range = { startRow: 0, endRow: 1, startCol: 0, endCol: 0 };
        const rowHeights = [15, 20];
        const colWidths = [10];
        const position = { x: 0, y: 0 };

        const result = convertToTableNode(sheet, range, rowHeights, colWidths, 'surface1', DEFAULT_IMPORT_OPTIONS, position);

        const cellA1 = result.table.cells.find((c: any) => c.r === 0);
        const cellA2 = result.table.cells.find((c: any) => c.r === 1);

         expect(cellA1?.borders?.b?.width).toBe(0.2);
         expect(cellA2?.borders?.t?.width).toBe(0.2);
    });

    test('handles missing borders on one side', () => {
        const rows = [
            createMockRow(0, 15, [
                {
                    ...createMockCell(0, 0, 'A1'),
                    style: {
                        border: {
                            right: { style: 'thick' as const, color: { argb: 'FF000000' } },
                        },
                    },
                },
                {
                    ...createMockCell(0, 1, 'B1'),
                    style: {},
                },
            ]),
        ];
        const sheet = createMockSheet(rows);
        const range = { startRow: 0, endRow: 0, startCol: 0, endCol: 1 };
        const rowHeights = [15];
        const colWidths = [10, 10];
        const position = { x: 0, y: 0 };

        const result = convertToTableNode(sheet, range, rowHeights, colWidths, 'surface1', DEFAULT_IMPORT_OPTIONS, position);

        const cellA1 = result.table.cells.find((c: any) => c.c === 0);
        const cellB1 = result.table.cells.find((c: any) => c.c === 1);

        expect(cellA1?.borders?.r?.width).toBe(0.7);
        expect(cellB1?.borders?.l).toBeUndefined();
    });

    test('handles cells without borders', () => {
        const rows = [
            createMockRow(0, 15, [
                {
                    ...createMockCell(0, 0, 'A1'),
                    style: {},
                },
                {
                    ...createMockCell(0, 1, 'B1'),
                    style: {},
                },
            ]),
        ];
        const sheet = createMockSheet(rows);
        const range = { startRow: 0, endRow: 0, startCol: 0, endCol: 1 };
        const rowHeights = [15];
        const colWidths = [10, 10];
        const position = { x: 0, y: 0 };

        const result = convertToTableNode(sheet, range, rowHeights, colWidths, 'surface1', DEFAULT_IMPORT_OPTIONS, position);

        const cellA1 = result.table.cells.find((c: any) => c.c === 0);
        const cellB1 = result.table.cells.find((c: any) => c.c === 1);

        expect(cellA1?.borders).toBeUndefined();
        expect(cellB1?.borders).toBeUndefined();
    });
});
