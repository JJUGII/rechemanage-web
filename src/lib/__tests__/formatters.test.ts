import { describe, expect, it } from "vitest";
import { formatCurrency, formatNumber, parseFormattedInt } from "../formatters";

describe("formatters", () => {
  it("formatNumber 천단위", () => {
    expect(formatNumber(10000)).toBe("10,000");
    expect(formatNumber(302500)).toBe("302,500");
    expect(formatNumber(0)).toBe("0");
  });

  it("formatNumber NaN/null 안전", () => {
    expect(formatNumber(null)).toBe("0");
    expect(formatNumber(undefined)).toBe("0");
    expect(formatNumber(Number.NaN)).toBe("0");
  });

  it("formatCurrency", () => {
    expect(formatCurrency(1234)).toBe("1,234원");
  });

  it("parseFormattedInt", () => {
    expect(parseFormattedInt("10,000")).toBe(10000);
    expect(parseFormattedInt("1,234원")).toBe(1234);
    expect(parseFormattedInt("")).toBe(0);
  });
});
