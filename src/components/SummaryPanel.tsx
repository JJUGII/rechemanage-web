"use client";

import type { MonthlySummary } from "@/lib/types";
import { formatCurrency } from "@/lib/formatters";
import { getSupportStatusSummaryCardClass } from "@/lib/statusStyles";

interface SummaryPanelProps {
  summary: MonthlySummary | null;
  monthFilter: string;
  memberCount: number;
  onMemberCountChange: (n: number) => void;
  onGenerateReport: () => void;
  disabled?: boolean;
}

function SummaryRow({
  className,
  label,
  value,
  valueClassName = "shrink-0",
}: {
  className: string;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className={className}>
      <dt>{label}</dt>
      <dd className={valueClassName}>{value}</dd>
    </div>
  );
}

export function SummaryPanel({
  summary,
  monthFilter,
  memberCount,
  onMemberCountChange,
  onGenerateReport,
  disabled = false,
}: SummaryPanelProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-3 shadow-sm w-full min-w-0">
      <h2 className="font-semibold text-sm text-slate-800">요약</h2>
      <label className="block text-sm text-slate-700">
        회원 수
        <input
          type="number"
          min={1}
          className="mt-1 w-full border rounded px-2 py-1 max-w-full"
          value={memberCount}
          disabled={disabled}
          onChange={(e) => onMemberCountChange(Math.max(1, Number(e.target.value) || 1))}
          aria-label="회원 수"
        />
      </label>
      {monthFilter === "전체" || !summary ? (
        <p className="text-xs text-slate-500">월을 선택하면 월별 요약·예상 캐시백이 표시됩니다.</p>
      ) : (
        <dl className="text-xs space-y-2">
          <SummaryRow
            className={getSupportStatusSummaryCardClass("neutral")}
            label="월"
            value={summary.month}
            valueClassName="font-medium shrink-0"
          />
          <SummaryRow
            className={getSupportStatusSummaryCardClass("neutral")}
            label="월 지원한도"
            value={formatCurrency(summary.limitAmount)}
          />
          <SummaryRow
            className={getSupportStatusSummaryCardClass("accepted")}
            label="인정 출금 합"
            value={formatCurrency(summary.acceptedAmount)}
            valueClassName="shrink-0 font-medium"
          />
          <SummaryRow
            className={getSupportStatusSummaryCardClass("pending")}
            label="확인필요"
            value={formatCurrency(summary.pendingAmount)}
            valueClassName="shrink-0 font-medium"
          />
          <SummaryRow
            className={getSupportStatusSummaryCardClass("rejected")}
            label="불인정"
            value={formatCurrency(summary.rejectedAmount)}
            valueClassName="shrink-0 font-medium"
          />
          <SummaryRow
            className={getSupportStatusSummaryCardClass("excluded")}
            label="계산제외(입+출)"
            value={formatCurrency(summary.excludedAmount)}
            valueClassName="shrink-0 font-medium"
          />
          <SummaryRow
            className={getSupportStatusSummaryCardClass("cashback")}
            label="예상 캐시백"
            value={formatCurrency(summary.expectedCashback)}
          />
        </dl>
      )}
      <button
        type="button"
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        disabled={disabled}
        onClick={onGenerateReport}
        aria-label="활동보고서 생성"
      >
        활동보고서 생성
      </button>
    </div>
  );
}
