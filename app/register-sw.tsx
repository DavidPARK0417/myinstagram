"use client";

/**
 * @file app/register-sw.tsx
 * @description Service Worker 등록 컴포넌트
 *
 * 이 컴포넌트는 클라이언트에서 Service Worker를 등록합니다.
 */

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      console.group("[RegisterSW] Service Worker 등록 시작");

      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✅ Service Worker 등록 성공:", registration.scope);
        })
        .catch((error) => {
          console.error("❌ Service Worker 등록 실패:", error);
        })
        .finally(() => {
          console.groupEnd();
        });
    }
  }, []);

  return null;
}
