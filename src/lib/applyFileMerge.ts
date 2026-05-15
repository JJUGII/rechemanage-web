import type { LoadedFile, Transaction } from "./types";
import { computeMerge, type MergeResult } from "./mergeHelpers";
import { makeFileKey } from "./transactionKey";

export function classifyLoadStatus(total: number, added: number, dup: number): LoadedFile["status"] {
  if (total === 0) return "실패";
  if (added === 0 && dup > 0) return "중복건너뜀";
  if (added < total) return "일부반영";
  return "반영성공";
}

export function buildLoadedFile(
  file: File,
  incomingCount: number,
  merge: MergeResult,
  opts?: { status?: LoadedFile["status"]; error?: string },
): LoadedFile {
  const fk = makeFileKey(file);
  return {
    fileKey: fk,
    fileName: file.name,
    status: opts?.status ?? classifyLoadStatus(incomingCount, merge.toAdd.length, merge.duplicateRows),
    totalRows: incomingCount,
    addedRows: merge.toAdd.length,
    duplicateRows: merge.duplicateRows,
    excludedRows: merge.excludedRows,
    error: opts?.error,
  };
}

export interface ApplyMergeOutcome {
  nextTransactions: Transaction[];
  merge: MergeResult;
  loadedFile: LoadedFile;
}

/** 거래 병합 + LoadedFile 메타 — setState 전에 동기 계산 */
export function applyFileMerge(
  prev: Transaction[],
  incoming: Transaction[],
  file: File,
  excludedTxKeys: Set<string>,
  loadedFileOpts?: { status?: LoadedFile["status"]; error?: string },
): ApplyMergeOutcome {
  const merge = computeMerge(prev, incoming, excludedTxKeys);
  const loadedFile = buildLoadedFile(file, incoming.length, merge, loadedFileOpts);
  const nextTransactions = [...prev, ...merge.toAdd];
  console.debug("[reche] applyFileMerge", {
    fileName: file.name,
    parsed: incoming.length,
    added: merge.toAdd.length,
    duplicate: merge.duplicateRows,
    excluded: merge.excludedRows,
    loadedFileStatus: loadedFile.status,
  });
  return { nextTransactions, merge, loadedFile };
}
