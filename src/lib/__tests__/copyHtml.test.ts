import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { copyHtmlToClipboard } from "../reportHtml";

class MockClipboardItem {
  constructor(_data: Record<string, Blob>) {
    void _data;
  }
}

describe("copyHtmlToClipboard", () => {
  const origClip = (globalThis as unknown as { ClipboardItem?: unknown }).ClipboardItem;

  beforeEach(() => {
    (globalThis as unknown as { ClipboardItem: unknown }).ClipboardItem = MockClipboardItem as unknown;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (origClip !== undefined) (globalThis as unknown as { ClipboardItem: unknown }).ClipboardItem = origClip;
    else delete (globalThis as unknown as { ClipboardItem?: unknown }).ClipboardItem;
  });

  it("write 실패 후 writeText 성공 → text_plain", async () => {
    vi.stubGlobal("navigator", {
      clipboard: {
        write: vi.fn().mockRejectedValue(new Error("denied")),
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    const r = await copyHtmlToClipboard("<p>hi</p>", "hi");
    expect(r).toBe("text_plain");
  });

  it("둘 다 실패 → failed", async () => {
    vi.stubGlobal("navigator", {
      clipboard: {
        write: vi.fn().mockRejectedValue(new Error("denied")),
        writeText: vi.fn().mockRejectedValue(new Error("denied")),
      },
    });
    const r = await copyHtmlToClipboard("<p>hi</p>", "hi");
    expect(r).toBe("failed");
  });
});
