import { describe, expect, it } from "vitest";
import {
  SETTINGS_EXPORT_VERSION,
  buildPersistedSettingsSnapshot,
  parseImportedSettings,
} from "../storage";

describe("storage settings export/import", () => {
  it("스냅샷 빌드 후 파싱 라운드트립", () => {
    const snap = buildPersistedSettingsSnapshot({
      excludedFileKeys: new Set(["a", "b"]),
      excludedTransactionKeys: new Set(["t1"]),
      memberCount: 15,
      lastSelectedMonth: "2026-04",
    });
    expect(snap.version).toBe(SETTINGS_EXPORT_VERSION);
    const again = parseImportedSettings(snap);
    expect(again.excludedFileKeys).toEqual(["a", "b"]);
    expect(again.memberCount).toBe(15);
  });

  it("잘못된 JSON은 throw", () => {
    expect(() => parseImportedSettings(null)).toThrow();
    expect(() => parseImportedSettings({ version: 99 })).toThrow();
    expect(() =>
      parseImportedSettings({
        version: 1,
        excludedFileKeys: [1, 2],
        excludedTransactionKeys: [],
        memberCount: 10,
        lastSelectedMonth: "",
      }),
    ).toThrow();
  });
});
