import { convertWorkbook } from '../converter/doc';
import type { ExcelWorkbook } from '../types/excel';
import { DEFAULT_IMPORT_OPTIONS } from '../types/options';

describe('convertWorkbook', () => {
    test('converts workbook to OutputDoc', () => {
        const workbook: ExcelWorkbook = {
            sheets: [
                {
                    name: 'Sheet1',
                    index: 0,
                    pageSetup: {
                        paperSize: 'a4',
                        orientation: 'portrait',
                        margin: { top: 0.75, right: 0.7, bottom: 0.75, left: 0.7, header: 0.3, footer: 0.3 },
                    },
                    rows: [],
                    columns: [],
                    mergedCells: [],
                    images: [],
                },
            ],
            defaultFont: { name: 'Calibri', size: 11 },
            metadata: {
                title: 'Test Document',
                author: 'Test User',
                created: new Date('2024-01-01'),
                modified: new Date('2024-01-02'),
            },
        };
        const result = convertWorkbook(workbook, DEFAULT_IMPORT_OPTIONS);
        expect(result.v).toBe(1);
        expect(result.id).toBeDefined();
        expect(result.title).toBe('Test Document');
        expect(result.unit).toBe('mm');
        expect(result.surfaces).toHaveLength(1);
        expect(result.nodes).toHaveLength(1);
    });

    test('uses provided documentId', () => {
        const workbook: ExcelWorkbook = {
            sheets: [
                {
                    name: 'Sheet1',
                    index: 0,
                    pageSetup: {
                        paperSize: 'a4',
                        orientation: 'portrait',
                        margin: { top: 0.75, right: 0.7, bottom: 0.75, left: 0.7, header: 0.3, footer: 0.3 },
                    },
                    rows: [],
                    columns: [],
                    mergedCells: [],
                    images: [],
                },
            ],
            defaultFont: { name: 'Calibri', size: 11 },
        };
        const options = { ...DEFAULT_IMPORT_OPTIONS, documentId: 'custom-id' };
        const result = convertWorkbook(workbook, options);
        expect(result.id).toBe('custom-id');
    });

    test('uses provided documentTitle', () => {
        const workbook: ExcelWorkbook = {
            sheets: [
                {
                    name: 'Sheet1',
                    index: 0,
                    pageSetup: {
                        paperSize: 'a4',
                        orientation: 'portrait',
                        margin: { top: 0.75, right: 0.7, bottom: 0.75, left: 0.7, header: 0.3, footer: 0.3 },
                    },
                    rows: [],
                    columns: [],
                    mergedCells: [],
                    images: [],
                },
            ],
            defaultFont: { name: 'Calibri', size: 11 },
        };
        const options = { ...DEFAULT_IMPORT_OPTIONS, documentTitle: 'Custom Title' };
        const result = convertWorkbook(workbook, options);
        expect(result.title).toBe('Custom Title');
    });

    test('generates id when not provided', () => {
        const workbook: ExcelWorkbook = {
            sheets: [
                {
                    name: 'Sheet1',
                    index: 0,
                    pageSetup: {
                        paperSize: 'a4',
                        orientation: 'portrait',
                        margin: { top: 0.75, right: 0.7, bottom: 0.75, left: 0.7, header: 0.3, footer: 0.3 },
                    },
                    rows: [],
                    columns: [],
                    mergedCells: [],
                    images: [],
                },
            ],
            defaultFont: { name: 'Calibri', size: 11 },
        };
        const result = convertWorkbook(workbook, DEFAULT_IMPORT_OPTIONS);
        expect(result.id).toMatch(/^doc_\w+_\w+$/);
    });

    test('uses workbook metadata title when not provided', () => {
        const workbook: ExcelWorkbook = {
            sheets: [
                {
                    name: 'Sheet1',
                    index: 0,
                    pageSetup: {
                        paperSize: 'a4',
                        orientation: 'portrait',
                        margin: { top: 0.75, right: 0.7, bottom: 0.75, left: 0.7, header: 0.3, footer: 0.3 },
                    },
                    rows: [],
                    columns: [],
                    mergedCells: [],
                    images: [],
                },
            ],
            defaultFont: { name: 'Calibri', size: 11 },
            metadata: { title: 'Workbook Title' },
        };
        const result = convertWorkbook(workbook, DEFAULT_IMPORT_OPTIONS);
        expect(result.title).toBe('Workbook Title');
    });

    test('defaults to Untitled when no title provided', () => {
        const workbook: ExcelWorkbook = {
            sheets: [
                {
                    name: 'Sheet1',
                    index: 0,
                    pageSetup: {
                        paperSize: 'a4',
                        orientation: 'portrait',
                        margin: { top: 0.75, right: 0.7, bottom: 0.75, left: 0.7, header: 0.3, footer: 0.3 },
                    },
                    rows: [],
                    columns: [],
                    mergedCells: [],
                    images: [],
                },
            ],
            defaultFont: { name: 'Calibri', size: 11 },
        };
        const result = convertWorkbook(workbook, DEFAULT_IMPORT_OPTIONS);
        expect(result.title).toBe('Untitled');
    });

    test('converts multiple sheets', () => {
        const workbook: ExcelWorkbook = {
            sheets: [
                {
                    name: 'Sheet1',
                    index: 0,
                    pageSetup: {
                        paperSize: 'a4',
                        orientation: 'portrait',
                        margin: { top: 0.75, right: 0.7, bottom: 0.75, left: 0.7, header: 0.3, footer: 0.3 },
                    },
                    rows: [],
                    columns: [],
                    mergedCells: [],
                    images: [],
                },
                {
                    name: 'Sheet2',
                    index: 1,
                    pageSetup: {
                        paperSize: 'a4',
                        orientation: 'landscape',
                        margin: { top: 0.75, right: 0.7, bottom: 0.75, left: 0.7, header: 0.3, footer: 0.3 },
                    },
                    rows: [],
                    columns: [],
                    mergedCells: [],
                    images: [],
                },
            ],
            defaultFont: { name: 'Calibri', size: 11 },
        };
        const result = convertWorkbook(workbook, DEFAULT_IMPORT_OPTIONS);
        expect(result.surfaces).toHaveLength(2);
        expect(result.nodes).toHaveLength(2);
    });
});
