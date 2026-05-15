import { describe, expect, it } from "vitest";
import { getSupportStatusBadgeClass, getSupportStatusSummaryCardClass } from "../statusStyles";

describe("statusStyles", () => {
  it("인정 badge에 green 포함", () => {
    expect(getSupportStatusBadgeClass("인정")).toMatch(/green/);
  });

  it("확인필요 badge에 orange 포함", () => {
    expect(getSupportStatusBadgeClass("확인필요")).toMatch(/orange/);
  });

  it("불인정 badge에 red 포함", () => {
    expect(getSupportStatusBadgeClass("불인정")).toMatch(/red/);
  });

  it("계산제외 badge에 slate 포함", () => {
    expect(getSupportStatusBadgeClass("계산제외")).toMatch(/slate/);
  });

  it("요약 카드 색상", () => {
    expect(getSupportStatusSummaryCardClass("accepted")).toMatch(/green/);
    expect(getSupportStatusSummaryCardClass("pending")).toMatch(/orange/);
    expect(getSupportStatusSummaryCardClass("rejected")).toMatch(/red/);
    expect(getSupportStatusSummaryCardClass("excluded")).toMatch(/slate/);
  });
});
