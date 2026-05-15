/** Excel 시트 2차원 배열 공통 유틸 */

export function normCell(s: string): string {
  return String(s ?? "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

export function isRowEmpty(row: unknown[] | undefined): boolean {
  if (!row?.length) return true;
  return row.every((c) => normCell(String(c ?? "")) === "");
}

/** 천단위 콤마·원 — 부호 유지 */
export function parseSignedAmount(v: unknown): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number" && !Number.isNaN(v)) return Math.round(v);
  const s = String(v).replace(/,/g, "").replace(/원/g, "").trim();
  if (!s || s === "-") return 0;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export function parseUnsignedAmount(v: unknown): number {
  return Math.abs(parseSignedAmount(v));
}

/** YYYY-MM-DD + optional time */
export function parseDateTimeCell(v: unknown): { date: string; time: string } | null {
  if (v == null || v === "") return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    const hh = String(v.getHours()).padStart(2, "0");
    const mm = String(v.getMinutes()).padStart(2, "0");
    return { date: `${y}-${m}-${d}`, time: `${hh}:${mm}` };
  }
  const s = String(v).trim();
  const m1 = s.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (m1) {
    const y = m1[1];
    const mo = m1[2].padStart(2, "0");
    const da = m1[3].padStart(2, "0");
    const t = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    const time = t
      ? `${t[1].padStart(2, "0")}:${t[2]}${t[3] ? `:${t[3]}` : ""}`
      : "";
    return { date: `${y}-${mo}-${da}`, time: time.slice(0, 5) };
  }
  return null;
}

export function findColInRow(row: unknown[], aliases: readonly string[]): number {
  const cells = row.map((c) => normCell(String(c ?? "")));

  for (let c = 0; c < cells.length; c++) {
    const n = cells[c];
    if (!n) continue;
    for (const a of aliases) {
      if (n === normCell(a)) return c;
    }
  }

  for (let c = 0; c < cells.length; c++) {
    const n = cells[c];
    if (!n) continue;
    for (const a of aliases) {
      const an = normCell(a);
      if (an.length >= 3 && n.includes(an)) return c;
    }
  }

  return -1;
}
