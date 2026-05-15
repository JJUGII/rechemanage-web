"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { protocol, hostname } = window.location;
    const secure = protocol === "https:" || hostname === "localhost" || hostname === "127.0.0.1";
    if (!secure || !("serviceWorker" in navigator)) return;

    try {
      const dir = new URL(window.location.href);
      if (!dir.pathname.endsWith("/")) {
        const i = dir.pathname.lastIndexOf("/");
        dir.pathname = i >= 0 ? `${dir.pathname.slice(0, i + 1)}` : "/";
      }
      const swUrl = new URL("sw.js", dir).toString();
      void navigator.serviceWorker.register(swUrl).catch(() => {
        /* 정적 호스팅/경로에 따라 실패할 수 있음 */
      });
    } catch {
      /* file:// 등 */
    }
  }, []);

  return null;
}
