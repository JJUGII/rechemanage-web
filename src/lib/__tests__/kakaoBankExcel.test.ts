import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { findKakaoBankHeaderRow, parseKakaoBankGrid } from "../parsers/kakaoBankExcel";
import { parseExcelBuffer } from "../parsers/parseExcel";
import { computeMerge } from "../mergeHelpers";
import { isParseExcelSuccess } from "../parsers/parseExcelTypes";

/** B11~H 헤더 + 샘플 2행 (A열 비움) */
function mockKakaoGrid(): unknown[][] {
  const rows: unknown[][] = Array.from({ length: 12 }, () => [""]);
  rows[10] = ["", "거래일시", "구분", "거래금액", "거래 후 잔액", "거래구분", "내용", "메모"];
  rows[11] = ["", "2026.04.07 16:22:30", "입금", "1,000,000", "1,000,000", "일반입금", "맵퍼스레체능_100", ""];
  rows[12] = ["", "2026.04.08 10:00:00", "출금", "-50,000", "950,000", "일반이체", "테스트출금", "메모1"];
  return rows;
}

const mockFile = new File([""], "카카오뱅크_거래내역_test.xlsx");

describe("kakaoBankExcel", () => {
  it("헤더 행 탐색 — A열 비어 있어도 B열 거래일시", () => {
    const map = findKakaoBankHeaderRow(mockKakaoGrid());
    expect(map).not.toBeNull();
    expect(map!.headerRowIndex).toBe(10);
    expect(map!.date).toBe(1);
    expect(map!.content).toBe(6);
  });

  it("헤더 다음 줄부터 파싱", () => {
    const txs = parseKakaoBankGrid(mockKakaoGrid(), mockFile);
    expect(txs.length).toBe(2);
    expect(txs[0].deposit).toBe(1_000_000);
    expect(txs[0].description).toContain("맵퍼스");
    expect(txs[1].withdrawal).toBe(50_000);
  });

  it("동일 파일 2회 merge 시 중복 제거", () => {
    const txs = parseKakaoBankGrid(mockKakaoGrid(), mockFile);
    const first = computeMerge([], txs, new Set());
    expect(first.toAdd.length).toBe(2);
    const second = computeMerge(first.toAdd, txs, new Set());
    expect(second.toAdd.length).toBe(0);
    expect(second.duplicateRows).toBe(2);
  });
});

describe("kakao real file", () => {
  const inputPath = path.resolve(
    __dirname,
    "../../../../INPUT/카카오뱅크_거래내역_N8290.xlsx",
  );

  it.skipIf(!fs.existsSync(inputPath))("실제 N8290 xlsx 파싱", () => {
    const ab = fs.readFileSync(inputPath).buffer;
    const file = new File([ab], path.basename(inputPath));
    const r = parseExcelBuffer(ab, file);
    expect(isParseExcelSuccess(r)).toBe(true);
    if (isParseExcelSuccess(r)) {
      expect(r.transactions.length).toBeGreaterThan(0);
      expect(r.transactions[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
