"use client";

import { useState } from "react";

export interface PendingEncryptedFile {
  fileKey: string;
  fileName: string;
  error?: string;
}

interface EncryptedExcelPromptProps {
  items: PendingEncryptedFile[];
  disabled?: boolean;
  onUnlock: (fileKey: string, password: string) => void | Promise<void>;
  onDismiss: (fileKey: string) => void;
}

export function EncryptedExcelPrompt({ items, disabled, onUnlock, onDismiss }: EncryptedExcelPromptProps) {
  const [passwords, setPasswords] = useState<Record<string, string>>({});

  if (!items.length) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3 text-sm shadow-sm">
      <p className="text-amber-900 font-medium text-xs">암호화된 엑셀입니다. 비밀번호를 입력해주세요.</p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.fileKey} className="border border-amber-100 rounded-md bg-white p-2.5 space-y-2">
            <p className="text-xs font-medium text-slate-800 truncate" title={item.fileName}>
              {item.fileName}
            </p>
            {item.error ? <p className="text-[11px] text-rose-700">{item.error}</p> : null}
            <label className="block text-xs text-slate-600">
              비밀번호
              <input
                type="password"
                autoComplete="off"
                className="mt-1 w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                value={passwords[item.fileKey] ?? ""}
                disabled={disabled}
                onChange={(e) =>
                  setPasswords((p) => ({
                    ...p,
                    [item.fileKey]: e.target.value,
                  }))
                }
                aria-label={`${item.fileName} 엑셀 비밀번호`}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="text-xs px-2.5 py-1.5 rounded bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-40"
                disabled={disabled || !(passwords[item.fileKey] ?? "").trim()}
                onClick={() => void onUnlock(item.fileKey, (passwords[item.fileKey] ?? "").trim())}
              >
                비밀번호 적용 후 다시 읽기
              </button>
              <button
                type="button"
                className="text-xs px-2.5 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                disabled={disabled}
                onClick={() => onDismiss(item.fileKey)}
              >
                취소
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
