import { describe, expect, it, vi, beforeEach } from "vitest";
import { parseExcelFile } from "../parsers/parseExcel";
import { isParseExcelSuccess } from "../parsers/parseExcelTypes";
import { applyFileMerge } from "../applyFileMerge";
import type { Transaction } from "../types";

const mockFile = new File([""], "test.xlsx", {
  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
});

vi.mock("../parsers/excelCrypto", () => ({
  isEncryptedExcelBuffer: vi.fn(),
  decryptExcelBuffer: vi.fn(),
}));

import { isEncryptedExcelBuffer, decryptExcelBuffer } from "../parsers/excelCrypto";

const tx = (id: string, description: string): Transaction => ({
  id,
  date: "2026-05-01",
  description,
  deposit: 0,
  withdrawal: 1000,
  month: "2026-05",
  category: "간식비",
  supportStatus: "인정",
  reason: "",
  sourceFileName: "test.xlsx",
  sourceFileKey: "test.xlsx::0::0",
  receiptAttached: false,
});

describe("parseExcelFile", () => {
  beforeEach(() => {
    vi.mocked(isEncryptedExcelBuffer).mockReset();
    vi.mocked(decryptExcelBuffer).mockReset();
  });

  it("암호 없이 encrypted → needsPassword", async () => {
    vi.mocked(isEncryptedExcelBuffer).mockResolvedValue(true);
    const r = await parseExcelFile(new ArrayBuffer(8), mockFile);
    expect(isParseExcelSuccess(r)).toBe(false);
    if (!isParseExcelSuccess(r)) {
      expect(r.needsPassword).toBe(true);
      expect(r.encrypted).toBe(true);
    }
  });

  it("비밀번호 틀림 → wrongPassword", async () => {
    vi.mocked(isEncryptedExcelBuffer).mockResolvedValue(true);
    vi.mocked(decryptExcelBuffer).mockResolvedValue({
      ok: false,
      kind: "wrongPassword",
      message: "엑셀 비밀번호가 올바르지 않습니다.",
    });
    const r = await parseExcelFile(new ArrayBuffer(8), mockFile, "bad");
    expect(isParseExcelSuccess(r)).toBe(false);
    if (!isParseExcelSuccess(r)) {
      expect(r.wrongPassword).toBe(true);
      expect(r.needsPassword).toBe(true);
    }
  });
});

describe("applyFileMerge after password success", () => {
  it("merge 시 addedRows > 0", () => {
    const incoming = [tx("a", "거래A"), tx("b", "거래B")];
    const outcome = applyFileMerge([], incoming, mockFile, new Set());
    expect(outcome.merge.toAdd.length).toBe(2);
    expect(outcome.loadedFile.addedRows).toBe(2);
    expect(outcome.loadedFile.status).toBe("반영성공");
  });

  it("0건 incoming → addedRows 0", () => {
    const outcome = applyFileMerge([], [], mockFile, new Set());
    expect(outcome.loadedFile.addedRows).toBe(0);
    expect(outcome.loadedFile.status).toBe("실패");
  });
});
