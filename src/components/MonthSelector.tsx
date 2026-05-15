"use client";

import { format } from "date-fns";

interface MonthSelectorProps {
  months: string[];
  value: string;
  onChange: (m: string) => void;
}

export function MonthSelector({ months, value, onChange }: MonthSelectorProps) {
  const currentYm = format(new Date(), "yyyy-MM");
  return (
    <label className="text-sm flex items-center gap-1 flex-wrap">
      <span className="text-slate-700">월</span>
      <select
        className="border rounded px-2 py-1 text-sm min-w-[140px] max-w-full bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="거래 월 필터"
      >
        <option value="전체">전체</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {m}
            {m === currentYm ? " (이번 달)" : ""}
          </option>
        ))}
      </select>
      {value !== "전체" && value === currentYm && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
          이번 달
        </span>
      )}
    </label>
  );
}
