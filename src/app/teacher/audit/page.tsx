"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconKey } from "@/components/Icon";

interface Log {
  id: string;
  targetName: string;
  targetStudentId: string;
  byName: string;
  createdAt: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teacher/password-logs")
      .then(r => r.json())
      .then(d => { setLogs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center gap-3">
        <Link href="/teacher" className="flex items-center gap-1 text-slate-300 hover:text-white text-sm">
          <IconArrowLeft size={16} /> Dashboard
        </Link>
        <span className="font-pixel text-yellow-400 text-xs flex items-center gap-1.5">
          <IconKey size={14} /> ประวัติการรีเซ็ตรหัสผ่าน
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-slate-700 text-slate-300">
                <th className="text-left px-4 py-3">เวลา</th>
                <th className="text-left px-4 py-3">นักเรียน</th>
                <th className="text-left px-4 py-3">เลขประจำตัว</th>
                <th className="text-left px-4 py-3">ดำเนินการโดย</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="text-center text-slate-300 py-8">กำลังโหลด...</td></tr>}
              {!loading && logs.length === 0 && <tr><td colSpan={4} className="text-center text-slate-300 py-8">ยังไม่มีประวัติ</td></tr>}
              {logs.map(l => (
                <tr key={l.id} className="border-t border-slate-700">
                  <td className="px-4 py-3 text-slate-300">{new Date(l.createdAt).toLocaleString("th-TH")}</td>
                  <td className="px-4 py-3 text-white">{l.targetName}</td>
                  <td className="px-4 py-3 text-slate-300">{l.targetStudentId}</td>
                  <td className="px-4 py-3 text-slate-300">{l.byName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
