"use client";
import React, { useState, useCallback } from "react";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps, UploadFile } from "antd";
import { message, Upload, Select, Spin, Button } from "antd";
import * as XLSX from "xlsx";
import { useExcelStore } from "@/stores/excelStore";
import { useShallow } from "zustand/react/shallow";

const { Dragger } = Upload;

// 👇 define type dùng chung
type SheetType = "normal" | "schedule";

const UploadExcel: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    sheets,
    sheetKeys,
    setFileInfo,
    setSheetType,
    loadAllSheets,
    clearData,
  } = useExcelStore(
    useShallow((state) => ({
      sheets: state.sheets,
      sheetKeys: state.sheetKeys,
      setFileInfo: state.setFileInfo,
      setSheetType: state.setSheetType,
      loadAllSheets: state.loadAllSheets,
      clearData: state.clearData,
    })),
  );

  // ================= READ FILE =================
  const readExcelFile = useCallback(
    (file: File) => {
      setLoading(true);
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array" });

          setFileInfo(file.name, wb.SheetNames, wb);
          // setTimeout(() => {
          //   loadAllSheets();
          // }, 0);
        } catch (err) {
          console.error(err);
          message.error("Đọc file Excel thất bại!");
        } finally {
          setLoading(false);
        }
      };

      reader.readAsArrayBuffer(file);
    },
    [setFileInfo],
  );

  // ================= UPLOAD CONFIG =================
  const props: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".xlsx,.xls",
    fileList,

    beforeUpload: (file) => {
      const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

      if (!isExcel) {
        message.error("Chỉ chấp nhận file Excel!");
        return Upload.LIST_IGNORE;
      }

      readExcelFile(file);
      setFileList([file as UploadFile]);
      return false;
    },

    onRemove: () => {
      setFileList([]);
      clearData();
    },
  };

  // ================= RENDER =================
  return (
    <div>
      {/* Upload */}
      <Spin spinning={loading}>
        <Dragger {...props}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="text-white">Upload Excel</p>
        </Dragger>
      </Spin>

      {/* Select Sheet Type */}
      {sheets.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {sheets.map((sheet) => {
            const key = sheetKeys[sheet];

            return (
              <div key={sheet} style={{ marginBottom: 12 }}>
                <div style={{ color: "#fff", marginBottom: 4 }}>{sheet}</div>

                {/* 👇 FIX TYPE ở đây */}
                <Select<SheetType>
                  defaultValue="normal"
                  style={{ width: "100%" }}
                  onChange={(value) => {
                    setSheetType(key, value);
                  }}
                  options={[
                    {
                      label: "Dữ liệu bình thường (dòng đầu tiêu đề)",
                      value: "normal",
                    },
                    { label: "Dữ liệu kiểu ma trận", value: "schedule" },
                  ]}
                />
              </div>
            );
          })}

          {/* Parse Button */}
          <Button
            type="primary"
            style={{ marginTop: 10, width: "100%" }}
            onClick={loadAllSheets}
          >
            Parse Data
          </Button>
        </div>
      )}
    </div>
  );
};

export default UploadExcel;
