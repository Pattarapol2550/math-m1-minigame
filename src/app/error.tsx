"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
        <h1 className="text-white text-lg font-medium mb-2">เกิดข้อผิดพลาด</h1>
        <p className="text-slate-400 text-sm mb-6">ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            ลองใหม่
          </button>
          <a
            href="/"
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            หน้าหลัก
          </a>
        </div>
      </div>
    </div>
  );
}
