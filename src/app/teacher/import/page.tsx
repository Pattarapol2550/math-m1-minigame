"use client";
import { useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconUsers, IconCheck, IconX } from "@/components/Icon";

interface ParsedRow {
  firstName: string;
  lastName: string;
  nickname: string;
  grade: string;
  room: string;
  number: string;
  studentId: string;
  password: string;
}

const HEADERS = ["firstName", "lastName", "nickname", "grade", "room", "number", "studentId", "password"] as const;

// Simple CSV parser (handles quoted fields + commas)
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* ignore */ }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ""));
}

export default function ImportPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ created: number; errors: { row: number; studentId: string; reason: string }[]; totalRows: number } | null>(null);
  const [loading, setLoading] = useState(false);

  function handleFile(file: File) {
    setError("");
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const cells = parseCsv(String(reader.result));
        if (cells.length < 2) { setError("ไฟล์ว่างหรือมีแต่หัวตาราง"); return; }
        // Match header row to known columns (case-insensitive)
        const header = cells[0].map(h => h.trim().toLowerCase());
        const idx = (name: string) => header.indexOf(name.toLowerCase());
        const map = Object.fromEntries(HEADERS.map(h => [h, idx(h)]));
        const parsed: ParsedRow[] = cells.slice(1).map(c => ({
          firstName: (map.firstName >= 0 ? c[map.firstName] : "")?.trim() ?? "",
          lastName: (map.lastName >= 0 ? c[map.lastName] : "")?.trim() ?? "",
          nickname: (map.nickname >= 0 ? c[map.nickname] : "")?.trim() ?? "",
          grade: (map.grade >= 0 ? c[map.grade] : "")?.trim() ?? "",
          room: (map.room >= 0 ? c[map.room] : "")?.trim() ?? "",
          number: (map.number >= 0 ? c[map.number] : "")?.trim() ?? "",
          studentId: (map.studentId >= 0 ? c[map.studentId] : "")?.trim() ?? "",
          password: (map.password >= 0 ? c[map.password] : "")?.trim() ?? "",
        }));
        setRows(parsed);
      } catch {
        setError("อ่านไฟล์ไม่สำเร็จ");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  async function submitImport() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/teacher/students/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ students: rows }),
    });
    setLoading(false);
    const d = await res.json();
    if (!res.ok) { setError(d.error || "นำเข้าไม่สำเร็จ"); return; }
    setResult(d);
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center gap-3 flex-wrap">
        <Link href="/teacher" className="flex items-center gap-1 text-slate-300 hover:text-white text-sm">
          <IconArrowLeft size={16} /> Dashboard
        </Link>
        <span className="font-pixel text-yellow-400 text-xs flex items-center gap-1.5">
          <IconUsers size={14} /> นำเข้านักเรียน
        </span>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-4">
          <h2 className="text-white text-sm font-medium mb-2">อัปโหลดไฟล์ CSV</h2>
          <p className="text-slate-300 text-xs mb-3 leading-relaxed">
            หัวตาราง (แถวแรก) ต้องมีคอลัมน์: <code className="text-blue-300">firstName, lastName, nickname, grade, room, number, studentId, password</code>
            <br />ถ้าเว้น <code className="text-blue-300">password</code> ว่างไว้ ระบบจะตั้งรหัสผ่านเริ่มต้น = เลขประจำตัวนักเรียน
          </p>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="text-slate-300 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:text-sm hover:file:bg-blue-500 file:cursor-pointer"
            />
            <a
              href={"data:text/csv;charset=utf-8," + encodeURIComponent("firstName,lastName,nickname,grade,room,number,studentId,password\nสมชาย,ใจดี,ชาย,1,2,5,10001,\n")}
              download="template.csv"
              className="text-blue-400 hover:text-blue-300 text-xs underline"
            >
              ดาวน์โหลดไฟล์ตัวอย่าง
            </a>
          </div>
          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
        </div>

        {rows.length > 0 && !result && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <span className="text-slate-300 text-sm">ตัวอย่างข้อมูล {rows.length} แถว</span>
              <button
                onClick={submitImport}
                disabled={loading}
                className="bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                {loading ? "กำลังนำเข้า..." : `นำเข้า ${rows.length} คน`}
              </button>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs">
                <thead className="bg-slate-700/50 sticky top-0">
                  <tr className="text-slate-300">
                    <th className="text-left px-3 py-2">ชื่อ</th>
                    <th className="text-left px-3 py-2">นามสกุล</th>
                    <th className="text-left px-3 py-2">ชื่อเล่น</th>
                    <th className="text-left px-3 py-2">ชั้น</th>
                    <th className="text-left px-3 py-2">ห้อง</th>
                    <th className="text-left px-3 py-2">เลขที่</th>
                    <th className="text-left px-3 py-2">เลขประจำตัว</th>
                    <th className="text-left px-3 py-2">รหัสผ่าน</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 200).map((r, i) => (
                    <tr key={i} className="border-t border-slate-700/50 text-slate-300">
                      <td className="px-3 py-1.5">{r.firstName}</td>
                      <td className="px-3 py-1.5">{r.lastName}</td>
                      <td className="px-3 py-1.5">{r.nickname}</td>
                      <td className="px-3 py-1.5">{r.grade}</td>
                      <td className="px-3 py-1.5">{r.room}</td>
                      <td className="px-3 py-1.5">{r.number}</td>
                      <td className="px-3 py-1.5">{r.studentId}</td>
                      <td className="px-3 py-1.5 text-slate-300">{r.password || "(= เลขประจำตัว)"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-2 text-green-400 mb-3">
              <IconCheck size={18} />
              <span className="text-sm font-medium">นำเข้าสำเร็จ {result.created} / {result.totalRows} คน</span>
            </div>
            {result.errors.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-red-400 text-sm mb-2">
                  <IconX size={15} /> ข้ามไป {result.errors.length} แถว
                </div>
                <div className="max-h-64 overflow-y-auto text-xs space-y-1">
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-slate-300">
                      {e.row > 0 && <span className="text-slate-300">แถว {e.row} · </span>}
                      <span className="text-slate-300">{e.studentId || "-"}</span> — {e.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Link href="/teacher" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                กลับหน้าหลัก
              </Link>
              <button onClick={() => { setRows([]); setResult(null); }} className="text-slate-300 hover:text-slate-200 text-sm px-3 py-2">
                นำเข้าไฟล์ใหม่
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
