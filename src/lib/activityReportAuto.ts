import type { Transaction } from "./types";
import {
  categoryToReportUsage,
  inferMerchant,
  inferUsageType,
} from "./usageMerchantHeuristics";

export interface ActivityReportFeeRow {
  date: string;
  usage: string;
  merchant: string;
  deposit: number;
  withdrawal: number;
  balance?: number;
}

export interface ActivityReportActivityRow {
  meetingDate: string;
  meetingPlace: string;
  totalMembers: number;
  attendedMembers: number;
  activityCost: number;
  costDetail: string;
  note: string;
}

function cleanField(v: string | undefined): string {
  const s = (v ?? "").trim();
  if (!s || /^(nan|none|<na>|nat)$/i.test(s)) return "";
  return s;
}

function fmtMeetingDay(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  if (!m || !d) return dateStr;
  return `${Number(m)}.${Number(d)}`;
}

export function buildFeeRowsForMonth(txs: Transaction[]): ActivityReportFeeRow[] {
  const sorted = [...txs].sort((a, b) => {
    const c = a.date.localeCompare(b.date);
    if (c !== 0) return c;
    return (a.time ?? "").localeCompare(b.time ?? "");
  });
  return sorted.map((tx) => {
    let usage = cleanField(tx.category);
    if (usage && usage !== "확인필요") {
      usage = categoryToReportUsage(usage);
    } else {
      usage = "";
    }
    if (!usage) {
      usage = inferUsageType(tx.description, tx.category);
    }
    let merchant = cleanField(tx.merchant);
    if (!merchant) merchant = inferMerchant(tx.description);
    return {
      date: tx.date,
      usage: cleanField(usage),
      merchant: cleanField(merchant),
      deposit: tx.deposit,
      withdrawal: tx.withdrawal,
      balance: tx.balance,
    };
  });
}

function isActivityExpense(tx: Transaction): boolean {
  if (tx.withdrawal <= 0) return false;
  if (tx.supportStatus === "불인정" || tx.supportStatus === "계산제외") return false;
  if (tx.supportStatus !== "인정" && tx.supportStatus !== "확인필요") return false;
  const d = tx.description || "";
  if (["예금이자", "이자", "캐시백"].some((k) => d.includes(k))) return false;
  return true;
}

// 수동 묶음 후보: 출금이며 계산제외/이자/캐시백만 빼고 모두 포함(불인정·식대도 사용자가 직접 묶을 수 있게).
export function isGroupableExpense(tx: Transaction): boolean {
  if (tx.withdrawal <= 0) return false;
  if (tx.supportStatus === "계산제외") return false;
  const d = tx.description || "";
  if (["예금이자", "이자", "캐시백"].some((k) => d.includes(k))) return false;
  return true;
}

function inferPlace(descriptions: string[]): string {
  const blob = descriptions.join(" ");
  const b = blob.toLowerCase();
  if (["한강", "잠실", "bbq", "cu", "케이엠", "케이엠파크", "주차"].some((x) => b.includes(x))) {
    return "잠실 한강공원";
  }
  if (blob.includes("맵퍼스") || blob.includes("회의실")) {
    return "맵퍼스 회의실";
  }
  if (["가죽", "공예", "네이버페이"].some((x) => blob.includes(x))) {
    return "공방";
  }
  if (blob.includes("대관") || blob.includes("장소")) {
    return "대관 장소";
  }
  return "";
}

function inferCostTitle(descriptions: string[], usages: string[]): string {
  const blob = [...descriptions, ...usages].join(" ").toLowerCase();
  const hasLeather = blob.includes("가죽") || blob.includes("공예");
  const hasMeal = ["한강", "bbq", "cu", "주차", "피크닉"].some((x) => blob.includes(x));
  if (hasLeather && hasMeal) return "가죽 공예 및 식사";
  if (hasLeather) return "가죽 공예";
  if (hasMeal) return "한강 피크닉 및 식사";
  if (blob.includes("대관")) return "장소 대관";
  return "동호회 활동";
}

function usageLabelForDetail(tx: Transaction): string {
  const cat = cleanField(tx.category);
  if (cat && cat !== "확인필요") return categoryToReportUsage(cat);
  return inferUsageType(tx.description, tx.category) || "항목";
}

const ITEM_SUFFIX_RE = /\s*-\s*\d+\s*$/;

// 비고 항목 라벨에서 -1/-2 같은 꼬리 번호를 떼어 같은 종류끼리 합산되게 한다.
function detailLabel(s: string): string {
  return s.replace(ITEM_SUFFIX_RE, "").trim();
}

export function buildActivityRowsAuto(
  txs: Transaction[],
  defaultTotalMembers: number,
): ActivityReportActivityRow[] {
  const byDay = new Map<string, Transaction[]>();
  for (const tx of txs) {
    if (!isActivityExpense(tx)) continue;
    const list = byDay.get(tx.date) ?? [];
    list.push(tx);
    byDay.set(tx.date, list);
  }

  const rows: ActivityReportActivityRow[] = [];
  for (const d of [...byDay.keys()].sort()) {
    const group = byDay.get(d)!;
    rows.push(buildOneActivityRow(group, defaultTotalMembers, { meetingDate: d }));
  }
  return rows;
}

// 한 모임(거래 묶음)에 대한 활동내역 한 행을 만든다. 비고는 같은 라벨끼리 합산.
function buildOneActivityRow(
  group: Transaction[],
  defaultTotalMembers: number,
  override: {
    meetingDate?: string;
    meetingPlace?: string;
    costDetail?: string;
    attendedMembers?: number;
    totalMembers?: number;
  },
): ActivityReportActivityRow {
  const cost = group.reduce((s, tx) => s + tx.withdrawal, 0);
  const descs = group.map((tx) => cleanField(tx.description));
  const usages = group.map((tx) => usageLabelForDetail(tx));
  const agg = new Map<string, number>();
  for (const tx of group) {
    const lab = detailLabel(usageLabelForDetail(tx)) || "항목";
    agg.set(lab, (agg.get(lab) ?? 0) + tx.withdrawal);
  }
  const details = [...agg.entries()].map(
    ([lab, amt]) => `${lab} (${Math.round(amt).toLocaleString("ko-KR")}원)`,
  );
  const detailStr = details.join(" / ");
  const rawDate = override.meetingDate ?? group[0]?.date ?? "";
  return {
    meetingDate: override.meetingDate && override.meetingDate.includes("-")
      ? fmtMeetingDay(override.meetingDate)
      : override.meetingDate || fmtMeetingDay(rawDate),
    meetingPlace: override.meetingPlace ?? inferPlace(descs),
    totalMembers: override.totalMembers ?? defaultTotalMembers,
    attendedMembers: override.attendedMembers ?? 0,
    activityCost: cost,
    costDetail: override.costDetail ?? inferCostTitle(descs, usages),
    note: detailStr ? `상세 내역: ${detailStr}` : "",
  };
}

export interface MeetingGroupInput {
  txIds: string[];
  meetingDate?: string;
  meetingPlace?: string;
  costDetail?: string;
  attendedMembers?: number;
}

// 사용자가 직접 묶은 모임 그룹들로 활동내역 행을 만든다.
export function buildActivityRowsFromGroups(
  txs: Transaction[],
  groups: MeetingGroupInput[],
  defaultTotalMembers: number,
): ActivityReportActivityRow[] {
  const byId = new Map(txs.map((t) => [t.id, t]));
  const rows: ActivityReportActivityRow[] = [];
  for (const g of groups) {
    const groupTxs = g.txIds
      .map((id) => byId.get(id))
      .filter((t): t is Transaction => !!t);
    if (groupTxs.length === 0) continue;
    rows.push(
      buildOneActivityRow(groupTxs, defaultTotalMembers, {
        meetingDate: g.meetingDate,
        meetingPlace: g.meetingPlace,
        costDetail: g.costDetail,
        attendedMembers: g.attendedMembers,
      }),
    );
  }
  return rows;
}
