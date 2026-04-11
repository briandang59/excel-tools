import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export const parseToDate = (value: any): string => {
  if (!value) return "";

  // Excel serial
  if (typeof value === "number" && value > 25569) {
    const date = new Date((value - 25569) * 86400 * 1000);
    return dayjs(date).format("YYYY/MM/DD");
  }

  if (typeof value === "string") {
    const formats = [
      "YYYY/MM/DD",
      "YYYY/M/D",
      "YYYY-MM-DD",
      "DD/MM/YYYY",
      "D/M/YYYY",
      "DD-MM-YYYY",
      "D-M-YYYY",

      // 🔥 QUAN TRỌNG
      "DD-MMM-YY", // 18-Apr-26
      "DD-MMM-YYYY", // 18-Apr-2026
    ];

    for (const format of formats) {
      const parsed = dayjs(value, format, true);
      if (parsed.isValid()) {
        return parsed.format("YYYY/MM/DD");
      }
    }
  }

  return String(value);
};
