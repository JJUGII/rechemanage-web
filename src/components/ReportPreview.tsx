"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { serializeReportDocument } from "@/lib/reportHtml";

export type ReportPreviewHandle = {
  getHtml: () => string;
};

interface ReportPreviewProps {
  open: boolean;
  html: string;
  fallbackHtml: string;
  onClose: () => void;
  onCopy: () => void | Promise<void>;
  onDownload: () => void;
  onHtmlChange?: (html: string) => void;
}

export const ReportPreview = forwardRef<ReportPreviewHandle, ReportPreviewProps>(function ReportPreview(
  { open, html, fallbackHtml, onClose, onCopy, onDownload, onHtmlChange },
  ref,
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const readHtml = useCallback((): string => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.documentElement) return html;
    return serializeReportDocument(doc);
  }, [html]);

  const syncToParent = useCallback(() => {
    if (!onHtmlChange) return;
    onHtmlChange(readHtml());
  }, [onHtmlChange, readHtml]);

  useImperativeHandle(ref, () => ({ getHtml: readHtml }), [readHtml]);

  useEffect(() => {
    if (!open || !iframeRef.current || !html) return;
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();

    if (doc.body) {
      doc.body.contentEditable = "true";
      doc.body.style.outline = "none";
    }

    const onInput = () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(syncToParent, 200);
    };
    doc.body?.addEventListener("input", onInput);

    return () => {
      doc.body?.removeEventListener("input", onInput);
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [open, html, syncToParent]);

  const handleCopy = () => {
    syncToParent();
    void onCopy();
  };

  const handleDownload = () => {
    syncToParent();
    onDownload();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b px-3 py-2">
          <div>
            <h3 className="font-semibold">활동보고서 미리보기</h3>
            <p className="text-xs text-slate-500 mt-0.5">표 안 텍스트를 클릭해 직접 수정할 수 있습니다.</p>
          </div>
          <button type="button" className="text-slate-500 hover:text-slate-800 px-2" onClick={onClose} aria-label="닫기">
            닫기
          </button>
        </div>
        <div className="flex gap-2 px-3 py-2 border-b flex-wrap">
          <button
            type="button"
            className="text-sm px-3 py-1 rounded bg-slate-800 text-white hover:bg-slate-900"
            onClick={handleCopy}
            aria-label="HTML 복사"
          >
            HTML 복사
          </button>
          <button
            type="button"
            className="text-sm px-3 py-1 rounded bg-slate-200 hover:bg-slate-300"
            onClick={handleDownload}
            aria-label="HTML 다운로드"
          >
            HTML 다운로드
          </button>
        </div>
        {fallbackHtml ? (
          <div className="p-3 text-xs">
            <p className="text-amber-800 mb-2 font-medium">
              복사에 실패했습니다. 아래 영역을 전체 선택(Ctrl+A) 후 복사(Ctrl+C)하세요.
            </p>
            <textarea
              className="w-full min-h-[160px] border rounded p-2 font-mono text-xs"
              readOnly
              value={fallbackHtml}
              aria-label="수동 복사용 HTML"
            />
          </div>
        ) : null}
        <iframe
          ref={iframeRef}
          title="preview"
          className="flex-1 min-h-[360px] w-full border-0 bg-white"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
});
