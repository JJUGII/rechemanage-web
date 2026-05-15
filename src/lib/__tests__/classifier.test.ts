import { describe, expect, it } from "vitest";
import { classifyTransaction } from "../classifier";

describe("classifier", () => {
  it("우아한형제들 → 불인정", () => {
    const r = classifyTransaction("우아한형제들 주문", undefined, 0, 15000);
    expect(r.supportStatus).toBe("불인정");
  });

  it("CU 라면 → 인정", () => {
    const r = classifyTransaction("CU 라면", undefined, 0, 3000);
    expect(r.supportStatus).toBe("인정");
    expect(r.category).toBe("간식비");
  });

  it("주차비 → 확인필요", () => {
    const r = classifyTransaction("주차비", undefined, 0, 5000);
    expect(r.supportStatus).toBe("확인필요");
    expect(r.category).toBe("주차비");
  });

  it("이자 입금 → 계산제외", () => {
    const r = classifyTransaction("이자", undefined, 5000, 0);
    expect(r.supportStatus).toBe("계산제외");
    expect(r.category).toBe("입금");
  });

  it("네이버페이 가죽공예 → 인정", () => {
    const r = classifyTransaction("네이버페이 가죽공예", undefined, 0, 40000);
    expect(r.supportStatus).toBe("인정");
  });
});
