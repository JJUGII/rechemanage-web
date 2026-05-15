import type { Transaction } from "./types";

export type SortColumn =
  | "date"
  | "description"
  | "deposit"
  | "withdrawal"
  | "balance"
  | "category"
  | "supportStatus";

export type SortDirection = "asc" | "desc";

export function sortTransactionRows(
  rows: Transaction[],
  column: SortColumn | null,
  direction: SortDirection,
): Transaction[] {
  if (!column) return [...rows];
  const m = direction === "asc" ? 1 : -1;
  const list = [...rows];
  list.sort((a, b) => {
    switch (column) {
      case "date": {
        const norm = (t: Transaction) => {
          const tm = (t.time || "00:00").trim();
          const parts = tm.split(":").map((x) => x.padStart(2, "0"));
          const hh = parts[0] ?? "00";
          const mm = parts[1] ?? "00";
          const ss = parts[2] ?? "00";
          return `${t.date}T${hh}:${mm}:${ss}`;
        };
        return m * norm(a).localeCompare(norm(b));
      }
      case "description":
        return m * a.description.localeCompare(b.description, "ko");
      case "deposit":
        return m * (a.deposit - b.deposit);
      case "withdrawal":
        return m * (a.withdrawal - b.withdrawal);
      case "balance": {
        const ba = a.balance ?? Number.POSITIVE_INFINITY;
        const bb = b.balance ?? Number.POSITIVE_INFINITY;
        return m * (ba - bb);
      }
      case "category":
        return m * a.category.localeCompare(b.category, "ko");
      case "supportStatus":
        return m * a.supportStatus.localeCompare(b.supportStatus, "ko");
      default:
        return 0;
    }
  });
  return list;
}

export function nextSortDirection(
  current: SortColumn | null,
  nextCol: SortColumn,
  dir: SortDirection,
): SortDirection {
  if (current === nextCol) return dir === "asc" ? "desc" : "asc";
  return "asc";
}
