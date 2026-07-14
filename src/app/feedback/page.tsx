"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconMessage, IconSend, IconBug, IconStar, IconCheck, IconClock } from "@/components/Icon";

interface Stage { id: string; name: string }
interface Category { id: string; name: string; stages: Stage[] }
interface FeedbackItem {
  id: string;
  category: string;
  message: string;
  rating: number | null;
  status: "NEW" | "SEEN" | "RESOLVED";
  createdAt: string;
  stage: { name: string } | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  BUG: "แจ้งปัญหา/บั๊ก",
  SUGGESTION: "ข้อเสนอแนะ",
  QUESTION: "คำถามเกี่ยวกับเนื้อหา",
  OTHER: "อื่นๆ",
};

const STATUS_LABEL: Record<string, string> = {
  NEW: "รอตรวจสอบ",
  SEEN: "ครูเห็นแล้ว",
  RESOLVED: "แก้ไขแล้ว",
};

export default function FeedbackPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("SUGGESTION");
  const [stageId, setStageId] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<FeedbackItem[]>([]);

  function loadHistory() {
    fetch("/api/student/feedback")
      .then(r => r.json())
      .then(d => setHistory(Array.isArray(d) ? d : []))
      .catch(() => {});
  }

  useEffect(() => {
    fetch("/api/game/stages").then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : [])).catch(() => {});
    loadHistory();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone(false);

    if (!message.trim()) {
      setError("กรุณากรอกข้อความ");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/student/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, stageId: stageId || null, message, rating }),
    });
    setLoading(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "ส่งไม่สำเร็จ");
      return;
    }

    setDone(true);
    setMessage("");
    setRating(null);
    setStageId("");
    loadHistory();
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)" }}>
      <header className="bg-slate-900/80 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <Link href="/map" className="flex items-center gap-1 text-slate-300 hover:text-white text-sm">
          <IconArrowLeft size={16} /> แผนที่
        </Link>
        <span className="font-pixel text-yellow-400 text-xs flex items-center gap-1.5">
          <IconMessage size={14} /> แจ้งปัญหา / ข้อเสนอแนะ
        </span>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6">
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-slate-300 text-xs mb-1.5">ประเภท</label>
              <div className="grid grid-cols-2 gap-2">
                {(["BUG", "SUGGESTION", "QUESTION", "OTHER"] as const).map(c => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs border transition-colors ${
                      category === c ? "bg-blue-500/20 border-blue-400 text-blue-300" : "bg-slate-900 border-slate-600 text-slate-300"
                    }`}
                  >
                    {c === "BUG" && <IconBug size={13} />}
                    {CATEGORY_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs mb-1.5">เกี่ยวกับด่านไหน (ไม่บังคับ)</label>
              <select
                value={stageId}
                onChange={e => setStageId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="">ไม่ระบุ / ทั่วไป</option>
                {categories.map(cat => (
                  <optgroup key={cat.id} label={cat.name}>
                    {cat.stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-xs mb-1.5">รายละเอียด</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="อธิบายปัญหาหรือข้อเสนอแนะของคุณ..."
                required
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-xs mb-1.5">ความรู้สึกโดยรวมกับเกม (ไม่บังคับ)</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setRating(rating === n ? null : n)}
                    className="p-1"
                  >
                    <IconStar size={22} className={n <= (rating ?? 0) ? "text-yellow-400" : "text-slate-700"} />
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-xs rounded-lg px-3 py-2">{error}</div>}
            {done && (
              <div className="bg-green-900/30 border border-green-700/50 text-green-300 text-xs rounded-lg px-3 py-2 flex items-center gap-1.5">
                <IconCheck size={14} /> ส่งถึงครูแล้ว ขอบคุณครับ/ค่ะ
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm py-2.5 rounded-xl transition-colors"
            >
              <IconSend size={15} /> {loading ? "กำลังส่ง..." : "ส่งถึงครู"}
            </button>
          </form>
        </div>

        {history.length > 0 && (
          <>
            <h2 className="font-pixel text-slate-300 text-xs mb-3">ที่เคยส่งไป</h2>
            <div className="space-y-2">
              {history.map(f => (
                <div key={f.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-300 text-xs font-medium">{CATEGORY_LABEL[f.category]}</span>
                    <span className={`text-[10px] flex items-center gap-1 ${f.status === "RESOLVED" ? "text-green-400" : f.status === "SEEN" ? "text-blue-400" : "text-slate-300"}`}>
                      {f.status === "RESOLVED" ? <IconCheck size={11} /> : <IconClock size={11} />} {STATUS_LABEL[f.status]}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs">{f.message}</p>
                  {f.stage && <p className="text-slate-300 text-[10px] mt-1">ด่าน: {f.stage.name}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
