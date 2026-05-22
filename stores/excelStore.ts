import { create } from "zustand";
import * as XLSX from "xlsx";
import { toCamelCase } from "@/utils/functions/common/toCamelCase";

// ================= TYPES =================

export type ExcelRow = Record<string, any>;

type SheetType = "normal" | "schedule";

// raw row từ header:1
type SheetRawRow = (string | number | null | undefined)[];

interface ExcelStore {
  fileName: string;
  sheets: string[];
  sheetKeys: Record<string, string>;
  workbook: XLSX.WorkBook | null;

  sheetTypes: Record<string, SheetType>;
  allSheetsData: Record<string, ExcelRow[]>;

  setFileInfo: (
    fileName: string,
    sheets: string[],
    workbook: XLSX.WorkBook,
  ) => void;

  setSheetType: (sheetKey: string, type: SheetType) => void;
  loadAllSheets: () => void;
  clearData: () => void;
}

// ================= HELPERS =================

// tìm dòng chứa "Employee ID"
const findHeaderRow = (raw: SheetRawRow[]): number => {
  return raw.findIndex((row) =>
    row?.some((cell) =>
      String(cell || "")
        .toLowerCase()
        .includes("employee id"),
    ),
  );
};

// ================= STORE =================

export const useExcelStore = create<ExcelStore>((set, get) => ({
  fileName: "",
  sheets: [],
  sheetKeys: {},
  workbook: null,
  sheetTypes: {},
  allSheetsData: {},

  // ===== SET FILE =====
  setFileInfo: (fileName, originalSheets, workbook) => {
    const sheetKeys: Record<string, string> = {};
    const sheetTypes: Record<string, SheetType> = {};

    originalSheets.forEach((name) => {
      const key = toCamelCase(name);
      sheetKeys[name] = key;
      sheetTypes[key] = "normal"; // default
    });

    set({
      fileName,
      sheets: originalSheets,
      sheetKeys,
      workbook,
      sheetTypes,
      allSheetsData: {},
    });
  },

  // ===== SET TYPE =====
  setSheetType: (sheetKey, type) =>
    set((state) => ({
      sheetTypes: {
        ...state.sheetTypes,
        [sheetKey]: type,
      },
    })),

  // ===== LOAD ALL SHEETS =====
  loadAllSheets: () => {
    const { workbook, sheetKeys, sheetTypes } = get();
    if (!workbook) return;

    Object.keys(sheetKeys).forEach((originalName) => {
      const sheetKey = sheetKeys[originalName];
      const worksheet = workbook.Sheets[originalName];
      if (!worksheet) return;

      const type = sheetTypes[sheetKey] || "normal";
      let jsonData: ExcelRow[] = [];

      // ================= SCHEDULE =================
      if (type === "schedule") {
        const raw = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        }) as SheetRawRow[];

        const headerRowIndex = findHeaderRow(raw);

        if (headerRowIndex !== -1) {
          // Đọc header thủ công bằng raw cell value (cell.v) thay vì formatted text (cell.w)
          // Lý do: date cell có format "m/d" → cell.w = "5/24" nhưng cell.v = 46166 (serial)
          // Nếu dùng sheet_to_json với range, nó sẽ dùng cell.w làm key → key sai ("5/24" → "524")
          const sheetRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
          const rawHeaders: string[] = [];

          for (let c = sheetRange.s.c; c <= sheetRange.e.c; c++) {
            const addr = XLSX.utils.encode_cell({ r: headerRowIndex, c });
            const cell = worksheet[addr];
            if (!cell || cell.v == null) {
              rawHeaders.push(`__col_${c}`);
              continue;
            }
            // Date cell: type 'n', serial > 25569 (offset về Unix epoch)
            // → giữ nguyên serial number làm key (e.g. "46166")
            if (cell.t === "n" && typeof cell.v === "number" && cell.v > 25569) {
              rawHeaders.push(String(cell.v));
            } else {
              rawHeaders.push(String(cell.v));
            }
          }

          // Build jsonData từ raw headers
          jsonData = [];
          for (let r = headerRowIndex + 1; r <= sheetRange.e.r; r++) {
            const row: ExcelRow = {};
            for (let c = sheetRange.s.c; c <= sheetRange.e.c; c++) {
              const addr = XLSX.utils.encode_cell({ r, c });
              const cell = worksheet[addr];
              const header = rawHeaders[c - sheetRange.s.c];
              row[header] = cell != null ? cell.v : null;
            }
            jsonData.push(row);
          }
        } else {
          console.warn(`Không tìm thấy header trong sheet ${originalName}`);
        }
      }

      // ================= NORMAL =================
      else {
        jsonData = XLSX.utils.sheet_to_json(worksheet, {
          defval: null,
        }) as ExcelRow[];
      }

      // ===== OPTIONAL: convert key camelCase =====
      jsonData = jsonData.map((row) => {
        const newRow: ExcelRow = {};

        Object.keys(row).forEach((key) => {
          newRow[toCamelCase(key)] = row[key];
        });

        return newRow;
      });

      // ===== SAVE =====
      set((state) => ({
        allSheetsData: {
          ...state.allSheetsData,
          [sheetKey]: jsonData,
        },
      }));
    });
  },

  // ===== CLEAR =====
  clearData: () =>
    set({
      fileName: "",
      sheets: [],
      sheetKeys: {},
      workbook: null,
      sheetTypes: {},
      allSheetsData: {},
    }),
}));
