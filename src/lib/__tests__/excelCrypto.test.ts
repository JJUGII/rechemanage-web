import { describe, expect, it } from "vitest";
import {
  mapDecryptError,
  UNSUPPORTED_ENCRYPTION_MESSAGE,
  WRONG_PASSWORD_MESSAGE,
} from "../parsers/excelCrypto";

describe("excelCrypto mapDecryptError", () => {
  it("비밀번호 오류", () => {
    const r = mapDecryptError(new Error("The password is incorrect"));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.kind).toBe("wrongPassword");
      expect(r.message).toBe(WRONG_PASSWORD_MESSAGE);
    }
  });

  it("지원하지 않는 암호화", () => {
    const r = mapDecryptError(new Error("Unsupported encryption algorithms"));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.kind).toBe("unsupported");
      expect(r.message).toBe(UNSUPPORTED_ENCRYPTION_MESSAGE);
    }
  });

  it("기타 오류", () => {
    const r = mapDecryptError(new Error("network fail"));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.kind).toBe("error");
      expect(r.message).toContain("network");
    }
  });
});
