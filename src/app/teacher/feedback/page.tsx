"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconMessage, IconBug, IconStar, IconCheck, IconClock, IconEdit } from "@/components/Icon";

interface FeedbackItem {
  id: string;
  category: "BUG" | "SUGGESTION" | "QUESTION" | "OTHER";
  message: string;
  rating: number | null;
  status: "NEW" | "SEEN" | "RESOLVED";
  createdAt: string;
  user: { name: string; nickname: string; studentId: string; grade: number; room: number };
  stage: { name: string; category: { name: string } } | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  BUG: "แจ้งปัญหา/บั๊ก",
  SUGGESTION: "ข้อเสนอแนะ",
  QUESTION: "คำถาม",
  OTHER: "อื่นๆ",
};

const STATUS_LABEL: Record<string, string> = {
  NEW: "รอตรวจสอบ",
  SEEN: "เห็นแล้ว",
  RESOLVED: "แก้ไขแล้ว",
};

export default function TeacherFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    fetch("/api/teacher/feedback?" + params)
      .then(r => r.json())
      .then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, [statusFilter, categoryFilter]);

  async function updateStatus(id: string, status: string) {
    setItems(items.map(f => f.id === id ? { ...f, status: status as any } : f));
    await fetch(`/api/teacher/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  const newCount = items.filter(f => f.status === "NEW").length;

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
          <Link href="/teacher" className="flex items-center gap-1 text-slate-300 hover:text-white text-xs sm:text-sm whitespace-nowrap">
            <IconArrowLeft size={16} className="shrink-0" /> Dashboard
          </Link>
          <span className="font-pixel text-yellow-400 text-[9px] sm:text-xs flex items-center gap-1.5 min-w-0 break-words leading-relaxed">
            <IconMessage size={14} className="shrink-0" /> Feedback จากนักเรียน
            {newCount > 0 && <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{newCount} ใหม่</span>}
          </span>
        </div>
        <div className="flex gap-2">
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none">
            <option value="">ทุกประเภท</option>
            <option value="BUG">แจ้งปัญหา/บั๊ก</option>
            <option value="SUGGESTION">ข้อเสนอแนะ</option>
            <option value="QUESTION">คำถาม</option>
            <option value="OTHER">อื่นๆ</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none">
            <option value="">ทุกสถานะ</option>
            <option value="NEW">รอตรวจสอบ</option>
            <option value="SEEN">เห็นแล้ว</option>
            <option value="RESOLVED">แก้ไขแล้ว</option>
          </select>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {loading && <p className="text-center text-slate-300 py-8">กำลังโหลด...</p>}
        {!loading && items.length === 0 && <p className="text-center text-slate-300 py-8">ไม่มี feedback</p>}
        {items.map(f => (
          <div key={f.id} className={`bg-slate-800 border rounded-xl p-4 ${f.status === "NEW" ? "border-yellow-600/50" : "border-slate-700"}`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-white font-medium">{f.user.name}</span>
                  <span className="text-slate-300 text-xs">({f.user.nickname} · ม.{f.user.grade}/{f.user.room} · {f.user.studentId})</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1 bg-slate-700 px-2 py-0.5 rounded">
                    {f.category === "BUG" && <IconBug size={11} />} {CATEGORY_LABEL[f.category]}
                  </span>
                  {f.stage && <span>· {f.stage.category.name} › {f.stage.name}</span>}
                  {f.rating && (
                    <span className="inline-flex items-center gap-0.5">
                      <IconStar size={11} className="text-yellow-400" /> {f.rating}/5
                    </span>
                  )}
                  <span>· {new Date(f.createdAt).toLocaleString("th-TH")}</span>
                </div>
              </div>
            </div>

            <p className="text-slate-200 text-sm mb-3 whitespace-pre-wrap">{f.message}</p>

            <div className="flex gap-2">
              {(["NEW", "SEEN", "RESOLVED"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(f.id, s)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors ${
                    f.status === s
                      ? s === "RESOLVED" ? "bg-green-700 text-white" : s === "SEEN" ? "bg-blue-700 text-white" : "bg-yellow-700 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {s === "RESOLVED" ? <IconCheck size={12} /> : s === "SEEN" ? <IconEdit size={12} /> : <IconClock size={12} />}
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
