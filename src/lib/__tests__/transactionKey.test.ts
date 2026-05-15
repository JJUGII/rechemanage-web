import { describe, expect, it } from "vitest";
import { makeTransactionKey } from "../transactionKey";
import type { Transaction } from "../types";

const tx = (d: string, desc: string, dep: number, w: number, bal?: number): Transaction => ({
  id: "i",
  date: d,
  description: desc,
  deposit: dep,
  withdrawal: w,
  balance: bal,
  month: d.slice(0, 7),
  category: "x",
  supportStatus: "인정",
  reason: "",
  sourceFileName: "",
  sourceFileKey: "",
  receiptAttached: false,
});

describe("transactionKey", () => {
  it("동일 입력 → 동일 키", () => {
    const a = tx("2026-01-02", "적요", 0, 1000, 5000);
    const b = tx("2026-01-02", "적요", 0, 1000, 5000);
    expect(makeTransactionKey(a)).toBe(makeTransactionKey(b));
  });

  it("금액 다르면 키 다름", () => {
    const a = tx("2026-01-02", "적요", 0, 1000);
    const b = tx("2026-01-02", "적요", 0, 2000);
    expect(makeTransactionKey(a)).not.toBe(makeTransactionKey(b));
  });

  it("입금/출금 부호가 키에 반영됨", () => {
    const dep = tx("2026-01-02", "적요", 1000, 0);
    const wdr = tx("2026-01-02", "적요", 0, 1000);
    expect(makeTransactionKey(dep)).not.toBe(makeTransactionKey(wdr));
  });
});
