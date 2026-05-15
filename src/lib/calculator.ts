import type { MonthlySummary, Transaction } from "./types";

export function computeMonthlySummary(
  transactions: Transaction[],
  month: string,
  memberCount: number,
): MonthlySummary {
  const inMonth = transactions.filter((t) => t.month === month);
  const limitAmount = memberCount * 20000;

  let acceptedAmount = 0;
  let pendingAmount = 0;
  let rejectedAmount = 0;
  let excludedAmount = 0;

  for (const t of inMonth) {
    const w = t.withdrawal || 0;
    switch (t.supportStatus) {
      case "인정":
        acceptedAmount += w;
        break;
      case "확인필요":
        pendingAmount += w;
        break;
      case "불인정":
        rejectedAmount += w;
        break;
      case "계산제외":
        excludedAmount += t.deposit + w;
        break;
      default:
        break;
    }
  }

  const expectedCashback = Math.min(limitAmount, acceptedAmount);

  return {
    month,
    memberCount,
    limitAmount,
    acceptedAmount,
    pendingAmount,
    rejectedAmount,
    excludedAmount,
    expectedCashback,
  };
}

export function allMonthsFromTransactions(transactions: Transaction[]): string[] {
  const set = new Set<string>();
  for (const t of transactions) {
    if (t.month) set.add(t.month);
  }
  return [...set].sort();
}
