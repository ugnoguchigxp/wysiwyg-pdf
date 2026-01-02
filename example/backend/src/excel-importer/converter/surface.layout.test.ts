
import { convertSheet } from "./surface";
import type { ExcelSheet, ExcelRow, CellStyle } from "../types/excel";
import { DEFAULT_IMPORT_OPTIONS } from "../types/options";
import { mmToPt } from "../utils";

// Helper to create mock sheet
function createMockSheet(rows: ExcelRow[], pageSetupOverrides: any = {}): ExcelSheet {
    return {
        name: "TestSheet",
        index: 1,
        pageSetup: {
            paperSize: "a4",
            orientation: "portrait",
            margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0 },
            ...pageSetupOverrides,
        },
        rows,
        columns: [],
        mergedCells: [],
        images: [],
    };
}

describe("Layout & Resolution Logic", () => {

    test("Task 1: Scale to Fit to Page (1x1)", () => {
        // Content: 400mm width, 600mm height
        // A4 Portrait: 210mm x 297mm
        // Target Scale should be approx 0.5 (roughly 210/400 = 0.525)

        // Create rows to simulate height
        // 600mm total height. 1 row = 600mm? Or 10 rows of 60mm.
        // 60mm = approx 170pt? mmToPt(60)
        const rows: ExcelRow[] = [
            {
                index: 0,
                height: mmToPt(600), // Giant row
                hidden: false,
                cells: [
                    {
                        row: 0, col: 0, value: "Giant Cell", style: {},
                    }
                ],
            }
        ];

        // Column with 400mm width
        // 400mm width. Excel width unit is weird, but we can mock columns array in sheet
        // Actually convertSheet uses sheet.columns.
        const sheet = createMockSheet(rows, {
            fitToPage: { width: 1, height: 1 }
        });
        // Add column definition
        sheet.columns = [{ index: 0, width: 200, hidden: false }]; // 200 width is huge. excelColWidthToMm(200) approx 400mm?
        // default width 8.43 chars ~ 20mm. 200 chars ~ 400mm.

        const result = convertSheet(sheet, 1, {}, { name: "Arial", size: 11 });
        const table = result.nodes[0] as any;

        // Check computed width/height of table
        // Should be <= 210mm and <= 297mm
        console.log("Table size:", table.w, table.h);

        expect(table.w).toBeLessThanOrEqual(210);
        expect(table.h).toBeLessThanOrEqual(297);

        // Check if scale was applied
        // Original Height 600mm. Table Height should be scaled.
        // Scale ~ 297/600 ~ 0.495.
        // Table H should conform.
        expect(table.h).toBeLessThan(300);
        expect(table.h).toBeGreaterThan(100);
    });

    test("Task 2: Strict UsedRange Trimming", () => {
        // Rows 0..10. Only Row 5, Col 5 has data.
        // Others empty or undefined.
        const rows: ExcelRow[] = [];
        for (let i = 0; i < 10; i++) {
            rows.push({
                index: i,
                height: 15,
                hidden: false,
                cells: []
            });
        }
        // Add data to Row 5, Col 5
        rows[5].cells.push({
            row: 5, col: 5, value: "Target", style: {}
        });

        const sheet = createMockSheet(rows);

        const result = convertSheet(sheet, 1, {}, { name: "Arial", size: 11 });
        const table = result.nodes[0] as any;

        // Should have trimmed rows 0-4 and 6-9.
        // Resulting table rows should be 1?
        // convertToTableNode adds rows based on slice.
        // filteredRows in convertSheet should have been size 1.

        expect(table.table.rows.length).toBe(1);
        expect(table.table.cols.length).toBe(1); // Only Col 5?

        const cell = table.table.cells[0];
        expect(cell.v).toBe("Target");
    });

    test("Task 4: Border Resolution", () => {
        // Two adjacent cells: (0,0) and (0,1)
        // (0,0) Right = Thin
        // (0,1) Left = Thick
        // Result should be Thick for both.

        const styleL: CellStyle = {
            border: { right: { style: 'thin' } }
        };
        const styleR: CellStyle = {
            border: { left: { style: 'thick' } }
        };

        const rows: ExcelRow[] = [
            {
                index: 0, height: 15, hidden: false,
                cells: [
                    { row: 0, col: 0, value: "L", style: styleL },
                    { row: 0, col: 1, value: "R", style: styleR }
                ]
            }
        ];

        const sheet = createMockSheet(rows);
        // Force 2 columns included
        sheet.columns = [
            { index: 0, width: 10, hidden: false },
            { index: 1, width: 10, hidden: false }
        ];

        const result = convertSheet(sheet, 1, {}, { name: "Arial", size: 11 });
        const table = result.nodes[0] as any;
        const cells = table.table.cells;

        const cellL = cells.find((c: any) => c.c === 0);
        const cellR = cells.find((c: any) => c.c === 1);

        expect(cellL).toBeDefined();
        expect(cellR).toBeDefined();

        // Check borders match Thick (approx 0.7mm)
        // Thin is 0.2mm
        console.log("Resolved Borders:", cellL.borders.r, cellR.borders.l);

        expect(cellL.borders.r.width).toBe(0.7);
        expect(cellR.borders.l.width).toBe(0.7);
    });

});
