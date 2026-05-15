"use client";

import { memo, useCallback, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Transaction } from "@/lib/types";
import type { SupportStatus } from "@/lib/types";
import { formatNumber, parseFormattedInt } from "@/lib/formatters";
import { getSupportStatusBadgeClass } from "@/lib/statusStyles";
import type { SortColumn, SortDirection } from "@/lib/sortTransactions";

const STATUS_OPTIONS: SupportStatus[] = ["인정", "불인정", "확인필요", "계산제외"];

const ROW_H = 46;
const GRID =
  "grid grid-cols-[36px_88px_minmax(120px,1.5fr)_76px_76px_72px_72px_84px_minmax(72px,1fr)_minmax(56px,0.9fr)] gap-0 items-center";

function SortIcon({ active, dir }: { active: boolean; dir: SortDirection }) {
  if (!active) return <ArrowUpDown className="inline h-3.5 w-3.5 text-slate-400" aria-hidden />;
  return dir === "asc" ? (
    <ArrowUp className="inline h-3.5 w-3.5 text-slate-700" aria-hidden />
  ) : (
    <ArrowDown className="inline h-3.5 w-3.5 text-slate-700" aria-hidden />
  );
}

interface TransactionTableProps {
  rows: Transaction[];
  selectedIds: Set<string>;
  onSelectionChange: (s: Set<string>) => void;
  onToggleRow: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Transaction>) => void;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  onSortColumn: (col: SortColumn) => void;
  disabled?: boolean;
}

interface RowProps {
  t: Transaction;
  selected: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Transaction>) => void;
}

const TransactionRow = memo(function TransactionRow({ t, selected, disabled, onToggle, onUpdate }: RowProps) {
  const depStr = t.deposit === 0 ? "" : formatNumber(t.deposit);
  const wStr = t.withdrawal === 0 ? "" : formatNumber(t.withdrawal);
  const balStr = t.balance == null ? "" : formatNumber(t.balance);

  return (
    <div className={`${GRID} border-b border-slate-100 text-[11px] hover:bg-slate-50/90 min-h-[46px]`}>
      <div className="flex justify-center py-1">
        <input
          type="checkbox"
          className="accent-slate-700"
          checked={selected}
          disabled={disabled}
          onChange={() => onToggle(t.id)}
          aria-label={`거래 선택 ${t.date}`}
        />
      </div>
      <div className="px-0.5 py-1 whitespace-nowrap text-slate-800">{t.date}</div>
      <div className="px-0.5 py-0.5 min-w-0">
        <input
          className="w-full min-w-0 border border-transparent hover:border-slate-200 focus:border-slate-400 rounded px-1 py-0.5 bg-white/80"
          value={t.description}
          disabled={disabled}
          onChange={(e) => onUpdate(t.id, { description: e.target.value })}
          aria-label="적요"
        />
      </div>
      <div className="px-0.5 py-0.5 text-right">
        <input
          type="text"
          inputMode="numeric"
          className="w-full text-right border border-transparent hover:border-slate-200 focus:border-slate-400 rounded px-1 py-0.5"
          value={depStr}
          disabled={disabled}
          onChange={(e) => onUpdate(t.id, { deposit: parseFormattedInt(e.target.value) })}
          aria-label="입금"
        />
      </div>
      <div className="px-0.5 py-0.5 text-right">
        <input
          type="text"
          inputMode="numeric"
          className="w-full text-right border border-transparent hover:border-slate-200 focus:border-slate-400 rounded px-1 py-0.5"
          value={wStr}
          disabled={disabled}
          onChange={(e) => onUpdate(t.id, { withdrawal: parseFormattedInt(e.target.value) })}
          aria-label="출금"
        />
      </div>
      <div className="px-0.5 py-0.5 text-right text-slate-800 truncate" title={balStr}>
        <input
          type="text"
          inputMode="numeric"
          className="w-full text-right border border-transparent hover:border-slate-200 focus:border-slate-400 rounded px-1 py-0.5"
          value={balStr}
          disabled={disabled}
          onChange={(e) =>
            onUpdate(t.id, {
              balance: e.target.value.trim() === "" ? undefined : parseFormattedInt(e.target.value),
            })
          }
          aria-label="잔액"
        />
      </div>
      <div className="px-0.5 py-1 truncate text-slate-700" title={t.category}>
        {t.category}
      </div>
      <div className="px-0.5 py-0.5">
        <select
          className={`w-full max-w-[96px] ${getSupportStatusBadgeClass(t.supportStatus)}`}
          value={t.supportStatus}
          disabled={disabled}
          onChange={(e) => onUpdate(t.id, { supportStatus: e.target.value as SupportStatus })}
          aria-label="인정여부"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="px-0.5 py-0.5 min-w-0">
        <input
          className="w-full min-w-0 border border-transparent hover:border-slate-200 focus:border-slate-400 rounded px-1 py-0.5 text-[11px]"
          value={t.reason}
          disabled={disabled}
          onChange={(e) => onUpdate(t.id, { reason: e.target.value })}
          aria-label="사유"
        />
      </div>
      <div className="px-0.5 py-1 truncate text-slate-600 max-w-[120px]" title={t.sourceFileName}>
        {t.sourceFileName}
      </div>
    </div>
  );
});

function HeaderCell({
  label,
  col,
  sortColumn,
  sortDirection,
  onSort,
  className = "",
}: {
  label: string;
  col: SortColumn;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  onSort: (c: SortColumn) => void;
  className?: string;
}) {
  const active = sortColumn === col;
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-0.5 font-medium text-slate-700 hover:bg-slate-200/80 w-full py-1.5 px-0.5 border-0 bg-transparent cursor-pointer select-none ${className}`}
      onClick={() => onSort(col)}
      aria-label={`${label} 정렬${active ? (sortDirection === "asc" ? " 오름차순" : " 내림차순") : ""}`}
    >
      <span>{label}</span>
      <SortIcon active={active} dir={sortDirection} />
    </button>
  );
}

export function TransactionTable({
  rows,
  selectedIds,
  onSelectionChange,
  onToggleRow,
  onUpdate,
  sortColumn,
  sortDirection,
  onSortColumn,
  disabled = false,
}: TransactionTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === rows.length) onSelectionChange(new Set());
    else onSelectionChange(new Set(rows.map((r) => r.id)));
  }, [onSelectionChange, rows, selectedIds.size]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 12,
    getItemKey: (index) => rows[index]?.id ?? index,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const headerMemo = useMemo(
    () => (
      <div
        className={`${GRID} bg-slate-100 border-b border-slate-200 text-[11px] sticky top-0 z-20 shadow-sm shrink-0 min-w-[920px]`}
      >
        <div className="flex justify-center py-1">
          <input
            type="checkbox"
            className="accent-slate-700"
            checked={rows.length > 0 && selectedIds.size === rows.length}
            disabled={disabled || rows.length === 0}
            onChange={toggleAll}
            aria-label="전체 거래 선택"
          />
        </div>
        <HeaderCell label="날짜" col="date" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSortColumn} />
        <HeaderCell
          label="적요"
          col="description"
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSortColumn}
          className="justify-start px-1"
        />
        <HeaderCell label="입금" col="deposit" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSortColumn} />
        <HeaderCell
          label="출금"
          col="withdrawal"
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSortColumn}
        />
        <HeaderCell label="잔액" col="balance" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSortColumn} />
        <HeaderCell
          label="분류"
          col="category"
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSortColumn}
        />
        <HeaderCell
          label="인정여부"
          col="supportStatus"
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSortColumn}
        />
        <div className="text-center font-medium text-slate-600 py-1.5">사유</div>
        <div className="text-center font-medium text-slate-600 py-1.5">파일</div>
      </div>
    ),
    [disabled, onSortColumn, rows.length, selectedIds.size, sortColumn, sortDirection, toggleAll],
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 flex flex-col min-h-[200px] max-h-[min(72vh,calc(100vh-200px))] overflow-hidden">
      <div ref={parentRef} className="overflow-auto flex-1 min-w-0">
        <div className="min-w-[920px] flex flex-col">
          {headerMemo}
          {rows.length === 0 ? (
            <div className="py-12 px-4 text-center text-sm text-slate-500 border-t border-slate-100">
              <p className="font-medium text-slate-600">표시할 거래가 없습니다.</p>
              <p className="mt-1 text-xs text-slate-400">파일을 업로드하거나 월·상태 필터를 조정해 보세요.</p>
            </div>
          ) : (
            <div style={{ height: totalSize, position: "relative" }}>
              {virtualItems.map((vi) => {
                const t = rows[vi.index];
                if (!t) return null;
                return (
                  <div
                    key={t.id}
                    className="absolute left-0 top-0 w-full bg-white"
                    style={{ transform: `translateY(${vi.start}px)` }}
                  >
                    <TransactionRow
                      t={t}
                      selected={selectedIds.has(t.id)}
                      disabled={disabled}
                      onToggle={onToggleRow}
                      onUpdate={onUpdate}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
