import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as XLSX from "xlsx";
import { toCamelCase } from "@/utils/functions/common/toCamelCase";
import { parseToDate } from "@/utils/functions/common/parseToDate";
export interface ExcelRow {
  [key: string]: any;
}

interface SheetConfig {
  originalName: string;
  camelCaseName: string;
  displayName?: string;
  columnMap: Record<string, string>;
  selectedColumns?: string[];
}

interface ExcelStore {
  fileName: string;
  sheets: string[];
  sheetKeys: Record<string, string>;
  workbook: XLSX.WorkBook | null;
  allSheetsData: Record<string, ExcelRow[]>;
  sheetConfigs: Record<string, SheetConfig>;
  currentSheetKey: string;
  currentData: ExcelRow[];

  setFileInfo: (
    fileName: string,
    sheets: string[],
    workbook: XLSX.WorkBook,
  ) => void;
  loadAllSheets: () => void;
  loadSheetData: (sheetKey: string) => void;
  changeCurrentSheet: (originalSheetName: string) => void;
  setSheetConfig: (sheetKey: string, config: Partial<SheetConfig>) => void;
  clearData: () => void;
}

// Kiểm tra một giá trị có phải là Excel date không (rất quan trọng)
const isExcelDate = (value: any, columnName: string): boolean => {
  if (typeof value !== "number" || value < 25569 || value > 100000)
    return false;

  // Kiểm tra tên cột chứa từ date-related
  const lowerCol = columnName.toLowerCase();
  return (
    lowerCol.includes("date") ||
    lowerCol.includes("ngày") ||
    lowerCol.includes("time") ||
    lowerCol.includes("shift") ||
    lowerCol.includes("day")
  );
};

// ==================== STORE ====================

export const useExcelStore = create<ExcelStore>()(
  persist(
    (set, get) => ({
      fileName: "",
      sheets: [],
      sheetKeys: {},
      workbook: null,
      allSheetsData: {},
      sheetConfigs: {},
      currentSheetKey: "",
      currentData: [],

      setFileInfo: (fileName, originalSheets, workbook) => {
        const sheetKeys: Record<string, string> = {};
        const initialConfigs: Record<string, SheetConfig> = {};

        originalSheets.forEach((originalName) => {
          const camelKey = toCamelCase(originalName);
          sheetKeys[originalName] = camelKey;

          initialConfigs[camelKey] = {
            originalName,
            camelCaseName: camelKey,
            displayName: originalName,
            columnMap: {},
            selectedColumns: [],
          };
        });

        set({
          fileName,
          sheets: originalSheets,
          sheetKeys,
          workbook,
          sheetConfigs: initialConfigs,
          allSheetsData: {},
          currentSheetKey: sheetKeys[originalSheets[0]] || "",
          currentData: [],
        });

        // Load tất cả sheet
        setTimeout(() => get().loadAllSheets(), 80);
      },

      loadAllSheets: () => {
        const { workbook, sheetKeys, sheetConfigs } = get();
        if (!workbook) return;

        const originalSheetNames = Object.keys(sheetKeys);

        originalSheetNames.forEach((originalName) => {
          const sheetKey = sheetKeys[originalName];
          const worksheet = workbook.Sheets[originalName];
          if (!worksheet) return;

          let jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, {
            defval: null,
            blankrows: false,
            raw: false, // Quan trọng: để xlsx tự parse một số kiểu dữ liệu
          });

          const colMap = sheetConfigs[sheetKey]?.columnMap || {};

          jsonData = jsonData.map((row) => {
            const newRow: ExcelRow = {};

            Object.keys(row).forEach((originalCol) => {
              let finalCol = colMap[originalCol] || toCamelCase(originalCol);
              let value = row[originalCol];

              // === TỰ ĐỘNG CHUYỂN DATE TRIỆT ĐỂ ===
              if (isExcelDate(value, originalCol)) {
                value = parseToDate(value);
              }

              newRow[finalCol] = value;
            });

            return newRow;
          });

          set((state) => ({
            allSheetsData: {
              ...state.allSheetsData,
              [sheetKey]: jsonData,
            },
          }));

          if (originalName === originalSheetNames[0]) {
            set({ currentData: jsonData });
          }
        });
      },

      loadSheetData: (sheetKey: string) => {
        const { allSheetsData } = get();
        if (allSheetsData[sheetKey]) {
          set({ currentData: allSheetsData[sheetKey] });
        }
      },

      changeCurrentSheet: (originalSheetName: string) => {
        const { sheetKeys, allSheetsData } = get();
        const sheetKey = sheetKeys[originalSheetName];
        if (!sheetKey) return;

        set({ currentSheetKey: sheetKey });

        if (allSheetsData[sheetKey]) {
          set({ currentData: allSheetsData[sheetKey] });
        } else {
          get().loadSheetData(sheetKey);
        }
      },

      setSheetConfig: (sheetKey, config) =>
        set((state) => ({
          sheetConfigs: {
            ...state.sheetConfigs,
            [sheetKey]: { ...state.sheetConfigs[sheetKey], ...config },
          },
        })),

      clearData: () =>
        set({
          fileName: "",
          sheets: [],
          sheetKeys: {},
          workbook: null,
          allSheetsData: {},
          sheetConfigs: {},
          currentSheetKey: "",
          currentData: [],
        }),
    }),
    { name: "excel-storage" },
  ),
);
