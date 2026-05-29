import { describe, expect, it } from "vitest";
import {
  buildActivityRowsAuto,
  buildActivityRowsFromGroups,
  buildFeeRowsForMonth,
} from "../activityReportAuto";
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

  it("수동 묶음: 여러 날 거래를 한 모임으로 합산하고 override 적용", () => {
    const rows = buildActivityRowsFromGroups(
      [
        tx({ id: "a", date: "2026-05-06", description: "간식", category: "간식비", supportStatus: "인정", withdrawal: 44000 }),
        tx({ id: "b", date: "2026-05-08", description: "저녁", category: "활동식대", supportStatus: "인정", withdrawal: 100000 }),
        tx({ id: "c", date: "2026-05-09", description: "불인정 항목", supportStatus: "불인정", withdrawal: 5000 }),
      ],
      [
        { txIds: ["a", "b"], meetingPlace: "시글루 송리단길점", costDetail: "정기 모임", attendedMembers: 12 },
        { txIds: ["c"] },
      ],
      20,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]!.activityCost).toBe(144000);
    expect(rows[0]!.meetingPlace).toBe("시글루 송리단길점");
    expect(rows[0]!.costDetail).toBe("정기 모임");
    expect(rows[0]!.attendedMembers).toBe(12);
    // 불인정 항목도 사용자가 직접 묶으면 포함된다.
    expect(rows[1]!.activityCost).toBe(5000);
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
