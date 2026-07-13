"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IconArrowLeft, IconLightbulb } from "@/components/Icon";

interface Question {
  id: string;
  stageId: string;
  body: string;
  order: number;
  data: { choices: string[]; answer: string; hint?: string };
}

const EMPTY_Q = { stageId: "", body: "", data: { choices: ["", "", "", ""], answer: "", hint: "" }, order: 0 };

function QuestionsPageInner() {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedStage, setSelectedStage] = useState(searchParams.get("stage") ?? "");
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/game/stages").then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!selectedStage) return;
    fetch("/api/teacher/questions?stageId=" + selectedStage)
      .then(r => r.json())
      .then(d => setQuestions(Array.isArray(d) ? d : []))
      .catch(() => setQuestions([]));
  }, [selectedStage]);

  async function save() {
    setSaving(true);
    const method = editing.id ? "PUT" : "POST";
    const url = editing.id ? `/api/teacher/questions/${editing.id}` : "/api/teacher/questions";
    const body = { ...editing, stageId: selectedStage };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const saved = await res.json();
    if (editing.id) {
      setQuestions(qs => qs.map(q => q.id === saved.id ? saved : q));
    } else {
      setQuestions(qs => [...qs, saved]);
    }
    setEditing(null);
    setSaving(false);
  }

  async function del(id: string) {
    if (!confirm("ลบโจทย์นี้?")) return;
    await fetch("/api/teacher/questions/" + id, { method: "DELETE" });
    setQuestions(qs => qs.filter(q => q.id !== id));
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center gap-3">
        <Link href="/teacher" className="flex items-center gap-1 text-slate-400 hover:text-white text-sm"><IconArrowLeft size={16} /> Dashboard</Link>
        <Link href="/teacher/stages" className="text-slate-400 hover:text-white text-sm">ด่าน</Link>
        <span className="font-pixel text-yellow-400 text-xs">จัดการโจทย์</span>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stage selector */}
        <div className="mb-4 flex gap-2 items-center">
          <select
            value={selectedStage}
            onChange={e => setSelectedStage(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm flex-1 focus:outline-none"
          >
            <option value="">เลือกด่าน...</option>
            {categories.map(c => (
              <optgroup key={c.id} label={c.name}>
                {c.stages.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {selectedStage && (
            <button
              onClick={() => setEditing({ ...EMPTY_Q, stageId: selectedStage })}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded transition-colors"
            >
              + เพิ่มโจทย์
            </button>
          )}
        </div>

        {/* Question list */}
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-slate-500 text-xs">ข้อ {i + 1} — </span>
                  <span className="text-white text-sm font-medium">{q.body}</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {q.data.choices.map(c => (
                      <span key={c} className={`text-xs px-2 py-1 rounded border ${c === q.data.answer ? "border-green-500 text-green-400 bg-green-900/30" : "border-slate-600 text-slate-400"}`}>
                        {c}
                      </span>
                    ))}
                  </div>
                  {q.data.hint && <p className="text-slate-500 text-xs mt-1 flex items-center gap-1"><IconLightbulb size={12} /> {q.data.hint}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditing({ ...q })} className="text-blue-400 hover:text-blue-300 text-xs">แก้ไข</button>
                  <button onClick={() => del(q.id)} className="text-red-400 hover:text-red-300 text-xs">ลบ</button>
                </div>
              </div>
            </div>
          ))}
          {selectedStage && questions.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">ยังไม่มีโจทย์ในด่านนี้</p>
          )}
        </div>
      </main>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 w-full max-w-lg">
            <h3 className="font-pixel text-yellow-400 text-xs mb-4">{editing.id ? "แก้ไขโจทย์" : "เพิ่มโจทย์ใหม่"}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs block mb-1">โจทย์</label>
                <input
                  type="text"
                  value={editing.body}
                  onChange={e => setEditing({ ...editing, body: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                  placeholder="เช่น (-3) + (-5) = ?"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">ตัวเลือก (4 ข้อ)</label>
                <div className="grid grid-cols-2 gap-2">
                  {editing.data.choices.map((c: string, i: number) => (
                    <input
                      key={i}
                      type="text"
                      value={c}
                      onChange={e => {
                        const ch = [...editing.data.choices];
                        ch[i] = e.target.value;
                        setEditing({ ...editing, data: { ...editing.data, choices: ch } });
                      }}
                      className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                      placeholder={`ตัวเลือก ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">คำตอบที่ถูก</label>
                <select
                  value={editing.data.answer}
                  onChange={e => setEditing({ ...editing, data: { ...editing.data, answer: e.target.value } })}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none"
                >
                  <option value="">เลือกคำตอบ...</option>
                  {editing.data.choices.filter(Boolean).map((c: string) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">คำใบ้ (ไม่บังคับ)</label>
                <input
                  type="text"
                  value={editing.data.hint ?? ""}
                  onChange={e => setEditing({ ...editing, data: { ...editing.data, hint: e.target.value } })}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                  placeholder="คำอธิบายเพิ่มเติม"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditing(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 rounded transition-colors">ยกเลิก</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm py-2 rounded transition-colors">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">กำลังโหลด...</div>}>
      <QuestionsPageInner />
    </Suspense>
  );
}
