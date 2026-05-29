import { describe, expect, it } from "vitest";
import { buildActivityRowsAuto, buildFeeRowsForMonth } from "../activityReportAuto";
import type { Transaction } from "../types";

const tx = (over: Partial<Transaction>): Transaction => ({
  id: "1",
  date: "2026-04-08",
  description: "BBQ 잠실",
  deposit: 0,
  withdrawal: 45000,
  month: "2026-04",
  category: "식대",
  supportStatus: "불인정",
  reason: "",
  sourceFileName: "x",
  sourceFileKey: "k",
  receiptAttached: false,
  ...over,
});

describe("activityReportAuto", () => {
  it("불인정·캐시백 출금은 활동 모임에서 제외", () => {
    const rows = buildActivityRowsAuto(
      [
        tx({ supportStatus: "불인정" }),
        tx({ id: "2", description: "캐시백", withdrawal: 300, supportStatus: "인정" }),
        tx({ id: "3", category: "간식비", supportStatus: "인정", withdrawal: 8000 }),
      ],
      20,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.activityCost).toBe(8000);
  });

  it("비고는 같은 라벨 항목을 합산해 한 줄로 표시", () => {
    const rows = buildActivityRowsAuto(
      [
        tx({ id: "a", description: "간식-1", category: "간식비", supportStatus: "인정", withdrawal: 44000 }),
        tx({ id: "b", description: "간식-2", category: "간식비", supportStatus: "인정", withdrawal: 5400 }),
        tx({ id: "c", description: "저녁식사", category: "활동식대", supportStatus: "인정", withdrawal: 105200 }),
      ],
      20,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.note).toContain("간식 (49,400원)");
    expect(rows[0]!.note).not.toContain("간식 (44,000원)");
    expect(rows[0]!.activityCost).toBe(154600);
  });

  it("fee 행은 사용내역·거래처 분리", () => {
    const fees = buildFeeRowsForMonth([
      tx({
        supportStatus: "인정",
        category: "간식비",
        description: "CU 송파점",
        withdrawal: 5000,
      }),
    ]);
    expect(fees[0]!.usage).toBe("간식");
    expect(fees[0]!.merchant).toContain("CU");
  });
});
