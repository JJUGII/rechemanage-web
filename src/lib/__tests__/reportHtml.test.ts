import { describe, expect, it } from "vitest";
import { buildActivityReportHtml } from "../reportHtml";
import type { Transaction } from "../types";

const row = (over: Partial<Transaction>): Transaction => ({
  id: "test-id-1",
  date: "2026-05-10",
  description: "씨유 송파점 / 체크카드결제",
  deposit: 0,
  withdrawal: 5000,
  month: "2026-05",
  category: "간식비",
  supportStatus: "인정",
  reason: "테스트",
  sourceFileName: "a.csv",
  sourceFileKey: "k",
  receiptAttached: false,
  ...over,
});

describe("reportHtml", () => {
  it("원본 형식 회비·활동 표 구조", () => {
    const html = buildActivityReportHtml("2026-05", [row({})], 20);
    expect(html).toContain("날짜");
    expect(html).toContain("사용내역");
    expect(html).toContain("거래처");
    expect(html).toContain("입금액");
    expect(html).toContain("지출액");
    expect(html).toContain("5.10");
    expect(html).toContain("간식");
    expect(html).toContain("모임일시");
    expect(html).toContain("참석자정보");
    expect(html).toContain("총 인원 20 명중");
    expect(html).toContain("BORDER-TOP: rgb(0,0,0)");
  });

  it("같은 날 출금은 모임 단위로 묶음", () => {
    const html = buildActivityReportHtml(
      "2026-05",
      [
        row({ id: "a", withdrawal: 3000, description: "CU" }),
        row({ id: "b", withdrawal: 2000, description: "GS25" }),
      ],
      15,
    );
    const meetingBlocks = html.split("모임일시").length - 1;
    expect(meetingBlocks).toBe(2);
    expect(html).toContain("5,000원");
  });
});
