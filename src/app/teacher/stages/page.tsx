"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconTreasureMap, IconBook, IconEdit } from "@/components/Icon";

interface Stage {
  id: string;
  name: string;
  enemyName: string;
  order: number;
  categoryId: string;
  _count: { questions: number };
}

interface Category {
  id: string;
  name: string;
  mode: string;
  stages: Stage[];
}

const ENEMY_OPTIONS = [
  "มังกรคณิต", "โกบลินเลข", "ซอมบี้ตัวเลข", "ราชาโครงกระดูก", "จิ้งจกเวทย์",
  "อสูรสมการ", "ปีศาจเศษส่วน", "มังกรน้ำแข็ง", "หมาป่าพลัง", "เจ้าป่าเวทย์",
];

const EMPTY_STAGE = { categoryId: "", name: "", enemyName: "มังกรคณิต", order: 99 };

export default function StagesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  function load() {
    fetch("/api/teacher/stages").then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]));
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing.categoryId) { setError("กรุณาเลือกหมวดหมู่"); return; }
    if (!editing.name.trim()) { setError("กรุณาระบุชื่อด่าน"); return; }
    setError("");
    setSaving(true);
    const method = editing.id ? "PUT" : "POST";
    const url = editing.id ? `/api/teacher/stages/${editing.id}` : "/api/teacher/stages";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    setSaving(false);
    setEditing(null);
    load();
  }

  async function del(stage: Stage) {
    if (stage._count.questions > 0) {
      if (!confirm(`ด่าน "${stage.name}" มีโจทย์อยู่ ${stage._count.questions} ข้อ\nหากลบจะลบโจทย์ทั้งหมดด้วย ยืนยัน?`)) return;
    } else {
      if (!confirm(`ลบด่าน "${stage.name}"?`)) return;
    }
    setDeleting(stage.id);
    await fetch(`/api/teacher/stages/${stage.id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  }

  const totalStages = categories.reduce((s, c) => s + c.stages.length, 0);

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/teacher" className="flex items-center gap-1 text-slate-300 hover:text-white text-sm"><IconArrowLeft size={16} /> Dashboard</Link>
          <span className="font-pixel text-yellow-400 text-xs flex items-center gap-1.5"><IconTreasureMap size={14} /> จัดการด่าน</span>
        </div>
        <button
          onClick={() => { setEditing({ ...EMPTY_STAGE }); setError(""); }}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded transition-colors"
        >
          + สร้างด่านใหม่
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="text-yellow-400 mb-2"><IconTreasureMap size={26} /></div>
            <div className="font-pixel text-yellow-400 text-lg">{totalStages}</div>
            <div className="text-slate-300 text-xs mt-1">ด่านทั้งหมด</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="text-yellow-400 mb-2"><IconBook size={26} /></div>
            <div className="font-pixel text-yellow-400 text-lg">{categories.length}</div>
            <div className="text-slate-300 text-xs mt-1">หมวดหมู่</div>
          </div>
        </div>

        {/* Stages by category */}
        <div className="space-y-6">
          {categories.map(cat => (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-slate-300 font-medium text-sm">{cat.name}</span>
                <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded">{cat.mode}</span>
                <button
                  onClick={() => { setEditing({ ...EMPTY_STAGE, categoryId: cat.id }); setError(""); }}
                  className="ml-auto text-blue-400 hover:text-blue-300 text-xs"
                >
                  + เพิ่มด่านในหมวดนี้
                </button>
              </div>

              <div className="space-y-2">
                {cat.stages.length === 0 && (
                  <p className="text-slate-300 text-sm text-center py-4 border border-dashed border-slate-700 rounded-xl">
                    ยังไม่มีด่าน
                  </p>
                )}
                {cat.stages.map((stage, i) => (
                  <div key={stage.id} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3">
                    <span className="text-slate-300 text-xs w-6 text-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{stage.name}</div>
                      <div className="text-slate-300 text-xs mt-0.5">
                        ศัตรู: {stage.enemyName} · {stage._count.questions} โจทย์
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/teacher/questions?stage=${stage.id}`}
                        className="inline-flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded transition-colors"
                      >
                        <IconEdit size={13} /> โจทย์
                      </Link>
                      <button
                        onClick={() => { setEditing({ ...stage }); setError(""); }}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => del(stage)}
                        disabled={deleting === stage.id}
                        className="text-red-400 hover:text-red-300 text-xs disabled:opacity-40"
                      >
                        {deleting === stage.id ? "..." : "ลบ"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 w-full max-w-md">
            <h3 className="font-pixel text-yellow-400 text-xs mb-5">
              {editing.id ? "แก้ไขด่าน" : "สร้างด่านใหม่"}
            </h3>
            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="text-slate-300 text-xs block mb-1">หมวดหมู่ *</label>
                <select
                  value={editing.categoryId}
                  onChange={e => setEditing({ ...editing, categoryId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                >
                  <option value="">เลือกหมวดหมู่...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.mode})</option>
                  ))}
                </select>
              </div>

              {/* Stage name */}
              <div>
                <label className="text-slate-300 text-xs block mb-1">ชื่อด่าน *</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  placeholder="เช่น การบวกลบจำนวนเต็ม"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Enemy name */}
              <div>
                <label className="text-slate-300 text-xs block mb-1">ชื่อศัตรู</label>
                <div className="flex gap-2">
                  <select
                    value={ENEMY_OPTIONS.includes(editing.enemyName) ? editing.enemyName : "__custom"}
                    onChange={e => {
                      if (e.target.value !== "__custom") setEditing({ ...editing, enemyName: e.target.value });
                    }}
                    className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                  >
                    {ENEMY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    {!ENEMY_OPTIONS.includes(editing.enemyName) && (
                      <option value="__custom">{editing.enemyName}</option>
                    )}
                  </select>
                  <input
                    type="text"
                    value={editing.enemyName}
                    onChange={e => setEditing({ ...editing, enemyName: e.target.value })}
                    placeholder="หรือพิมพ์ชื่อเอง"
                    className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Order */}
              <div>
                <label className="text-slate-300 text-xs block mb-1">ลำดับ (น้อย = แสดงก่อน)</label>
                <input
                  type="number"
                  value={editing.order}
                  onChange={e => setEditing({ ...editing, order: Number(e.target.value) })}
                  min={0}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded px-3 py-2">{error}</p>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 rounded transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm py-2 rounded transition-colors"
              >
                {saving ? "กำลังบันทึก..." : editing.id ? "บันทึกการแก้ไข" : "สร้างด่าน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
