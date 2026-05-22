import dayjs from "dayjs";

// Convert Excel date serial number → JS Date
// Excel epoch: Jan 1, 1900 (with the 1900 leap-year bug → offset 25569 to Unix epoch)
const excelSerialToDate = (serial: number): dayjs.Dayjs => {
  return dayjs(new Date((serial - 25569) * 86400 * 1000));
};

export const formattedShiftSchedule = (rawData: any[]): any[] => {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  const result = rawData.map((row, rowIndex) => {
    const employeeID = row.employeeID;
    if (employeeID == null) return null;

    const shiftSchedule: { date: string; shiftTag: any }[] = [];

    console.log(`\n=== EmployeeID: ${employeeID} ===`);

    Object.keys(row).forEach((key) => {
      if (key === "employeeID") return;
      if (!/^\d+$/.test(key)) return;

      const shiftTag = row[key];

      let dateStr = "";
      let debug = "";

      const year = key.substring(0, 4);

      if (key.length === 5) {
        // Excel date serial (e.g. 46166 = 2026-05-24)
        // xlsx library giữ nguyên số serial khi không bật cellDates
        const serial = parseInt(key, 10);
        dateStr = excelSerialToDate(serial).format("YYYY-MM-DD");
        debug = "5 chữ số (Excel serial)";
      } else if (key.length === 6) {
        // 202651 → 2026-05-01
        const month = key.substring(4, 5); // "5"
        const day = key.substring(5, 6); // "1"
        dateStr = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        debug = "6 chữ số (YYYY M D)";
      } else if (key.length === 7) {
        // 2026419 → 2026-04-19
        // 2026510 → 2026-05-10
        const month = key.substring(4, 5); // "4" hoặc "5"
        const day = key.substring(5, 7); // "19" hoặc "10"
        dateStr = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        debug = "7 chữ số (YYYY M DD)";
      } else if (key.length === 8) {
        // Trường hợp đầy đủ YYYYMMDD
        const month = key.substring(4, 6);
        const day = key.substring(6, 8);
        dateStr = `${year}-${month}-${day}`;
        debug = "8 chữ số (YYYYMMDD)";
      } else {
        console.warn(`Key lạ: ${key}`);
        return;
      }

      const parsedDate = dayjs(dateStr, "YYYY-MM-DD", true); // strict parsing
      const formattedDate = parsedDate.format("YYYY-MM-DD");
      const isValid = parsedDate.isValid();

      console.log(
        `Key: ${key.padEnd(8)} → ${dateStr} → ${formattedDate} ` +
          `(${isValid ? "✓ OK" : "✗ Invalid"}) | ${debug}`,
      );

      if (!isValid) {
        console.warn(`   → Ngày không hợp lệ!`);
      }

      shiftSchedule.push({
        date: formattedDate,
        shiftTag: shiftTag === null || shiftTag === "" ? null : shiftTag,
      });
    });

    shiftSchedule.sort((a, b) => a.date.localeCompare(b.date));

    return { employeeID, shiftSchedule };
  });

  return result.filter(
    (item): item is NonNullable<typeof item> => item !== null,
  );
};
