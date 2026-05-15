import type { Transaction } from "./types";
import { ACTIVITY_REPORT_OUTER } from "@/templates/activityReportTemplate";
import {
  buildActivityRowsAuto,
  buildFeeRowsForMonth,
  type ActivityReportActivityRow,
} from "./activityReportAuto";

const MIN_FEE_DATA_ROWS = 11;
const BORDER =
  "BORDER-TOP: rgb(0,0,0) 1px solid; BORDER-RIGHT: rgb(0,0,0) 1px solid; BORDER-BOTTOM: rgb(0,0,0) 1px solid; BORDER-LEFT: rgb(0,0,0) 1px solid; border-image: none";
const P_BASE = ' style="margin:0;line-height:1.2"';

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeStr(value: unknown): string {
  if (value == null) return "";
  const s = String(value).trim();
  if (!s || /^(nan|none|<na>|nat)$/i.test(s)) return "";
  return s;
}

export function formatReportMoney(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "0";
  return Math.round(value).toLocaleString("ko-KR");
}

function formatDateShort(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  if (!m || !d) return safeStr(dateStr);
  return `${Number(m)}.${Number(d)}`;
}

function makeP(content: string, align: "center" | "right" | "left" = "center"): string {
  return `<p align="${align}"${P_BASE}>${content}</p>`;
}

function makeTd(
  content: string,
  width: number,
  height: number | string,
  align: "center" | "right" | "left" = "center",
  extraStyle = "",
  colspan?: number,
  rowspan?: number,
): string {
  let sty = BORDER;
  if (extraStyle.trim()) sty += ` ${extraStyle.trim()}`;
  let attrs = ` height="${height}" width="${width}" free=""`;
  if (colspan != null) attrs += ` colspan="${colspan}"`;
  if (rowspan != null) attrs += ` rowspan="${rowspan}"`;
  let inner = content;
  if (!inner.trim().toLowerCase().startsWith("<p")) {
    const pa = align === "right" ? "right" : "center";
    inner = makeP(esc(inner), pa);
  }
  return `<td style="${sty}"${attrs}>${inner}</td>`;
}

const FEE_MONEY_EXTRA = "WIDTH: 102px";

function feeRowHeader(): string {
  return (
    "<tr>" +
    makeTd(makeP("날짜"), 103, 26) +
    makeTd(makeP("사용내역"), 103, 26) +
    makeTd(makeP("거래처"), 103, 26) +
    makeTd(makeP("입금액"), 102, 26, "center", FEE_MONEY_EXTRA) +
    makeTd(makeP("지출액"), 102, 26, "center", FEE_MONEY_EXTRA) +
    makeTd(makeP("잔액"), 103, 26) +
    "</tr>"
  );
}

function feeRowData(
  dateDisp: string,
  usage: string,
  merchant: string,
  depositS: string,
  withdrawalS: string,
  balanceS: string,
): string {
  return (
    "<tr>" +
    makeTd(makeP(esc(dateDisp)), 103, 26) +
    makeTd(makeP(esc(usage)), 103, 26) +
    makeTd(makeP(esc(merchant)), 103, 26) +
    makeTd(makeP(depositS, "right"), 102, 26, "right", FEE_MONEY_EXTRA) +
    makeTd(makeP(withdrawalS, "right"), 102, 26, "right", FEE_MONEY_EXTRA) +
    makeTd(makeP(balanceS, "right"), 103, 26, "right") +
    "</tr>"
  );
}

function feeEmptyDataRow(): string {
  const cell = `<p align="center"${P_BASE}>&nbsp;</p>`;
  return (
    "<tr>" +
    makeTd(cell, 103, 26) +
    makeTd(cell, 103, 26) +
    makeTd(cell, 103, 26) +
    makeTd(cell, 102, 26, "right", FEE_MONEY_EXTRA) +
    makeTd(cell, 102, 26, "right", FEE_MONEY_EXTRA) +
    makeTd(cell, 103, 26, "right") +
    "</tr>"
  );
}

function buildFeeTableRowsHtml(feeRows: ReturnType<typeof buildFeeRowsForMonth>): string {
  const parts: string[] = [feeRowHeader()];
  for (const fr of feeRows) {
    parts.push(
      feeRowData(
        formatDateShort(fr.date),
        fr.usage,
        fr.merchant,
        formatReportMoney(fr.deposit),
        formatReportMoney(fr.withdrawal),
        formatReportMoney(fr.balance),
      ),
    );
  }
  let dataCount = feeRows.length;
  while (dataCount < MIN_FEE_DATA_ROWS) {
    parts.push(feeEmptyDataRow());
    dataCount += 1;
  }
  return parts.join("");
}

function activityTableHtml(ar: ActivityReportActivityRow): string {
  const attendLine =
    ar.attendedMembers > 0
      ? `총 인원 ${ar.totalMembers} 명중&nbsp;참석 ${ar.attendedMembers} 명`
      : `총 인원 ${ar.totalMembers} 명중&nbsp;참석&nbsp; 명`;
  const costDisp = `${formatReportMoney(ar.activityCost)}원`;

  const row1 =
    "<tr>" +
    makeTd(makeP("모임일시"), 104, 30) +
    makeTd(makeP(esc(ar.meetingDate)), 208, 30) +
    makeTd(makeP("모임장소"), 104, 30) +
    makeTd(makeP(esc(ar.meetingPlace)), 208, 30) +
    "</tr>";
  const row2 =
    "<tr>" +
    makeTd(makeP("참석자정보"), 104, 60, "center", "", undefined, 2) +
    makeTd(`<p align="center"${P_BASE}>${attendLine}</p>`, 208, 60, "center", "", undefined, 2) +
    makeTd(makeP("활동비용"), 104, 30) +
    makeTd(makeP(esc(costDisp)), 208, 30) +
    "</tr>";
  const row3 =
    "<tr>" +
    makeTd(makeP("비용내역"), 104, 30) +
    makeTd(makeP(esc(ar.costDetail)), 208, 30) +
    "</tr>";
  const row4 =
    "<tr>" +
    makeTd(makeP("비고"), 104, 30) +
    makeTd(makeP(esc(ar.note), "left"), 526, 30, "left", "WIDTH: 526px", 3) +
    "</tr>";

  return (
    '<table style="FONT-SIZE: 10pt; HEIGHT: 120px; FONT-FAMILY: 맑은 고딕; WIDTH: 637px; ' +
    'BORDER-COLLAPSE: collapse; MARGIN-LEFT: 0px" cellspacing="0" cellpadding="1" kaoni="1" ver="1.0">' +
    `<tbody>${row1}${row2}${row3}${row4}</tbody></table>`
  );
}

function blankActivityTable(memberCount: number): string {
  return activityTableHtml({
    meetingDate: "",
    meetingPlace: "",
    totalMembers: memberCount,
    attendedMembers: 0,
    activityCost: 0,
    costDetail: "",
    note: "",
  });
}

function buildActivityTablesHtml(rows: ActivityReportActivityRow[], memberCount: number): string {
  const blocks = rows.map((ar) => activityTableHtml(ar));
  blocks.push(blankActivityTable(memberCount));
  return blocks.join("<p></p>\n<p></p>\n");
}

export function buildActivityReportHtml(
  month: string,
  transactions: Transaction[],
  memberCount = 20,
): string {
  const txs = transactions.filter((t) => t.month === month);
  const feeRows = buildFeeRowsForMonth(txs);
  const activityRows = buildActivityRowsAuto(txs, memberCount);
  const feeTr = buildFeeTableRowsHtml(feeRows);
  const actHtml = buildActivityTablesHtml(activityRows, memberCount);
  const body = ACTIVITY_REPORT_OUTER.replace("{{FEE_TABLE_ROWS}}", feeTr).replace(
    "{{ACTIVITY_TABLES}}",
    actHtml,
  );
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>활동보고서 ${esc(month)}</title></head><body style="margin:0">${body}</body></html>`;
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .trim();
}

export type ClipboardCopyResult = "html" | "text_plain" | "failed";

export async function copyHtmlToClipboard(html: string, plain: string): Promise<ClipboardCopyResult> {
  if (typeof navigator === "undefined") return "failed";

  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
      return "html";
    } catch {
      /* fall through */
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(html);
      return "text_plain";
    } catch {
      return "failed";
    }
  }

  return "failed";
}

export function downloadHtml(filename: string, html: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
