import dayjs from "dayjs";

export const formattedShiftSchedule = (rawData: any[]): any[] => {
  if (!Array.isArray(rawData) || rawData.length < 2) return [];

  const headerRow = rawData[0];
  const dateMap: Record<string, string> = {};

  Object.keys(headerRow).forEach((key) => {
    if (key.startsWith("eMPTY") && key !== "eMPTY") {
      const dateStr = headerRow[key];
      if (dateStr && typeof dateStr === "string") {
        const normalizedDate = dateStr.replace(/\//g, "-").padStart(10, "0");
        dateMap[key] = normalizedDate;
      }
    }
  });

  const result = rawData.slice(1).map((row, index) => {
    const employeeID = row.eMPTY || null;
    const shiftSchedule: { date: string; shiftTag: any }[] = [];

    if (employeeID === null) return;
    Object.keys(row).forEach((key) => {
      if (key === "eMPTY" || !key.startsWith("eMPTY")) return;

      const date = dateMap[key];
      const shiftTag = row[key];

      if (date) {
        shiftSchedule.push({
          date: dayjs(date).format("YYYY-MM-DD"),
          shiftTag: shiftTag === null || shiftTag === "" ? null : shiftTag,
        });
      }
    });

    shiftSchedule.sort((a, b) => a.date.localeCompare(b.date));

    return {
      employeeID,
      shiftSchedule,
    };
  });

  return result;
};
