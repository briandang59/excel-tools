import React, { useState, useCallback } from "react";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps, UploadFile } from "antd";
import { message, Upload, Select, Spin } from "antd";
import * as XLSX from "xlsx";
import { useExcelStore } from "@/stores/excelStore";
import { useShallow } from "zustand/react/shallow";

const { Dragger } = Upload;
const { Option } = Select;

const UploadExcel: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);

  const { setFileInfo, loadSheetData, clearData } = useExcelStore(
    useShallow((state) => ({
      fileName: state.fileName,
      sheets: state.sheets,
      allSheetsData: state.allSheetsData,
      sheetConfigs: state.sheetConfigs,
      currentData: state.currentData,
      setFileInfo: state.setFileInfo,
      setSheetConfig: state.setSheetConfig,
      loadSheetData: state.loadSheetData,
      clearData: state.clearData,
    })),
  );

  const readExcelFile = useCallback(
    (file: File) => {
      setLoading(true);
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const dataArray = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(dataArray, { type: "array" });

          const sheetNames = wb.SheetNames;

          setFileInfo(file.name, sheetNames, wb);

          // Load dữ liệu tất cả các sheet
          sheetNames.forEach((sheetName) => {
            loadSheetData(sheetName);
          });
        } catch (error) {
          message.error("Đọc file Excel thất bại!");
          console.error(error);
        } finally {
          setLoading(false);
        }
      };

      reader.readAsArrayBuffer(file);
    },
    [setFileInfo, loadSheetData],
  );

  const props: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".xlsx,.xls",
    fileList,
    beforeUpload: (file) => {
      const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
      if (!isExcel) {
        message.error("Chỉ chấp nhận file Excel (.xlsx, .xls)!");
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

  return (
    <div>
      <Spin spinning={loading}>
        <Dragger {...props}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text text-white!">
            Click hoặc kéo thả file Excel vào đây
          </p>
          <p className="ant-upload-hint text-white!">
            Hỗ trợ file .xlsx, .xls. Bạn có thể đổi tên cột cho từng sheet.
          </p>
        </Dragger>
      </Spin>
    </div>
  );
};

export default UploadExcel;
