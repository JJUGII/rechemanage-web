import type { Transaction } from "../types";

export const NEEDS_PASSWORD_MESSAGE = "암호화된 엑셀입니다. 비밀번호를 입력해주세요.";
export const EMPTY_PARSE_MESSAGE =
  "엑셀을 읽었지만 거래내역을 찾지 못했습니다. 양식을 확인해주세요.";

export type ParseExcelSuccess = {
  ok: true;
  transactions: Transaction[];
};

export type ParseExcelFailure = {
  ok: false;
  transactions: [];
  error: string;
  encrypted?: boolean;
  needsPassword?: boolean;
  wrongPassword?: boolean;
  unsupportedEncryption?: boolean;
};

export type ParseExcelResult = ParseExcelSuccess | ParseExcelFailure;

export function isParseExcelSuccess(r: ParseExcelResult): r is ParseExcelSuccess {
  return r.ok === true;
}
