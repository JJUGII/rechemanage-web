import type { SupportStatus } from "./types";

/** 거래 표 인정여부 select / badge */
export function getSupportStatusBadgeClass(status: SupportStatus): string {
  const base = "rounded-full border px-2 py-0.5 text-xs font-semibold";
  switch (status) {
    case "인정":
      return `${base} bg-green-100 text-green-800 border-green-200`;
    case "확인필요":
      return `${base} bg-orange-100 text-orange-800 border-orange-200`;
    case "불인정":
      return `${base} bg-red-100 text-red-800 border-red-200`;
    case "계산제외":
      return `${base} bg-slate-100 text-slate-700 border-slate-200`;
    default:
      return `${base} bg-slate-50 text-slate-600 border-slate-200`;
  }
}

/** 요약 패널 금액 카드 */
export function getSupportStatusSummaryCardClass(
  kind: "accepted" | "pending" | "rejected" | "excluded" | "cashback" | "neutral",
): string {
  const base = "flex justify-between gap-2 rounded-lg border px-2.5 py-2";
  switch (kind) {
    case "accepted":
      return `${base} bg-green-50 border-green-200 text-green-900`;
    case "pending":
      return `${base} bg-orange-50 border-orange-200 text-orange-900`;
    case "rejected":
      return `${base} bg-red-50 border-red-200 text-red-900`;
    case "excluded":
      return `${base} bg-slate-50 border-slate-200 text-slate-800`;
    case "cashback":
      return `${base} bg-emerald-50/80 border-emerald-200 text-emerald-900 font-semibold`;
    case "neutral":
    default:
      return `${base} bg-white border-slate-200 text-slate-800`;
  }
}
