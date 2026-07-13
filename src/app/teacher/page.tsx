"use client";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function TeacherDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [classroom, setClassroom] = useState("");
  const [loading, setLoading] = useState(true);

  function fetchStudents() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (classroom) params.set("classroom", classroom);
    fetch("/api/teacher/students?" + params)
      .then(r => r.json())
      .then(d => { setStudents(d); setLoading(false); });
  }

  useEffect(() => { fetchStudents(); }, []);

  const classrooms = [...new Set(students.map(s => s.classroom).filter(Boolean))].sort();

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
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="font-pixel text-yellow-400 text-xs">⚔ Math Quest — ครู</div>
        <div className="flex gap-4 items-center">
          <Link href="/teacher/results" className="text-green-400 text-sm hover:text-green-300">📊 คะแนนนักเรียน</Link>
          <Link href="/teacher/stages" className="text-purple-400 text-sm hover:text-purple-300">🗺️ จัดการด่าน</Link>
          <Link href="/teacher/questions" className="text-blue-400 text-sm hover:text-blue-300">📝 จัดการโจทย์</Link>
          <a
            href="/api/teacher/export"
            className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-2 rounded transition-colors"
          >
            📥 Export Excel
          </a>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-slate-400 text-sm hover:text-slate-300">ออก</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "นักเรียนทั้งหมด", value: students.length, icon: "👥" },
            { label: "จำนวนครั้งที่เล่น", value: overallStats.plays, icon: "🎮" },
            { label: "Accuracy เฉลี่ย", value: overallStats.total > 0 ? Math.round(overallStats.correct / overallStats.total * 100) + "%" : "-", icon: "🎯" },
          ].map(c => (
            <div key={c.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="text-2xl mb-1">{c.icon}</div>
              <div className="font-pixel text-yellow-400 text-lg">{c.value}</div>
              <div className="text-slate-400 text-xs mt-1">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="ค้นหาชื่อนักเรียน..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchStudents()}
            className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm flex-1 focus:outline-none focus:border-blue-400"
          />
          <select
            value={classroom}
            onChange={e => setClassroom(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none"
          >
            <option value="">ทุกห้อง</option>
            {classrooms.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={fetchStudents} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded transition-colors">ค้นหา</button>
        </div>

        {/* Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700 text-slate-300">
                <th className="text-left px-4 py-3">ชื่อ</th>
                <th className="text-left px-4 py-3">ห้อง</th>
                <th className="text-right px-4 py-3">เล่น</th>
                <th className="text-right px-4 py-3">คะแนนรวม</th>
                <th className="text-right px-4 py-3">Accuracy</th>
                <th className="text-right px-4 py-3">ผ่าน/ไม่ผ่าน</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="text-center text-slate-400 py-8">กำลังโหลด...</td></tr>
              )}
              {!loading && students.length === 0 && (
                <tr><td colSpan={6} className="text-center text-slate-400 py-8">ไม่พบนักเรียน</td></tr>
              )}
              {students.map(s => {
                const total = s.sessions.reduce((a: number, g: any) => a + g.total, 0);
                const correct = s.sessions.reduce((a: number, g: any) => a + g.correct, 0);
                const score = s.sessions.reduce((a: number, g: any) => a + g.score, 0);
                const passed = s.sessions.filter((g: any) => g.passed).length;
                return (
                  <tr key={s.id} className="border-t border-slate-700 hover:bg-slate-750 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-slate-400">{s.classroom ?? "-"}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{s.sessions.length}</td>
                    <td className="px-4 py-3 text-right text-yellow-400 font-pixel text-xs">{score}</td>
                    <td className="px-4 py-3 text-right text-blue-400">{total > 0 ? Math.round(correct / total * 100) : 0}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-green-400">{passed}✅</span>
                      <span className="text-slate-500 mx-1">/</span>
                      <span className="text-red-400">{s.sessions.length - passed}❌</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
