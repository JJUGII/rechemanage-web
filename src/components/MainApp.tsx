"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { LoadedFile, StatusFilter, Transaction } from "@/lib/types";
import type { PersistedWebSettings } from "@/lib/storage";
import { classifyTransaction } from "@/lib/classifier";
import { makeFileKey, makeTransactionKey } from "@/lib/transactionKey";
import { parseExcelFile, EMPTY_PARSE_MESSAGE } from "@/lib/parsers/parseExcel";
import { isParseExcelSuccess } from "@/lib/parsers/parseExcelTypes";
import { WRONG_PASSWORD_MESSAGE } from "@/lib/parsers/excelCrypto";
import { applyFileMerge } from "@/lib/applyFileMerge";
import { parseCsvFile } from "@/lib/parsers/parseCsv";
import { computeMonthlySummary, allMonthsFromTransactions } from "@/lib/calculator";
import {
  loadExcludedFileKeys,
  loadExcludedTransactionKeys,
  loadMemberCount,
  loadLastSelectedMonth,
  saveExcludedFileKeys,
  saveExcludedTransactionKeys,
  saveMemberCount,
  saveLastSelectedMonth,
  clearUserExclusions as storageClearUserExclusions,
} from "@/lib/storage";
import { buildActivityReportHtml, copyHtmlToClipboard, downloadHtml, htmlToPlainText } from "@/lib/reportHtml";
import { sortTransactionRows } from "@/lib/sortTransactions";
import type { SortColumn, SortDirection } from "@/lib/sortTransactions";
import { FileUploader } from "./FileUploader";
import { MonthSelector } from "./MonthSelector";
import { TransactionTable } from "./TransactionTable";
import { SummaryPanel } from "./SummaryPanel";
import { ReportPreview } from "./ReportPreview";
import { SettingsMenu } from "./SettingsMenu";
import { EncryptedExcelPrompt } from "./EncryptedExcelPrompt";

type PendingEncryptedFile = {
  fileKey: string;
  fileName: string;
  file: File;
  arrayBuffer: ArrayBuffer;
  error?: string;
};

function tick(): Promise<void> {
  return new Promise((r) => {
    requestAnimationFrame(() => r());
  });
}

function fileStatusBadgeClass(status: LoadedFile["status"]): string {
  switch (status) {
    case "반영성공":
      return "bg-emerald-100 text-emerald-900 border border-emerald-200";
    case "일부반영":
      return "bg-amber-100 text-amber-900 border border-amber-200";
    case "중복건너뜀":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "실패":
      return "bg-rose-100 text-rose-900 border border-rose-200";
    case "비밀번호필요":
      return "bg-amber-50 text-amber-900 border border-amber-200";
    default:
      return "bg-slate-50 text-slate-600 border border-slate-200";
  }
}

export default function MainApp() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [excludedFileKeys, setExcludedFileKeys] = useState<Set<string>>(new Set());
  const [excludedTxKeys, setExcludedTxKeys] = useState<Set<string>>(new Set());
  const [memberCount, setMemberCount] = useState(20);
  const [monthFilter, setMonthFilter] = useState<string>("전체");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reportOpen, setReportOpen] = useState(false);
  const [reportHtml, setReportHtml] = useState("");
  const [reportMonth, setReportMonth] = useState("");
  const [clipboardFallback, setClipboardFallback] = useState("");
  const [pendingEncrypted, setPendingEncrypted] = useState<PendingEncryptedFile[]>([]);
  const transactionsRef = useRef<Transaction[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [loading, setLoading] = useState<{ active: boolean; message: string }>({ active: false, message: "" });

  useEffect(() => {
    setExcludedFileKeys(loadExcludedFileKeys());
    setExcludedTxKeys(loadExcludedTransactionKeys());
    setMemberCount(loadMemberCount(20));
    const lm = loadLastSelectedMonth();
    if (lm) setMonthFilter(lm);
  }, []);

  useEffect(() => {
    saveExcludedFileKeys(excludedFileKeys);
  }, [excludedFileKeys]);

  useEffect(() => {
    saveExcludedTransactionKeys(excludedTxKeys);
  }, [excludedTxKeys]);

  useEffect(() => {
    saveMemberCount(memberCount);
  }, [memberCount]);

  useEffect(() => {
    if (monthFilter !== "전체") saveLastSelectedMonth(monthFilter);
  }, [monthFilter]);

  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  const months = useMemo(() => allMonthsFromTransactions(transactions), [transactions]);

  const filteredTxs = useMemo(() => {
    return transactions.filter((t) => {
      if (monthFilter !== "전체" && t.month !== monthFilter) return false;
      if (statusFilter !== "전체" && t.supportStatus !== statusFilter) return false;
      return true;
    });
  }, [transactions, monthFilter, statusFilter]);

  const sortedFilteredTxs = useMemo(
    () => sortTransactionRows(filteredTxs, sortColumn, sortDirection),
    [filteredTxs, sortColumn, sortDirection],
  );

  const summary = useMemo(() => {
    if (monthFilter === "전체") return null;
    return computeMonthlySummary(transactions, monthFilter, memberCount);
  }, [transactions, monthFilter, memberCount]);

  const onSortColumn = useCallback((col: SortColumn) => {
    setSortColumn((cur) => {
      if (cur !== col) {
        setSortDirection("asc");
        return col;
      }
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      return col;
    });
  }, []);

  const toggleRowSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  /** 파싱된 거래를 동기 merge 후 state 반영 (암호 해제 후 async 경로 포함) */
  const commitParsedTransactions = useCallback(
    (incoming: Transaction[], file: File, loadedFileOpts?: { status?: LoadedFile["status"]; error?: string }) => {
      const outcome = applyFileMerge(transactionsRef.current, incoming, file, excludedTxKeys, loadedFileOpts);
      transactionsRef.current = outcome.nextTransactions;
      setTransactions(outcome.nextTransactions);
      const fk = makeFileKey(file);
      setLoadedFiles((p) => [...p.filter((x) => x.fileKey !== fk), outcome.loadedFile]);
      return outcome;
    },
    [excludedTxKeys],
  );

  const finishParsedFile = useCallback(
    (incoming: Transaction[], file: File): number => {
      const fk = makeFileKey(file);
      if (incoming.length === 0) {
        const lf: LoadedFile = {
          fileKey: fk,
          fileName: file.name,
          status: "실패",
          totalRows: 0,
          addedRows: 0,
          duplicateRows: 0,
          excludedRows: 0,
          error: EMPTY_PARSE_MESSAGE,
        };
        setLoadedFiles((p) => [...p.filter((x) => x.fileKey !== fk), lf]);
        toast.warning(EMPTY_PARSE_MESSAGE);
        return 0;
      }
      const outcome = commitParsedTransactions(incoming, file);
      const { addedRows } = outcome.loadedFile;
      if (addedRows > 0) {
        const firstMonth = outcome.merge.toAdd[0]?.month;
        if (firstMonth && monthFilter === "전체") setMonthFilter(firstMonth);
        toast.success(`${file.name} 반영 완료: ${addedRows}건`);
        return addedRows;
      }
      if (incoming.length > 0) {
        toast.warning("거래내역이 있으나 모두 중복·제외되어 반영된 건이 없습니다.");
      }
      return 0;
    },
    [commitParsedTransactions, monthFilter],
  );

  const unlockEncryptedFile = useCallback(
    async (fileKey: string, password: string) => {
      const item = pendingEncrypted.find((p) => p.fileKey === fileKey);
      if (!item) return;
      setLoading({ active: true, message: "암호 해제 및 Excel 파싱 중..." });
      try {
        const r = await parseExcelFile(item.arrayBuffer, item.file, password);
        if (!isParseExcelSuccess(r)) {
          if (r.wrongPassword) {
            toast.error(WRONG_PASSWORD_MESSAGE);
            setPendingEncrypted((prev) =>
              prev.map((p) => (p.fileKey === fileKey ? { ...p, error: r.error } : p)),
            );
            return;
          }
          if (r.unsupportedEncryption) {
            toast.error(r.error);
          } else {
            toast.error(r.error);
          }
          const fk = makeFileKey(item.file);
          setLoadedFiles((p) => [
            ...p.filter((x) => x.fileKey !== fk),
            {
              fileKey: fk,
              fileName: item.fileName,
              status: "실패",
              totalRows: 0,
              addedRows: 0,
              duplicateRows: 0,
              excludedRows: 0,
              error: r.error,
            },
          ]);
          return;
        }
        const added = finishParsedFile(r.transactions, item.file);
        if (added > 0) {
          setPendingEncrypted((prev) => prev.filter((p) => p.fileKey !== fileKey));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        toast.error(msg);
      } finally {
        setLoading({ active: false, message: "" });
      }
    },
    [pendingEncrypted, finishParsedFile],
  );

  const onFiles = useCallback(
    async (files: File[]) => {
      setLoading({ active: true, message: "거래내역 분석 중..." });
      let hadError = false;
      let processed = 0;
      try {
        for (const file of files) {
          const fk = makeFileKey(file);
          if (excludedFileKeys.has(fk)) continue;
          const lower = file.name.toLowerCase();
          setLoading({
            active: true,
            message: lower.endsWith(".csv") ? `CSV 파싱 중… ${file.name}` : `Excel 파싱 중… ${file.name}`,
          });
          await tick();
          try {
            if (lower.endsWith(".csv")) {
              const r = await parseCsvFile(file);
              if (r.error && !r.transactions.length) {
                hadError = true;
                toast.error(`업로드 실패: ${file.name} — ${r.error}`);
                setLoadedFiles((p) => [
                  ...p,
                  {
                    fileKey: fk,
                    fileName: file.name,
                    status: "실패",
                    totalRows: 0,
                    addedRows: 0,
                    duplicateRows: 0,
                    excludedRows: 0,
                    error: r.error,
                  },
                ]);
                continue;
              }
              const added = finishParsedFile(r.transactions, file);
              if (added > 0) processed += 1;
              continue;
            }
            if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
              const arrayBuffer = await file.arrayBuffer();
              await tick();
              const r = await parseExcelFile(arrayBuffer, file);
              if (!isParseExcelSuccess(r)) {
                if (r.needsPassword) {
                  console.debug("[reche] pending encrypted file", file.name);
                  setPendingEncrypted((prev) => {
                    const rest = prev.filter((p) => p.fileKey !== fk);
                    return [...rest, { fileKey: fk, fileName: file.name, file, arrayBuffer }];
                  });
                  setLoadedFiles((p) => [
                    ...p.filter((x) => x.fileKey !== fk),
                    {
                      fileKey: fk,
                      fileName: file.name,
                      status: "비밀번호필요",
                      totalRows: 0,
                      addedRows: 0,
                      duplicateRows: 0,
                      excludedRows: 0,
                      error: r.error,
                    },
                  ]);
                  continue;
                }
                hadError = true;
                toast.error(`${file.name} — ${r.error}`);
                setLoadedFiles((p) => [
                  ...p.filter((x) => x.fileKey !== fk),
                  {
                    fileKey: fk,
                    fileName: file.name,
                    status: "실패",
                    totalRows: 0,
                    addedRows: 0,
                    duplicateRows: 0,
                    excludedRows: 0,
                    error: r.error,
                  },
                ]);
                continue;
              }
              const added = finishParsedFile(r.transactions, file);
              if (added > 0) processed += 1;
              continue;
            }
          } catch (e) {
            hadError = true;
            const msg = e instanceof Error ? e.message : String(e);
            toast.error(`처리 오류: ${file.name} — ${msg}`);
            setLoadedFiles((p) => [
              ...p,
              {
                fileKey: fk,
                fileName: file.name,
                status: "실패",
                totalRows: 0,
                addedRows: 0,
                duplicateRows: 0,
                excludedRows: 0,
                error: msg,
              },
            ]);
          }
        }
        setLoading({ active: true, message: "월별 요약 계산 중..." });
        await tick();
        if (processed > 0) toast.success("거래내역 분석 완료");
        else if (!hadError && files.length > 0) toast.message("새로 반영된 파일이 없습니다.");
      } finally {
        setLoading({ active: false, message: "" });
      }
    },
    [excludedFileKeys, finishParsedFile],
  );

  const dismissPendingEncrypted = useCallback((fileKey: string) => {
    setPendingEncrypted((prev) => prev.filter((p) => p.fileKey !== fileKey));
    setLoadedFiles((prev) => prev.filter((f) => f.fileKey !== fileKey));
  }, []);

  const cancelLoadedFile = (fileKey: string) => {
    setExcludedFileKeys((s) => new Set(s).add(fileKey));
    setTransactions((prev) => prev.filter((t) => t.sourceFileKey !== fileKey));
    setLoadedFiles((prev) => prev.filter((f) => f.fileKey !== fileKey));
    toast.success("반영 취소 완료");
  };

  const clearUserExclusions = useCallback(() => {
    storageClearUserExclusions();
    setExcludedFileKeys(new Set());
    setExcludedTxKeys(new Set());
  }, []);

  const applyImportedSettings = useCallback((s: PersistedWebSettings) => {
    setExcludedFileKeys(new Set(s.excludedFileKeys));
    setExcludedTxKeys(new Set(s.excludedTransactionKeys));
    setMemberCount(s.memberCount);
    if (s.lastSelectedMonth) setMonthFilter(s.lastSelectedMonth);
    else setMonthFilter("전체");
  }, []);

  const deleteSelectedRows = useCallback(() => {
    const keys = new Set(excludedTxKeys);
    const toRemove = new Set<string>();
    for (const t of transactions) {
      if (selectedIds.has(t.id)) {
        keys.add(makeTransactionKey(t));
        toRemove.add(t.id);
      }
    }
    setExcludedTxKeys(keys);
    setTransactions((prev) => prev.filter((t) => !toRemove.has(t.id)));
    setSelectedIds(new Set());
    toast.success("선택한 거래를 제외했습니다.");
  }, [excludedTxKeys, transactions, selectedIds]);

  const updateTx = useCallback((id: string, patch: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, ...patch };
        if ("description" in patch || "deposit" in patch || "withdrawal" in patch) {
          const c = classifyTransaction(next.description, undefined, next.deposit, next.withdrawal);
          next.category = c.category;
          next.supportStatus = c.supportStatus;
          next.reason = c.reason;
        }
        const d = next.date.slice(0, 10);
        next.date = d;
        next.month = d.slice(0, 7);
        return next;
      }),
    );
  }, []);

  const addRow = useCallback(() => {
    const m =
      monthFilter !== "전체" ? monthFilter : months[0] ?? new Date().toISOString().slice(0, 7);
    const t: Transaction = {
      id:
        typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID
          ? globalThis.crypto.randomUUID()
          : `tx-${Math.random().toString(36).slice(2)}`,
      date: `${m}-01`,
      time: "",
      description: "",
      deposit: 0,
      withdrawal: 0,
      month: m,
      category: "확인필요",
      supportStatus: "확인필요",
      reason: "수동 입력",
      sourceFileName: "(수동)",
      sourceFileKey: "manual",
      receiptAttached: false,
    };
    setTransactions((p) => [...p, t]);
  }, [monthFilter, months]);

  const openReport = useCallback(() => {
    let m: string;
    if (monthFilter !== "전체") {
      m = monthFilter;
    } else if (months.length > 0) {
      m = months[months.length - 1]!;
      toast.info(`${m} 월 기준으로 활동보고서를 생성합니다. (월 필터: 전체)`);
    } else {
      toast.error("거래가 있거나 월을 선택한 뒤 활동보고서를 생성하세요.");
      return;
    }
    const html = buildActivityReportHtml(m, transactions, memberCount);
    setReportMonth(m);
    setReportHtml(html);
    setReportOpen(true);
    setClipboardFallback("");
  }, [monthFilter, months, transactions, memberCount]);

  const copyReport = useCallback(async () => {
    const plain = htmlToPlainText(reportHtml);
    const r = await copyHtmlToClipboard(reportHtml, plain);
    if (r === "html") {
      setClipboardFallback("");
      toast.success("HTML 복사 완료");
      return;
    }
    if (r === "text_plain") {
      setClipboardFallback("");
      toast.message("브라우저 제한으로 텍스트 복사로 대체됨");
      return;
    }
    setClipboardFallback(reportHtml);
    toast.error("복사 실패 — 아래 영역에서 수동으로 복사하세요.");
  }, [reportHtml]);

  const downloadReport = useCallback(() => {
    downloadHtml(`동호회_활동보고서_${reportMonth}.html`, reportHtml);
  }, [reportHtml, reportMonth]);

  const settingsSnapshot = useCallback(
    () => ({
      excludedFileKeys,
      excludedTransactionKeys: excludedTxKeys,
      memberCount,
      lastSelectedMonth: monthFilter === "전체" ? "" : monthFilter,
    }),
    [excludedFileKeys, excludedTxKeys, memberCount, monthFilter],
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-3 sm:px-4 py-3 shadow-sm sticky top-0 z-30">
        <div className="max-w-[1920px] mx-auto w-full flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-800">RecheManage Web</h1>
          </div>
          <div className="shrink-0 self-start sm:self-center">
            <SettingsMenu
              getSnapshot={settingsSnapshot}
              onImported={applyImportedSettings}
              onClearExclusions={clearUserExclusions}
            />
          </div>
        </div>
      </header>

      {loading.active && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/25 backdrop-blur-[1px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 px-6 py-5 flex flex-col items-center gap-3 min-w-[240px]">
            <div className="h-9 w-9 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" aria-hidden />
            <p className="text-sm font-medium text-slate-800 text-center">{loading.message}</p>
          </div>
        </div>
      )}

      <div className="flex-1 w-full max-w-[1920px] mx-auto p-2 sm:p-3 flex flex-col xl:flex-row gap-3 min-h-0">
        <aside className="w-full xl:w-[min(100%,280px)] xl:shrink-0 flex flex-col gap-3 order-1">
          <FileUploader onFiles={onFiles} disabled={loading.active} />
          <EncryptedExcelPrompt
            items={pendingEncrypted.map((p) => ({
              fileKey: p.fileKey,
              fileName: p.fileName,
              error: p.error,
            }))}
            disabled={loading.active}
            onUnlock={unlockEncryptedFile}
            onDismiss={dismissPendingEncrypted}
          />
          <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
            <h2 className="font-semibold text-sm mb-2 text-slate-800">반영된 파일</h2>
            <ul className="text-xs space-y-2 max-h-56 overflow-y-auto overflow-x-auto">
              {loadedFiles.map((f) => (
                <li key={f.fileKey} className="border-b border-slate-100 pb-2">
                  <div className="flex justify-between gap-1 items-start">
                    <span className="truncate font-medium min-w-0" title={f.fileName}>
                      {f.fileName}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${fileStatusBadgeClass(f.status)}`}>
                      {f.status}
                    </span>
                  </div>
                  {f.error && <p className="text-rose-600 text-[11px] mt-0.5 break-words">{f.error}</p>}
                  <button
                    type="button"
                    className="mt-1 text-[11px] text-rose-700 hover:underline disabled:opacity-40"
                    disabled={loading.active}
                    onClick={() => cancelLoadedFile(f.fileKey)}
                    aria-label={`${f.fileName} 반영 취소`}
                  >
                    반영 취소
                  </button>
                </li>
              ))}
            </ul>
            {loadedFiles.length === 0 && (
              <p className="text-xs text-slate-400 py-2 text-center">업로드한 파일이 없습니다.</p>
            )}
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col gap-2 order-2 xl:order-2 min-h-0">
          <div className="flex flex-wrap items-center gap-2 bg-white rounded-lg border border-slate-200 p-2 shadow-sm">
            <MonthSelector months={months} value={monthFilter} onChange={setMonthFilter} />
            <label className="text-sm flex items-center gap-1">
              상태
              <select
                className="border rounded px-2 py-1 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                aria-label="지원 상태 필터"
              >
                {(["전체", "인정", "확인필요", "불인정", "계산제외"] as const).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="text-sm px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 shrink-0"
              disabled={loading.active}
              onClick={addRow}
            >
              행 추가
            </button>
            <button
              type="button"
              className="text-sm px-3 py-1.5 rounded bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-40 shrink-0"
              disabled={!selectedIds.size || loading.active}
              onClick={deleteSelectedRows}
            >
              선택 행 삭제
            </button>
          </div>
          <TransactionTable
            rows={sortedFilteredTxs}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onToggleRow={toggleRowSelection}
            onUpdate={updateTx}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSortColumn={onSortColumn}
            disabled={loading.active}
          />
        </main>

        <aside className="w-full xl:w-[min(100%,300px)] xl:shrink-0 order-3">
          <SummaryPanel
            summary={summary}
            monthFilter={monthFilter}
            memberCount={memberCount}
            onMemberCountChange={setMemberCount}
            onGenerateReport={openReport}
            disabled={loading.active}
          />
        </aside>
      </div>

      <ReportPreview
        open={reportOpen}
        html={reportHtml}
        fallbackHtml={clipboardFallback}
        onClose={() => setReportOpen(false)}
        onCopy={() => void copyReport()}
        onDownload={downloadReport}
      />
    </div>
  );
}
