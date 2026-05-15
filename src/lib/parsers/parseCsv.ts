import * as XLSX from "xlsx";
import type { Transaction } from "../types";
import { parseExcelBuffer } from "./parseExcel";

function decodeCsvBytes(buf: ArrayBuffer): string {
  const u8 = new Uint8Array(buf);
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(u8);
  if (!utf8.includes("\uFFFD")) return utf8;
  try {
    return new TextDecoder("euc-kr").decode(u8);
  } catch {
    return utf8;
  }
}

/** CSV → SheetJS 문자열 읽기 후 xlsx로 워크북화해 엑셀과 동일 파이프 */
export async function parseCsvFile(file: File): Promise<{
  transactions: Transaction[];
  error?: string;
}> {
  try {
    const buf = await file.arrayBuffer();
    const text = decodeCsvBytes(buf);
    const wb = XLSX.read(text, { type: "string" });
    const ab = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
    return parseExcelBuffer(ab, file);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { transactions: [], error: msg || "CSV 파싱 실패" };
  }
}
