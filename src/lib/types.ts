export type SupportStatus = "인정" | "불인정" | "확인필요" | "계산제외";

export type LoadedFileStatus =
  | "반영성공"
  | "일부반영"
  | "중복건너뜀"
  | "사용자제외"
  | "비밀번호필요"
  | "실패";

export interface Transaction {
  id: string;
  date: string;
  time?: string;
  description: string;
  merchant?: string;
  deposit: number;
  withdrawal: number;
  balance?: number;
  month: string;
  category: string;
  supportStatus: SupportStatus;
  reason: string;
  sourceFileName: string;
  sourceFileKey: string;
  receiptAttached: boolean;
}

export interface LoadedFile {
  fileKey: string;
  fileName: string;
  status: LoadedFileStatus;
  totalRows: number;
  addedRows: number;
  duplicateRows: number;
  excludedRows: number;
  error?: string;
}

export interface MonthlySummary {
  month: string;
  memberCount: number;
  limitAmount: number;
  acceptedAmount: number;
  pendingAmount: number;
  rejectedAmount: number;
  excludedAmount: number;
  expectedCashback: number;
}

export type StatusFilter = "전체" | "인정" | "확인필요" | "불인정" | "계산제외";
