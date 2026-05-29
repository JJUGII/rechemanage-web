"use client";

import { useEffect, useMemo, useState } from "react";
import type { Transaction } from "@/lib/types";
import { isGroupableExpense, type MeetingGroupInput } from "@/lib/activityReportAuto";

interface MeetingGroupingProps {
  open: boolean;
  month: string;
  transactions: Transaction[];
  memberCount: number;
  onClose: () => void;
  onGenerate: (groups: MeetingGroupInput[]) => void;
}

interface MeetingMeta {
  meetingDate: string;
  meetingPlace: string;
  costDetail: string;
  attendedMembers: string;
}

const EXCLUDE = 0;

function emptyMeta(): MeetingMeta {
  return { meetingDate: "", meetingPlace: "", costDetail: "", attendedMembers: "" };
}

function fmtMoney(n: number): string {
  return Math.round(n).toLocaleString("ko-KR");
}

export function MeetingGrouping({
  open,
  month,
  transactions,
  memberCount,
  onClose,
  onGenerate,
}: MeetingGroupingProps) {
  const candidates = useMemo(
    () =>
      transactions
        .filter((t) => t.month === month && isGroupableExpense(t))
        .sort((a, b) => {
          const c = a.date.localeCompare(b.date);
          if (c !== 0) return c;
          return (a.time ?? "").localeCompare(b.time ?? "");
        }),
    [transactions, month],
  );

  const [assignment, setAssignment] = useState<Record<string, number>>({});
  const [meetingCount, setMeetingCount] = useState(1);
  const [meta, setMeta] = useState<Record<number, MeetingMeta>>({});

  // 모달이 열리거나 후보가 바뀌면 날짜별로 자동 묶음 초기화.
  useEffect(() => {
    if (!open) return;
    const dayToMeeting = new Map<string, number>();
    const nextAssign: Record<string, number> = {};
    let n = 0;
    for (const tx of candidates) {
      let m = dayToMeeting.get(tx.date);
      if (m == null) {
        n += 1;
        m = n;
        dayToMeeting.set(tx.date, m);
      }
      nextAssign[tx.id] = m;
    }
    setAssignment(nextAssign);
    setMeetingCount(Math.max(1, n));
    const nextMeta: Record<number, MeetingMeta> = {};
    for (let i = 1; i <= Math.max(1, n); i += 1) nextMeta[i] = emptyMeta();
    setMeta(nextMeta);
  }, [open, candidates]);

  const meetingNumbers = useMemo(
    () => Array.from({ length: meetingCount }, (_, i) => i + 1),
    [meetingCount],
  );

  const meetingTotals = useMemo(() => {
    const totals = new Map<number, number>();
    for (const tx of candidates) {
      const m = assignment[tx.id] ?? EXCLUDE;
      if (m === EXCLUDE) continue;
      totals.set(m, (totals.get(m) ?? 0) + tx.withdrawal);
    }
    return totals;
  }, [candidates, assignment]);

  const setAssign = (id: string, m: number) =>
    setAssignment((p) => ({ ...p, [id]: m }));

  const setMetaField = (m: number, field: keyof MeetingMeta, value: string) =>
    setMeta((p) => ({ ...p, [m]: { ...(p[m] ?? emptyMeta()), [field]: value } }));

  const addMeeting = () => {
    const next = meetingCount + 1;
    setMeetingCount(next);
    setMeta((p) => ({ ...p, [next]: emptyMeta() }));
  };

  const handleGenerate = () => {
    const groups: MeetingGroupInput[] = [];
    for (const m of meetingNumbers) {
      const txIds = candidates.filter((t) => (assignment[t.id] ?? EXCLUDE) === m).map((t) => t.id);
      if (txIds.length === 0) continue;
      const md = meta[m] ?? emptyMeta();
      const attended = md.attendedMembers.trim() ? Number(md.attendedMembers) : undefined;
      groups.push({
        txIds,
        meetingDate: md.meetingDate.trim() || undefined,
        meetingPlace: md.meetingPlace.trim() || undefined,
        costDetail: md.costDetail.trim() || undefined,
        attendedMembers: attended != null && !Number.isNaN(attended) ? attended : undefined,
      });
    }
    onGenerate(groups);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b px-3 py-2">
          <div>
            <h3 className="font-semibold">모임 묶기 — {month}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              각 거래를 모임 번호로 지정하세요. 같은 모임의 같은 항목은 비고에서 합산됩니다.
            </p>
          </div>
          <button
            type="button"
            className="text-slate-500 hover:text-slate-800 px-2"
            onClick={onClose}
            aria-label="닫기"
          >
            닫기
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {candidates.length === 0 ? (
            <p className="text-sm text-slate-500">묶을 수 있는 지출 거래가 없습니다.</p>
          ) : (
            <>
              <div className="border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-2 py-1 text-left font-medium">날짜</th>
                      <th className="px-2 py-1 text-left font-medium">내역</th>
                      <th className="px-2 py-1 text-right font-medium">지출액</th>
                      <th className="px-2 py-1 text-left font-medium">모임</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((tx) => (
                      <tr key={tx.id} className="border-t">
                        <td className="px-2 py-1 whitespace-nowrap">{tx.date.slice(5)}</td>
                        <td className="px-2 py-1">{tx.description || "-"}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{fmtMoney(tx.withdrawal)}</td>
                        <td className="px-2 py-1">
                          <select
                            className="border rounded px-1 py-0.5 text-sm"
                            value={assignment[tx.id] ?? EXCLUDE}
                            onChange={(e) => setAssign(tx.id, Number(e.target.value))}
                          >
                            <option value={EXCLUDE}>제외</option>
                            {meetingNumbers.map((m) => (
                              <option key={m} value={m}>
                                모임 {m}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                className="text-sm px-3 py-1 rounded bg-slate-200 hover:bg-slate-300"
                onClick={addMeeting}
              >
                + 모임 추가
              </button>

              <div className="space-y-3">
                {meetingNumbers.map((m) => (
                  <div key={m} className="border rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm">모임 {m}</h4>
                      <span className="text-xs text-slate-500">
                        합계 {fmtMoney(meetingTotals.get(m) ?? 0)}원
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <label className="flex flex-col gap-0.5">
                        <span className="text-xs text-slate-500">모임일시 (비우면 자동)</span>
                        <input
                          className="border rounded px-2 py-1"
                          value={meta[m]?.meetingDate ?? ""}
                          placeholder="예: 5.6"
                          onChange={(e) => setMetaField(m, "meetingDate", e.target.value)}
                        />
                      </label>
                      <label className="flex flex-col gap-0.5">
                        <span className="text-xs text-slate-500">모임장소 (비우면 자동)</span>
                        <input
                          className="border rounded px-2 py-1"
                          value={meta[m]?.meetingPlace ?? ""}
                          placeholder="예: 잠실 한강공원"
                          onChange={(e) => setMetaField(m, "meetingPlace", e.target.value)}
                        />
                      </label>
                      <label className="flex flex-col gap-0.5">
                        <span className="text-xs text-slate-500">비용내역 (비우면 자동)</span>
                        <input
                          className="border rounded px-2 py-1"
                          value={meta[m]?.costDetail ?? ""}
                          placeholder="예: 한강 피크닉 및 식사"
                          onChange={(e) => setMetaField(m, "costDetail", e.target.value)}
                        />
                      </label>
                      <label className="flex flex-col gap-0.5">
                        <span className="text-xs text-slate-500">참석인원 (총 {memberCount}명)</span>
                        <input
                          className="border rounded px-2 py-1"
                          type="number"
                          min={0}
                          value={meta[m]?.attendedMembers ?? ""}
                          placeholder="미입력"
                          onChange={(e) => setMetaField(m, "attendedMembers", e.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t px-3 py-2">
          <button
            type="button"
            className="text-sm px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="text-sm px-3 py-1.5 rounded bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-40"
            disabled={candidates.length === 0}
            onClick={handleGenerate}
          >
            보고서 생성
          </button>
        </div>
      </div>
    </div>
  );
}
