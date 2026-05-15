import * as XLSX from "xlsx";
import type { Transaction } from "../types";
import { classifyTransaction } from "../classifier";
import { makeFileKey } from "../transactionKey";
import {
  findColInRow,
  isRowEmpty,
  parseDateTimeCell,
  parseUnsignedAmount,
} from "./excelGrid";
import { findKakaoBankHeaderRow, parseKakaoBankGrid } from "./kakaoBankExcel";
import {
  EMPTY_PARSE_MESSAGE,
  NEEDS_PASSWORD_MESSAGE,
  type ParseExcelFailure,
  type ParseExcelResult,
} from "./parseExcelTypes";

export type { ParseExcelResult, ParseExcelSuccess, ParseExcelFailure } from "./parseExcelTypes";
export { EMPTY_PARSE_MESSAGE, NEEDS_PASSWORD_MESSAGE, isParseExcelSuccess } from "./parseExcelTypes";

const DATE_ALIASES = ["거래일시", "거래일", "일자", "날짜", "거래일자", "일시", "datetime", "date"];
const DESC_ALIASES = ["내용", "거래내용", "적요", "거래처", "메모", "거래메모"];
const DEP_ALIASES = ["입금", "입금액", "입금금액", "입금액(원)", "입금금액(원)"];
const WDR_ALIASES = ["출금", "출금액", "사용금액", "출금금액", "출금액(원)", "출금금액(원)"];
const BAL_ALIASES = ["잔액", "거래후잔액", "거래후 잔액", "거래 후 잔액"];

function pickWorksheet(wb: XLSX.WorkBook): XLSX.WorkSheet | null {
  if (!wb.SheetNames.length) return null;
  const name =
    wb.SheetNames.find((n) => {
      const x = n.replace(/\s+/g, "");
      return x.includes("카카오") || x.includes("거래내역");
    }) ?? wb.SheetNames[0];
  return wb.Sheets[name] ?? null;
}

function sheetToGrid(ws: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
    raw: true,
  }) as unknown[][];
}

function fail(partial: Omit<ParseExcelFailure, "ok" | "transactions"> & { error: string }): ParseExcelFailure {
  return { ok: false, transactions: [], ...partial };
}

function rowToTransaction(
  parts: { date: string; time: string; desc: string; dep: number; wdr: number; bal: number },
  file: File,
): Transaction {
  const month = parts.date.slice(0, 7);
  const c = classifyTransaction(parts.desc, undefined, parts.dep, parts.wdr);
  return {
    id:
      typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `tx-${Math.random().toString(36).slice(2)}`,
    date: parts.date,
    time: parts.time || undefined,
    description: parts.desc,
    deposit: parts.dep,
    withdrawal: parts.wdr,
    balance: parts.bal || undefined,
    month,
    category: c.category,
    supportStatus: c.supportStatus,
    reason: c.reason,
    sourceFileName: file.name,
    sourceFileKey: makeFileKey(file),
    receiptAttached: false,
  };
}

/** 1행 헤더 형식 (기존 카카오 CSV형 export 등) */
function parseLegacyFirstRowHeader(data: unknown[][], file: File): Transaction[] {
  if (!data.length) return [];
  const headers = (data[0] as unknown[]).map((c) => String(c ?? "").trim());
  const iDate = findColInRow(data[0] as unknown[], DATE_ALIASES);
  const iDesc = findColInRow(data[0] as unknown[], DESC_ALIASES);
  const iDep = findColInRow(data[0] as unknown[], DEP_ALIASES);
  const iWdr = findColInRow(data[0] as unknown[], WDR_ALIASES);
  const iBal = findColInRow(data[0] as unknown[], BAL_ALIASES);

  if (iDate < 0 || iDesc < 0) return [];

  const out: Transaction[] = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r] as unknown[];
    if (!row || isRowEmpty(row)) continue;
    const parsed = parseDateTimeCell(row[iDate]);
    if (!parsed) continue;
    const desc = String(row[iDesc] ?? "").trim();
    if (!desc) continue;
    const dep = iDep >= 0 ? parseUnsignedAmount(row[iDep]) : 0;
    const wdr = iWdr >= 0 ? parseUnsignedAmount(row[iWdr]) : 0;
    const bal = iBal >= 0 ? parseUnsignedAmount(row[iBal]) : 0;
    if (!dep && !wdr) continue;
    out.push(rowToTransaction({ date: parsed.date, time: parsed.time, desc, dep, wdr, bal }, file));
  }
  void headers;
  return out;
}

export function parseExcelBuffer(ab: ArrayBuffer, file: File): ParseExcelResult {
  try {
    const wb = XLSX.read(ab, { type: "array", cellDates: true });
    const ws = pickWorksheet(wb);
    if (!ws) {
      return fail({ error: "시트가 없습니다." });
    }

    const data = sheetToGrid(ws);
    if (!data.length) return { ok: true, transactions: [] };

    let transactions: Transaction[] = [];

    if (findKakaoBankHeaderRow(data)) {
      transactions = parseKakaoBankGrid(data, file);
    } else {
      transactions = parseLegacyFirstRowHeader(data, file);
    }

    if (!transactions.length && findKakaoBankHeaderRow(data)) {
      return fail({
        error:
          "카카오뱅크 거래내역 헤더는 찾았으나 유효한 거래 행이 없습니다. 거래일시·거래금액·내용을 확인해주세요.",
      });
    }

    if (!transactions.length) {
      return fail({
        error: "필수 열(날짜·적요)을 찾지 못했습니다. 카카오뱅크 거래내역 형식인지 확인해주세요.",
      });
    }

    console.debug("[reche] parseExcelBuffer", { fileName: file.name, count: transactions.length });
    return { ok: true, transactions };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const encrypted =
      /password|encrypt|protected|암호/i.test(msg) || /File is password-protected/i.test(msg);
    if (encrypted) {
      console.debug("[reche] encrypted detected (parseExcelBuffer)", file.name);
      return fail({
        encrypted: true,
        needsPassword: true,
        error: NEEDS_PASSWORD_MESSAGE,
      });
    }
    return fail({ error: msg || "엑셀 파싱 실패" });
  }
}

export async function parseExcelFile(
  arrayBuffer: ArrayBuffer,
  file: File,
  password?: string,
): Promise<ParseExcelResult> {
  const { decryptExcelBuffer, isEncryptedExcelBuffer } = await import("./excelCrypto");

  const encrypted = await isEncryptedExcelBuffer(arrayBuffer);
  if (encrypted) {
    console.debug("[reche] encrypted detected", file.name);
  }

  let data = arrayBuffer;

  if (encrypted) {
    if (!password) {
      return fail({
        encrypted: true,
        needsPassword: true,
        error: NEEDS_PASSWORD_MESSAGE,
      });
    }
    console.debug("[reche] password retry start", file.name);
    const dec = await decryptExcelBuffer(arrayBuffer, password);
    if (!dec.ok) {
      if (dec.kind === "wrongPassword") {
        return fail({
          encrypted: true,
          needsPassword: true,
          wrongPassword: true,
          error: dec.message,
        });
      }
      if (dec.kind === "unsupported") {
        return fail({
          encrypted: true,
          unsupportedEncryption: true,
          error: dec.message,
        });
      }
      return fail({ error: dec.message });
    }
    console.debug("[reche] decrypted buffer byteLength", dec.buffer.byteLength);
    data = dec.buffer;
  }

  const parsed = parseExcelBuffer(data, file);
  if (parsed.ok) {
    console.debug("[reche] parsed transactions count", parsed.transactions.length);
  }
  return parsed;
}
