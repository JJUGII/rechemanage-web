import type { Transaction } from "../types";
import { classifyTransaction } from "../classifier";
import { makeFileKey } from "../transactionKey";
import {
  findColInRow,
  isRowEmpty,
  normCell,
  parseDateTimeCell,
  parseSignedAmount,
  parseUnsignedAmount,
} from "./excelGrid";

/** 카카오뱅크 거래내역서 헤더 (행 어디에 있든 열 인덱스만 찾으면 됨) */
const KAKAO_HEADER_SPECS = [
  { field: "date" as const, aliases: ["거래일시"] },
  { field: "type" as const, aliases: ["구분"] },
  { field: "amount" as const, aliases: ["거래금액"] },
  { field: "balance" as const, aliases: ["거래후잔액", "거래 후 잔액"] },
  { field: "txKind" as const, aliases: ["거래구분"] },
  { field: "content" as const, aliases: ["내용"] },
  { field: "memo" as const, aliases: ["메모"] },
];

export type KakaoColumnMap = {
  headerRowIndex: number;
  date: number;
  type: number;
  amount: number;
  balance: number;
  txKind: number;
  content: number;
  memo: number;
};

/** 전체 그리드에서 카카오뱅크 헤더 행 탐색 (A열 비어 있어도 됨) */
export function findKakaoBankHeaderRow(data: unknown[][]): KakaoColumnMap | null {
  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    if (!row || isRowEmpty(row)) continue;

    const cols: Partial<Record<keyof Omit<KakaoColumnMap, "headerRowIndex">, number>> = {};
    let ok = true;
    for (const spec of KAKAO_HEADER_SPECS) {
      const idx = findColInRow(row, spec.aliases);
      if (idx < 0) {
        ok = false;
        break;
      }
      cols[spec.field] = idx;
    }
    if (!ok) continue;

    const indices = [
      cols.date!,
      cols.type!,
      cols.amount!,
      cols.balance!,
      cols.txKind!,
      cols.content!,
      cols.memo!,
    ];
    if (new Set(indices).size !== indices.length) continue;

    return {
      headerRowIndex: r,
      date: cols.date!,
      type: cols.type!,
      amount: cols.amount!,
      balance: cols.balance!,
      txKind: cols.txKind!,
      content: cols.content!,
      memo: cols.memo!,
    };
  }
  return null;
}

function buildDescription(content: string, memo: string, txKind: string): string {
  const parts = [content, memo, txKind].map((s) => s.trim()).filter(Boolean);
  const primary = content.trim() || memo.trim() || txKind.trim();
  if (!primary) return "";
  if (parts.length <= 1) return primary;
  return parts.join(" / ");
}

function splitDepositWithdrawal(
  typeLabel: string,
  signedAmount: number,
): { deposit: number; withdrawal: number } {
  const kind = normCell(typeLabel);
  const abs = Math.abs(signedAmount);
  if (kind.includes("입금")) return { deposit: abs, withdrawal: 0 };
  if (kind.includes("출금")) return { deposit: 0, withdrawal: abs };
  if (signedAmount > 0) return { deposit: abs, withdrawal: 0 };
  if (signedAmount < 0) return { deposit: 0, withdrawal: abs };
  return { deposit: 0, withdrawal: 0 };
}

function rowToTransaction(
  parts: {
    date: string;
    time: string;
    desc: string;
    dep: number;
    wdr: number;
    bal: number;
  },
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

/** 카카오뱅크 거래내역 그리드 → Transaction[] */
export function parseKakaoBankGrid(data: unknown[][], file: File): Transaction[] {
  const map = findKakaoBankHeaderRow(data);
  if (!map) return [];

  console.debug("[reche] kakao header row", map.headerRowIndex + 1, map);

  const out: Transaction[] = [];
  for (let r = map.headerRowIndex + 1; r < data.length; r++) {
    const row = data[r] as unknown[] | undefined;
    if (!row || isRowEmpty(row)) continue;

    const rawDate = row[map.date];
    const parsed = parseDateTimeCell(rawDate);
    if (!parsed) continue;

    const content = String(row[map.content] ?? "").trim();
    const memo = String(row[map.memo] ?? "").trim();
    const txKind = String(row[map.txKind] ?? "").trim();
    const desc = buildDescription(content, memo, txKind);
    if (!desc) continue;

    const signed = parseSignedAmount(row[map.amount]);
    const { deposit, withdrawal } = splitDepositWithdrawal(String(row[map.type] ?? ""), signed);

    if (!deposit && !withdrawal) continue;

    const bal = parseUnsignedAmount(row[map.balance]);

    out.push(
      rowToTransaction(
        {
          date: parsed.date,
          time: parsed.time,
          desc,
          dep: deposit,
          wdr: withdrawal,
          bal,
        },
        file,
      ),
    );
  }

  console.debug("[reche] kakao parsed rows", out.length);
  return out;
}
