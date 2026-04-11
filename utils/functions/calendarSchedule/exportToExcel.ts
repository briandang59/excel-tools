import * as XLSX from "xlsx";
import dayjs from "dayjs";

export const exportToExcel = (data: any[]) => {
  const rows: any[] = [];

  data.forEach((emp) => {
    emp.shiftSchedule.forEach((s: any) => {
      rows.push({
        "Client Name": s.clientName || "",
        "Shift Pattern Name": s.shiftPatternName || "",
        "Job Site Name": s.jobSite || "",
        "Role Name": s.roleName || "",
        "Date (dd-mmm-yy)": dayjs(s.date).format("YYYY-MM-DD"),
        "Shift Day": dayjs(s.date).format("dddd"),
        "Shift Timing": s.shiftTiming || "",
        "Shift Day Id": s.shiftDayId || "",
        "Staff Name": emp.staffName || "",
        "Staff NRIC": emp.employeeID || "",
        "Admin Remarks": "",
        "Staff Remarks": "",
      });
    });
  });

  // ===== tạo sheet =====
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // ===== tạo workbook =====
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Schedule");

  // ===== export file =====
  XLSX.writeFile(workbook, "merged_schedule.xlsx");
};
