"use client";

import { useRef } from "react";
import { toast } from "sonner";
import {
  buildPersistedSettingsSnapshot,
  parseImportedSettings,
  writePersistedSettingsToStorage,
} from "@/lib/storage";
import type { PersistedWebSettings } from "@/lib/storage";

interface SettingsMenuProps {
  getSnapshot: () => {
    excludedFileKeys: Set<string>;
    excludedTransactionKeys: Set<string>;
    memberCount: number;
    lastSelectedMonth: string;
  };
  onImported: (s: PersistedWebSettings) => void;
  onClearExclusions: () => void;
}

export function SettingsMenu({ getSnapshot, onImported, onClearExclusions }: SettingsMenuProps) {
  const importRef = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const snap = getSnapshot();
    const data = buildPersistedSettingsSnapshot({
      excludedFileKeys: snap.excludedFileKeys,
      excludedTransactionKeys: snap.excludedTransactionKeys,
      memberCount: snap.memberCount,
      lastSelectedMonth: snap.lastSelectedMonth,
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reche-web-settings.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("설정보내기 완료");
  };

  const onPickImport = () => importRef.current?.click();

  const onImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
      const parsed = parseImportedSettings(raw);
      writePersistedSettingsToStorage(parsed);
      onImported(parsed);
      toast.success("설정을 불러왔습니다.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "설정 파일을 읽을 수 없습니다.";
      toast.error(`설정 불러오기 실패: ${msg}`);
    }
  };

  const clearExcl = () => {
    if (!confirm("사용자 제외(삭제한 거래·반영취소 파일) 기록을 모두 지울까요?")) return;
    onClearExclusions();
    toast.success("사용자 제외가 초기화되었습니다.");
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-xs text-slate-500 mr-1 hidden sm:inline">설정</span>
      <button
        type="button"
        className="text-xs px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
        onClick={exportJson}
        aria-label="설정보내기"
      >
        보내기
      </button>
      <button
        type="button"
        className="text-xs px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
        onClick={onPickImport}
        aria-label="설정 불러오기"
      >
        불러오기
      </button>
      <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={onImportChange} />
      <button
        type="button"
        className="text-xs px-2 py-1 rounded border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800"
        onClick={clearExcl}
        aria-label="사용자 제외 초기화"
      >
        제외 초기화
      </button>
    </div>
  );
}
