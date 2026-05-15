"use client";

import { useEffect, useRef } from "react";

interface ReportPreviewProps {
  open: boolean;
  html: string;
  fallbackHtml: string;
  onClose: () => void;
  onCopy: () => void | Promise<void>;
  onDownload: () => void;
}

export function ReportPreview({ open, html, fallbackHtml, onClose, onCopy, onDownload }: ReportPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!open || !iframeRef.current || !html) return;
    const doc = iframeRef.current.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
  }, [open, html]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b px-3 py-2">
          <h3 className="font-semibold">활동보고서 미리보기</h3>
          <button type="button" className="text-slate-500 hover:text-slate-800 px-2" onClick={onClose} aria-label="닫기">
            닫기
          </button>
        </div>
        <div className="flex gap-2 px-3 py-2 border-b flex-wrap">
          <button
            type="button"
            className="text-sm px-3 py-1 rounded bg-slate-800 text-white hover:bg-slate-900"
            onClick={() => void onCopy()}
            aria-label="HTML 복사"
          >
            HTML 복사
          </button>
          <button
            type="button"
            className="text-sm px-3 py-1 rounded bg-slate-200 hover:bg-slate-300"
            onClick={onDownload}
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
        <iframe ref={iframeRef} title="preview" className="flex-1 min-h-[360px] w-full border-0" sandbox="allow-same-origin" />
      </div>
    </div>
  );
}
