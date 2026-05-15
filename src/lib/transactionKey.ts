import type { Transaction } from "./types";

/**
 * 거래 중복 판별 키 (파일명 무관)
 * 거래일시 + 입출금액 + 적요 + 잔액
 */
export function makeTransactionKey(tx: Transaction): string {
  const amount = tx.deposit > 0 ? `+${tx.deposit}` : tx.withdrawal > 0 ? `-${tx.withdrawal}` : "0";
  return [tx.date, tx.time ?? "", amount, tx.description, tx.balance != null ? String(tx.balance) : ""].join(
    "|",
  );
}

export function makeFileKey(file: File): string {
  return `${file.name}::${file.size}::${file.lastModified}`;
}
