"use client";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  IconChart, IconTreasureMap, IconEdit, IconDownload, IconUsers,
  IconGamepad, IconTarget, IconCheck, IconX, IconSword, IconSearch, IconKey, IconMessage,
} from "@/components/Icon";

const emptyFilters = { firstName: "", lastName: "", nickname: "", grade: "", studentId: "" };

export default function TeacherDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [filters, setFilters] = useState({ ...emptyFilters });
  const [loading, setLoading] = useState(true);
  const [newFeedbackCount, setNewFeedbackCount] = useState(0);

  useEffect(() => {
    fetch("/api/teacher/feedback?status=NEW")
      .then(r => r.json())
      .then(d => setNewFeedbackCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {});
  }, []);
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string; studentId: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  async function submitReset() {
    if (!resetTarget) return;
    if (newPassword.length < 6) {
      setResetError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    setResetLoading(true);
    setResetError("");
    const res = await fetch(`/api/teacher/students/${resetTarget.id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    setResetLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setResetError(d.error || "รีเซ็ตรหัสผ่านไม่สำเร็จ");
      return;
    }
    setResetDone(true);
  }

  function closeResetModal() {
    setResetTarget(null);
    setNewPassword("");
    setResetError("");
    setResetDone(false);
  }

  function fetchStudents() {
    setLoading(true);
    const params = new URLSearchParams();
    (Object.entries(filters) as [string, string][]).forEach(([k, v]) => {
      if (v.trim()) params.set(k, v.trim());
    });
    fetch("/api/teacher/students?" + params)
      .then(r => r.json())
      .then(d => { setStudents(Array.isArray(d) ? d : []); setLoading(false); });
  }

  useEffect(() => { fetchStudents(); }, []);

  function setField(k: keyof typeof filters, v: string) {
    setFilters(f => ({ ...f, [k]: v }));
  }
  function resetFilters() {
    setFilters({ ...emptyFilters });
    setTimeout(fetchStudents, 0);
  }

  const overallStats = students.reduce((acc, s) => {
    const total = s.sessions.reduce((a: number, g: any) => a + g.total, 0);
    const correct = s.sessions.reduce((a: number, g: any) => a + g.correct, 0);
    acc.plays += s.sessions.length;
    acc.total += total;
    acc.correct += correct;
    return acc;
  }, { plays: 0, total: 0, correct: 0 });

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="font-pixel text-yellow-400 text-[9px] sm:text-xs flex items-center gap-2 min-w-0 break-words">
          <IconSword size={16} className="shrink-0" /> Math Quest — ครู
        </div>
        <div className="flex gap-2 sm:gap-3 items-center flex-wrap text-xs sm:text-sm">
          <Link href="/teacher/results" className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors whitespace-nowrap">
            <IconChart size={16} className="shrink-0" /> Overview
          </Link>
          <Link href="/teacher/stages" className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 whitespace-nowrap">
            <IconTreasureMap size={16} className="shrink-0" /> จัดการด่าน
          </Link>
          <Link href="/teacher/questions" className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 whitespace-nowrap">
            <IconEdit size={16} className="shrink-0" /> จัดการโจทย์
          </Link>
          <Link href="/teacher/import" className="flex items-center gap-1.5 text-teal-400 hover:text-teal-300 whitespace-nowrap">
            <IconUsers size={16} className="shrink-0" /> นำเข้านักเรียน
          </Link>
          <Link href="/teacher/feedback" className="flex items-center gap-1.5 text-pink-400 hover:text-pink-300 whitespace-nowrap">
            <IconMessage size={16} className="shrink-0" /> Feedback
            {newFeedbackCount > 0 && <span className="bg-red-600 text-white text-[10px] px-1.5 rounded-full">{newFeedbackCount}</span>}
          </Link>
          <a
            href="/api/teacher/export"
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <IconDownload size={16} className="shrink-0" /> Export Excel
          </a>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-slate-300 hover:text-slate-300 whitespace-nowrap">ออก</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "นักเรียนทั้งหมด", value: students.length, icon: <IconUsers size={26} /> },
            { label: "จำนวนครั้งที่เล่น", value: overallStats.plays, icon: <IconGamepad size={26} /> },
            { label: "Accuracy เฉลี่ย", value: overallStats.total > 0 ? Math.round(overallStats.correct / overallStats.total * 100) + "%" : "-", icon: <IconTarget size={26} /> },
          ].map(c => (
            <div key={c.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="text-yellow-400 mb-2">{c.icon}</div>
              <div className="font-pixel text-yellow-400 text-lg">{c.value}</div>
              <div className="text-slate-300 text-xs mt-1">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Multi-field search */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
          <div className="text-slate-300 text-xs mb-3 flex items-center gap-1.5">
            <IconSearch size={14} /> ค้นหานักเรียน — กรอกเฉพาะช่องที่ต้องการ (จะแสดงคนที่ตรงทุกช่องที่กรอก)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <input
              type="text" placeholder="ชื่อจริง" value={filters.firstName}
              onChange={e => setField("firstName", e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchStudents()}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
            />
            <input
              type="text" placeholder="นามสกุล" value={filters.lastName}
              onChange={e => setField("lastName", e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchStudents()}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
            />
            <input
              type="text" placeholder="ชื่อเล่น" value={filters.nickname}
              onChange={e => setField("nickname", e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchStudents()}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
            />
            <select
              value={filters.grade}
              onChange={e => setField("grade", e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="">ทุกชั้น</option>
              {[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>ม.{g}</option>)}
            </select>
            <input
              type="text" placeholder="เลขประจำตัว" value={filters.studentId}
              onChange={e => setField("studentId", e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchStudents()}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex gap-2 mt-3 items-center">
            <button onClick={fetchStudents} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded transition-colors">
              <IconSearch size={15} /> ค้นหา
            </button>
            <button onClick={resetFilters} className="text-slate-300 hover:text-slate-200 text-sm px-3 py-2">ล้างค่า</button>
            <Link href="/teacher/audit" className="ml-auto flex items-center gap-1 text-slate-300 hover:text-slate-300 text-xs">
              <IconKey size={13} /> ประวัติการรีเซ็ตรหัสผ่าน
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-slate-700 text-slate-300">
                <th className="text-left px-4 py-3">ชื่อ</th>
                <th className="text-left px-4 py-3">ชื่อเล่น</th>
                <th className="text-left px-4 py-3">ห้อง</th>
                <th className="text-left px-4 py-3">เลขประจำตัว</th>
                <th className="text-right px-4 py-3">เล่น</th>
                <th className="text-right px-4 py-3">คะแนนรวม</th>
                <th className="text-right px-4 py-3">Accuracy</th>
                <th className="text-right px-4 py-3">ผ่าน/ไม่ผ่าน</th>
                <th className="text-right px-4 py-3">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} className="text-center text-slate-300 py-8">กำลังโหลด...</td></tr>
              )}
              {!loading && students.length === 0 && (
                <tr><td colSpan={9} className="text-center text-slate-300 py-8">ไม่พบนักเรียน</td></tr>
              )}
              {students.map(s => {
                const total = s.sessions.reduce((a: number, g: any) => a + g.total, 0);
                const correct = s.sessions.reduce((a: number, g: any) => a + g.correct, 0);
                const score = s.sessions.reduce((a: number, g: any) => a + g.score, 0);
                const passed = s.sessions.filter((g: any) => g.passed).length;
                return (
                  <tr key={s.id} className="border-t border-slate-700 hover:bg-slate-750 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-slate-300">{s.nickname ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-300">{s.classroom ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-300">{s.studentId ?? "-"}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{s.sessions.length}</td>
                    <td className="px-4 py-3 text-right text-yellow-400 font-pixel text-xs">{score}</td>
                    <td className="px-4 py-3 text-right text-blue-400">{total > 0 ? Math.round(correct / total * 100) : 0}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-green-400"><IconCheck size={14} />{passed}</span>
                      <span className="text-slate-300 mx-1.5">/</span>
                      <span className="inline-flex items-center gap-1 text-red-400"><IconX size={14} />{s.sessions.length - passed}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setResetTarget({ id: s.id, name: s.name, studentId: s.studentId }); setNewPassword(""); setResetError(""); setResetDone(false); }}
                        className="inline-flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded transition-colors"
                      >
                        <IconKey size={13} /> รีเซ็ตรหัสผ่าน
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm">
            <div className="px-5 py-4 border-b border-slate-700">
              <div className="text-white font-medium">รีเซ็ตรหัสผ่าน</div>
              <div className="text-slate-300 text-xs mt-1">{resetTarget.name} · เลขประจำตัว {resetTarget.studentId}</div>
            </div>
            <div className="p-5">
              {resetDone ? (
                <div className="text-center py-2">
                  <div className="text-green-400 text-sm mb-4 flex items-center justify-center gap-1.5"><IconCheck size={16} /> ตั้งรหัสผ่านใหม่สำเร็จ</div>
                  <button onClick={closeResetModal} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm py-2.5 rounded-xl transition-colors">ปิด</button>
                </div>
              ) : (
                <>
                  <label className="block text-slate-300 text-xs mb-1.5">รหัสผ่านใหม่</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400 mb-2"
                    autoFocus
                  />
                  {resetError && <p className="text-red-400 text-xs mb-2">{resetError}</p>}
                  <div className="flex gap-2 mt-3">
                    <button onClick={closeResetModal} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm py-2.5 rounded-xl transition-colors">ยกเลิก</button>
                    <button
                      onClick={submitReset}
                      disabled={resetLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm py-2.5 rounded-xl transition-colors"
                    >
                      {resetLoading ? "กำลังบันทึก..." : "ยืนยัน"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
