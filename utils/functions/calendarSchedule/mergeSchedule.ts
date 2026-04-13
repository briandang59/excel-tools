import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

// ===================== TYPES =====================

type Staff = {
  staffID: string;
  staffName: string;
};

type ShiftDescription = {
  clientName: string;
  shiftPatternName: string;
  jobSite: string;
  roleName: string;
  date: string;
  shiftDay: string;
  shiftTiming: string;
  shiftDayId: string;
};

type ShiftScheduleItem = {
  date: string;
  shiftTag: string | null;
};

type EmployeeSchedule = {
  employeeID: string;
  shiftSchedule: ShiftScheduleItem[];
};

type ExcelRow = Record<string, any>;

// ===================== HELPERS =====================

// Parse date (cover nhiều format)
const parseDate = (date: any): string => {
  if (!date) return "";

  const parsed = dayjs(date, [
    "DD-MMM-YY",
    "DD-MMM-YYYY",
    "YYYY-MM-DD",
    "YYYY/MM/DD",
    "DD/MM/YYYY",
  ]);

  return parsed.isValid() ? parsed.format("YYYY/MM/DD") : String(date);
};

// Extract tag: 0(7,1)
const extractShiftTag = (input: string): string | null => {
  if (!input) return null;

  const match = input.match(/\d+\s*\(\s*\d+\s*,\s*\d+\s*\)/);
  return match ? match[0].replace(/\s+/g, "") : null;
};

// ===================== NORMALIZE =====================

const normalizeDescription = (data: ExcelRow[]): ShiftDescription[] => {
  return (data || [])
    .filter(Boolean)
    .map((d) => ({
      clientName: d.clientName || d["Client Name"] || "",
      shiftPatternName:
        d.shiftPatternName ||
        d.shift_pattern_name ||
        d["Shift Pattern Name"] ||
        "",
      jobSite: d.jobSite || d.job_site || d["Job Site"] || "",
      roleName: d.roleName || d.role_name || d["Role Name"] || "",
      date: d.date || "",
      shiftDay: d.shiftDay || d["Shift Day"] || "",
      shiftTiming: d.shiftTiming || d["Shift Timing"] || "",
      shiftDayId: d.shiftDayId || "",
    }))
    .filter((d) => d.shiftPatternName);
};

const normalizeStaff = (data: ExcelRow[]): Staff[] => {
  return (data || [])
    .filter(Boolean)
    .map((s) => ({
      staffID: s.staffID || s.staffId || s.staffNRIC || s["Staff ID"] || "",
      staffName: s.staffName || s["Staff Name"] || "",
    }))
    .filter((s) => s.staffID);
};

// ===================== MAIN =====================

export const mergeScheduleData = (
  descriptionRaw: ExcelRow[],
  staffRaw: ExcelRow[],
  scheduleRaw: any[],
) => {
  // ===== normalize input =====
  const descriptionData = normalizeDescription(descriptionRaw);
  const staffData = normalizeStaff(staffRaw);

  const scheduleData: EmployeeSchedule[] = (scheduleRaw || [])
    .filter(Boolean)
    .map((item) => {
      if (!item || !item.employeeID) return null;

      return {
        employeeID: item.employeeID,
        shiftSchedule: (item.shiftSchedule || []).filter(Boolean),
      };
    })
    .filter(Boolean) as EmployeeSchedule[];

  // ===== build staff map =====
  const staffMap: Record<string, Staff> = {};
  staffData.forEach((s) => {
    staffMap[s.staffID] = s;
  });

  // ===== build shift map =====
  const shiftMap: Record<string, ShiftDescription> = {};
  descriptionData.forEach((d) => {
    const tag = extractShiftTag(d.shiftPatternName);
    if (tag && !shiftMap[tag]) {
      shiftMap[tag] = d;
    }
  });

  // ===== merge =====
  const result = scheduleData.map((emp) => {
    const staff = staffMap[emp.employeeID];

    return {
      employeeID: emp.employeeID,
      staffName: staff?.staffName || "",

      shiftSchedule: (emp.shiftSchedule || [])
        .filter((s) => {
          const shiftInfo = s?.shiftTag ? shiftMap[s.shiftTag] : null;
          return shiftInfo !== null;
        })
        .map((s) => {
          const formattedDate = parseDate(s?.date);
          const shiftInfo = s?.shiftTag ? shiftMap[s.shiftTag] : null;

          return {
            ...shiftInfo,
            date: formattedDate,
            shiftTag: s?.shiftTag || null,
          };
        }),
    };
  });

  return result;
};
