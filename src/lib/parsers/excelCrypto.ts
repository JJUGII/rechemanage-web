import { Buffer } from "buffer";

export const UNSUPPORTED_ENCRYPTION_MESSAGE =
  "현재 브라우저 보안 환경에서는 이 암호화 형식을 해제할 수 없습니다. 엑셀에서 암호를 해제한 뒤 다시 업로드해주세요.";

export const WRONG_PASSWORD_MESSAGE = "엑셀 비밀번호가 올바르지 않습니다.";

export type DecryptExcelOutcome =
  | { ok: true; buffer: ArrayBuffer }
  | { ok: false; kind: "wrongPassword"; message: string }
  | { ok: false; kind: "unsupported"; message: string }
  | { ok: false; kind: "error"; message: string };

/** officecrypto-tool 오류 → UI 상태 */
export function mapDecryptError(err: unknown): Extract<DecryptExcelOutcome, { ok: false }> {
  const msg = err instanceof Error ? err.message : String(err);
  if (/incorrect|password is incorrect|비밀번호/i.test(msg)) {
    return { ok: false, kind: "wrongPassword", message: WRONG_PASSWORD_MESSAGE };
  }
  if (/unsupported encryption|Extensible|ECMA-376 Extensible/i.test(msg)) {
    return { ok: false, kind: "unsupported", message: UNSUPPORTED_ENCRYPTION_MESSAGE };
  }
  return { ok: false, kind: "error", message: msg || "엑셀 복호화에 실패했습니다." };
}

async function loadOfficeCrypto() {
  const mod = await import("officecrypto-tool");
  return mod.default ?? mod;
}

export async function isEncryptedExcelBuffer(ab: ArrayBuffer): Promise<boolean> {
  try {
    const officeCrypto = await loadOfficeCrypto();
    return officeCrypto.isEncrypted(Buffer.from(new Uint8Array(ab)));
  } catch {
    return false;
  }
}

/** 비밀번호로 xlsx/xls 복호화 — 비밀번호는 호출 스택 밖으로보내지 않음 */
export async function decryptExcelBuffer(ab: ArrayBuffer, password: string): Promise<DecryptExcelOutcome> {
  try {
    const officeCrypto = await loadOfficeCrypto();
    const input = Buffer.from(new Uint8Array(ab));
    const decrypted = await officeCrypto.decrypt(input, { password });
    const view =
      decrypted instanceof ArrayBuffer
        ? new Uint8Array(decrypted)
        : new Uint8Array(decrypted.buffer, decrypted.byteOffset, decrypted.byteLength);
    const copy = new Uint8Array(view.length);
    copy.set(view);
    return { ok: true, buffer: copy.buffer };
  } catch (err) {
    return mapDecryptError(err);
  }
}
