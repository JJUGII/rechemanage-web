import type { Transaction } from "./types";
import { makeTransactionKey } from "./transactionKey";

export interface MergeResult {
  toAdd: Transaction[];
  duplicateRows: number;
  excludedRows: number;
}

export function computeMerge(
  prev: Transaction[],
  incoming: Transaction[],
  excludedTxKeys: Set<string>,
): MergeResult {
  const existingKeys = new Set(prev.map((t) => makeTransactionKey(t)));
  const toAdd: Transaction[] = [];
  let duplicateRows = 0;
  let excludedRows = 0;
  for (const t of incoming) {
    const k = makeTransactionKey(t);
    if (excludedTxKeys.has(k)) {
      excludedRows++;
      continue;
    }
    if (existingKeys.has(k)) {
      duplicateRows++;
      continue;
    }
    existingKeys.add(k);
    toAdd.push(t);
  }
  return { toAdd, duplicateRows, excludedRows };
}
