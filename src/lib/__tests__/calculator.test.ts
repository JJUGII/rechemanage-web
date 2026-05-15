import { describe, expect, it } from "vitest";
import { computeMonthlySummary } from "../calculator";
import type { Transaction } from "../types";

const baseTx = (over: Partial<Transaction>): Transaction => ({
  id: "1",
  date: "2026-05-01",
  description: "x",
  deposit: 0,
  withdrawal: 0,
  month: "2026-05",
  category: "확인필요",
  supportStatus: "확인필요",
  reason: "",
  sourceFileName: "f",
  sourceFileKey: "k",
  receiptAttached: false,
  ...over,
});

describe("calculator", () => {
  it("예상 캐시백 = min(한도, 인정 출금) — 50% 없음", () => {
    const txs: Transaction[] = [
      baseTx({ withdrawal: 30000, supportStatus: "인정" }),
      baseTx({ id: "2", withdrawal: 10000, supportStatus: "인정" }),
    ];
    const s = computeMonthlySummary(txs, "2026-05", 2);
    expect(s.limitAmount).toBe(40000);
    expect(s.acceptedAmount).toBe(40000);
    expect(s.expectedCashback).toBe(40000);
  });

  it("인정이 한도 초과 시 캡", () => {
    const txs: Transaction[] = [baseTx({ withdrawal: 100000, supportStatus: "인정" })];
    const s = computeMonthlySummary(txs, "2026-05", 2);
    expect(s.expectedCashback).toBe(40000);
  });
});
