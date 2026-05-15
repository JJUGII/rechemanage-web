import { describe, expect, it } from "vitest";
import { nextSortDirection, sortTransactionRows } from "../sortTransactions";
import type { Transaction } from "../types";

const base = (over: Partial<Transaction>): Transaction => ({
  id: "1",
  date: "2026-05-01",
  time: "10:00",
  description: "a",
  deposit: 0,
  withdrawal: 1000,
  balance: 5000,
  month: "2026-05",
  category: "간식비",
  supportStatus: "인정",
  reason: "",
  sourceFileName: "f",
  sourceFileKey: "k",
  receiptAttached: false,
  ...over,
});

describe("sortTransactionRows", () => {
  it("날짜 오름차순", () => {
    const rows = [base({ id: "b", date: "2026-05-02" }), base({ id: "a", date: "2026-05-01" })];
    const s = sortTransactionRows(rows, "date", "asc");
    expect(s.map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("입금 숫자 정렬", () => {
    const rows = [base({ id: "x", deposit: 500 }), base({ id: "y", deposit: 2000 })];
    const s = sortTransactionRows(rows, "deposit", "desc");
    expect(s.map((x) => x.id)).toEqual(["y", "x"]);
  });

  it("잔액 없음은 맨 아래(asc에서 -Infinity)", () => {
    const rows = [base({ id: "a", balance: 100 }), base({ id: "b", balance: undefined })];
    const s = sortTransactionRows(rows, "balance", "asc");
    expect(s.map((x) => x.id)).toEqual(["a", "b"]);
  });
});

describe("nextSortDirection", () => {
  it("열 변경 시 asc", () => {
    expect(nextSortDirection("date", "deposit", "desc")).toBe("asc");
  });

  it("같은 열이면 토글", () => {
    expect(nextSortDirection("date", "date", "asc")).toBe("desc");
    expect(nextSortDirection("date", "date", "desc")).toBe("asc");
  });
});
