"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

const ACCEPT = {
  "text/csv": [".csv"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
} as const;

const EXT_OK = /\.(csv|xlsx|xls)$/i;

interface FileUploaderProps {
  onFiles: (files: File[]) => void | Promise<void>;
  disabled?: boolean;
}

export function FileUploader({ onFiles, disabled }: FileUploaderProps) {
  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted.length || disabled) return;
      await onFiles(accepted);
    },
    [onFiles, disabled],
  );

  const onDropRejected = useCallback(() => {
    toast.error("지원하지 않는 파일 형식입니다. (.xlsx, .xls, .csv 만 가능)");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPT,
    multiple: true,
    disabled,
    noClick: false,
    noKeyboard: true,
    validator: (file) => {
      if (!EXT_OK.test(file.name)) {
        return { code: "file-invalid-type", message: "extension" };
      }
      return null;
    },
  });

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
      <h2 className="font-semibold text-sm mb-2 text-slate-800">파일 업로드</h2>
      <p className="text-xs text-slate-500 mb-2">.xlsx, .xls, .csv — 여러 개 선택 가능</p>
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg py-6 px-3 cursor-pointer transition-colors outline-none min-h-[120px] sm:min-h-[140px] ${
          disabled
            ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
            : isDragActive
              ? "border-indigo-500 bg-indigo-50 border-solid"
              : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
        }`}
        aria-label="거래 파일 업로드 영역"
      >
        <input {...getInputProps()} />
        <span className={`text-sm font-medium ${isDragActive ? "text-indigo-800" : "text-slate-600"}`}>
          {isDragActive ? "파일을 여기에 놓으세요" : "클릭하여 선택 또는 드래그 앤 드롭"}
        </span>
        <span className="text-xs text-slate-500 mt-1 text-center">다중 파일 지원</span>
      </div>
    </div>
  );
}
