"use client";
import { images } from "@/assets/images";
import UploadExcel from "@/components/UploadExcel";
import { useExcelStore } from "@/stores/excelStore";
import { CalendarScheduleType } from "@/types/calendarSchedule";
import { exportToExcel } from "@/utils/functions/calendarSchedule/exportToExcel";
import { formattedShiftSchedule } from "@/utils/functions/calendarSchedule/formatedShiftSchedule";
import { mergeScheduleData } from "@/utils/functions/calendarSchedule/mergeSchedule";
import { Button } from "antd";
import { useState } from "react";

export default function Home() {
  const { allSheetsData } = useExcelStore();
  const [key, setKey] = useState<CalendarScheduleType>("calendar_schedule");

  const handleMergeDataToNewSheet = () => {
    switch (key) {
      case "calendar_schedule": {
        const finalData = mergeScheduleData(
          allSheetsData.shiftReference,
          allSheetsData.staffReference,
          formattedShiftSchedule(allSheetsData.test1),
        );
        exportToExcel(finalData);
      }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage: `url(${images.imgBg.src})`,
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl p-6">
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-xl p-6 flex flex-col gap-6">
          <h1 className="text-2xl font-bold text-white text-center">
            Excel Tool
          </h1>

          <UploadExcel />

          <Button
            type="primary"
            size="large"
            className="w-full bg-linear-to-r! from-purple-500! to-pink-500! border-none!"
            onClick={handleMergeDataToNewSheet}
          >
            Tải xuống file Excel
          </Button>
        </div>
      </div>
    </div>
  );
}
