/** 화면/HTML 표시용 — 내부 계산은 number 유지 */

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "0";
  return Math.round(value).toLocaleString("ko-KR");
}

export function formatCurrency(value: number | null | undefined): string {
  return `${formatNumber(value)}원`;
}

export function parseFormattedInt(input: string): number {
  const n = Number(String(input).replace(/,/g, "").replace(/원/g, "").trim());
  return Number.isFinite(n) ? Math.round(n) : 0;
}
