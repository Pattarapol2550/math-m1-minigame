"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { IconArrowLeft, IconChart, IconCheck, IconX, IconHeart, IconHeartOff, IconLightbulb, IconDownload } from "@/components/Icon";

function Hearts({ hp, max = 5 }: { hp: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) =>
        i < hp
          ? <IconHeart key={i} size={13} className="text-red-400" />
          : <IconHeartOff key={i} size={13} className="text-slate-300" />
      )}
    </span>
  );
}

interface Student { id: string; name: string; classroom: string | null }
interface Stage { id: string; name: string; order: number }
interface Category { id: string; name: string; mode: string; stages: Stage[] }
interface ScoreEntry { score: number; correct: number; total: number; passed: boolean; plays: number }

interface DrillQuestion { id: string; body: string; data: { choices: string[]; answer: string; hint?: string }; order: number }
interface DrillSession { userId: string; name: string; classroom: string | null; score: number; correct: number; total: number; passed: boolean; hpLeft: number; playedAt: string }
interface DrillData {
  stage: { id: string; name: string; category: { name: string } };
  questions: DrillQuestion[];
  sessions: DrillSession[];
  attemptsMap: Record<string, Record<string, { isCorrect: boolean; answer: string; timeSpent: number }>>;
}

// Cache drill data so we don't refetch the same stage twice
const drillCache: Record<string, DrillData> = {};

function ResultsPageInner() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<string, Record<string, ScoreEntry>>>({});
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("");
  const [filterCat, setFilterCat] = useState(""); // "" = all topics

  // Stage drill-down (full grid view)
  const [drill, setDrill] = useState<DrillData | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);

  // Student × stage popup
  const [studentDetail, setStudentDetail] = useState<{ sess: DrillSession; drill: DrillData } | null>(null);
  const [cellLoading, setCellLoading] = useState<string | null>(null); // "studentId-stageId"

  useEffect(() => {
    fetch("/api/teacher/results")
      .then(r => r.json())
      .then(d => {
        setCategories(Array.isArray(d.categories) ? d.categories : []);
        setStudents(Array.isArray(d.students) ? d.students : []);
        setScores(d.scores ?? {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function fetchDrill(stageId: string): Promise<DrillData> {
    if (drillCache[stageId]) return drillCache[stageId];
    const d: DrillData = await fetch(`/api/teacher/results/${stageId}`).then(r => r.json());
    drillCache[stageId] = d;
    return d;
  }

  async function openStageDrill(stageId: string) {
    setDrillLoading(true);
    setDrill(null);
    const d = await fetchDrill(stageId);
    setDrill(d);
    setDrillLoading(false);
  }

  async function openStudentCell(studentId: string, student: Student, stageId: string) {
    const key = `${studentId}-${stageId}`;
    setCellLoading(key);
    const d = await fetchDrill(stageId);
    const sess = d.sessions.find(s => s.userId === studentId);
    if (sess) {
      setStudentDetail({ sess, drill: d });
    }
    setCellLoading(null);
  }

  const classrooms = [...new Set(students.map(s => s.classroom).filter(Boolean))].sort() as string[];
  const filteredStudents = filterClass ? students.filter(s => s.classroom === filterClass) : students;
  const visibleCategories = filterCat ? categories.filter(c => c.id === filterCat) : categories;

  const exportUrl = (() => {
    const params = new URLSearchParams();
    const m = filterClass.match(/^ม\.(\d+)\/(\d+)$/);
    if (m) { params.set("grade", m[1]); params.set("room", m[2]); }
    if (filterCat) params.set("categoryId", filterCat);
    const qs = params.toString();
    return "/api/teacher/export" + (qs ? "?" + qs : "");
  })();

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300 text-sm">กำลังโหลด...</div>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/teacher" className="flex items-center gap-1 text-slate-300 hover:text-white text-sm">
            <IconArrowLeft size={16} /> Dashboard
          </Link>
          <span className="font-pixel text-yellow-400 text-xs flex items-center gap-1.5">
            <IconChart size={14} /> คะแนนนักเรียน
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none"
          >
            <option value="">ทุกหัวข้อ</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none"
          >
            <option value="">ทุกห้อง</option>
            {classrooms.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-slate-300 text-xs">{filteredStudents.length} คน</span>
          <a
            href={exportUrl}
            className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            <IconDownload size={14} /> Export Excel
          </a>
        </div>
      </header>

      <main className="px-4 py-6 max-w-full overflow-x-auto">
        <p className="text-slate-300 text-xs mb-4 flex items-center gap-1.5"><IconLightbulb size={14} /> คลิกที่ <span className="text-blue-400">ชื่อด่าน</span> เพื่อดูภาพรวมทั้งห้อง · คลิกที่ <span className="text-yellow-400">ช่องคะแนน</span> เพื่อดูรายข้อของนักเรียนคนนั้น</p>

        {visibleCategories.length === 0 && (
          <p className="text-slate-300 text-sm text-center py-10">ไม่มีหัวข้อให้แสดง</p>
        )}
        {visibleCategories.map(cat => (
          <div key={cat.id} className="mb-8">
            <h2 className="text-slate-300 font-medium text-sm mb-3 flex items-center gap-2">
              {cat.name}
              <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded">{cat.mode}</span>
            </h2>

            <div className="overflow-x-auto rounded-xl border border-slate-700">
              <table className="text-xs border-collapse min-w-full">
                <thead>
                  <tr className="bg-slate-800">
                    <th className="text-left px-3 py-2.5 text-slate-300 font-normal sticky left-0 bg-slate-800 z-10 min-w-[130px]">นักเรียน</th>
                    <th className="text-left px-2 py-2.5 text-slate-300 font-normal min-w-[50px]">ห้อง</th>
                    {cat.stages.map(s => (
                      <th key={s.id} className="px-2 py-2.5 text-center min-w-[100px]">
                        <button
                          onClick={() => openStageDrill(s.id)}
                          className="text-blue-400 hover:text-blue-300 hover:underline font-normal leading-tight"
                        >
                          {s.name}
                        </button>
                      </th>
                    ))}
                    <th className="px-2 py-2.5 text-center text-slate-300 font-normal min-w-[70px]">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 && (
                    <tr><td colSpan={cat.stages.length + 3} className="text-center text-slate-300 py-6">ไม่มีข้อมูล</td></tr>
                  )}
                  {filteredStudents.map((stu, i) => {
                    const stuScores = scores[stu.id] ?? {};
                    const totalScore = cat.stages.reduce((s, st) => s + (stuScores[st.id]?.score ?? 0), 0);
                    const passedCount = cat.stages.filter(st => stuScores[st.id]?.passed).length;
                    return (
                      <tr key={stu.id} className={`border-t border-slate-700/50 ${i % 2 === 0 ? "bg-slate-900" : "bg-slate-900/60"} hover:bg-slate-800/80 transition-colors`}>
                        <td className="px-3 py-2 text-white font-medium sticky left-0 bg-inherit z-10">{stu.name}</td>
                        <td className="px-2 py-2 text-slate-300">{stu.classroom ?? "-"}</td>
                        {cat.stages.map(st => {
                          const e = stuScores[st.id];
                          const key = `${stu.id}-${st.id}`;
                          const isLoading = cellLoading === key;

                          if (!e) return (
                            <td key={st.id} className="px-2 py-2 text-center text-slate-700">—</td>
                          );

                          const acc = e.total > 0 ? Math.round(e.correct / e.total * 100) : 0;
                          return (
                            <td key={st.id} className="px-1 py-1 text-center">
                              <button
                                onClick={() => openStudentCell(stu.id, stu, st.id)}
                                disabled={isLoading}
                                className="w-full rounded-lg px-2 py-1.5 hover:bg-slate-700/60 transition-colors group disabled:opacity-50"
                                title="คลิกดูรายข้อ"
                              >
                                {isLoading ? (
                                  <div className="text-slate-300 text-xs">...</div>
                                ) : (
                                  <>
                                    <div className={`font-pixel text-xs group-hover:text-yellow-300 ${e.passed ? "text-yellow-400" : "text-slate-300"}`}>{e.score}</div>
                                    <div className="text-slate-300 text-[10px] mt-0.5">{acc}% · {e.plays}ครั้ง</div>
                                    {e.passed
                                      ? <div className="text-green-500 text-[10px] flex items-center justify-center gap-0.5"><IconCheck size={10} />ผ่าน</div>
                                      : <div className="text-red-500/70 text-[10px] flex items-center justify-center gap-0.5"><IconX size={10} />ไม่ผ่าน</div>
                                    }
                                  </>
                                )}
                              </button>
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-center">
                          <div className="font-pixel text-xs text-yellow-300">{totalScore}</div>
                          <div className="text-slate-300 text-[10px] mt-0.5">{passedCount}/{cat.stages.length} ด่าน</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </main>

      {/* Stage drill-down modal (full class grid) */}
      {(drill || drillLoading) && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <div>
                {drill && (
                  <>
                    <div className="font-pixel text-yellow-400 text-xs">{drill.stage.category.name} › {drill.stage.name}</div>
                    <div className="text-slate-300 text-xs mt-1">{drill.sessions.length} คนเล่น · {drill.questions.length} โจทย์ · คลิกชื่อนักเรียนเพื่อดูรายข้อ</div>
                  </>
                )}
                {drillLoading && <div className="text-slate-300 text-sm">กำลังโหลด...</div>}
              </div>
              <button onClick={() => setDrill(null)} className="text-slate-300 hover:text-white leading-none"><IconX size={20} /></button>
            </div>

            {drill && (
              <div className="p-4 overflow-x-auto">
                {drill.sessions.length === 0 && (
                  <p className="text-slate-300 text-sm text-center py-8">ยังไม่มีนักเรียนเล่นด่านนี้</p>
                )}
                {drill.sessions.length > 0 && (
                  <table className="text-xs border-collapse w-full">
                    <thead>
                      <tr className="bg-slate-800">
                        <th className="text-left px-3 py-2.5 text-slate-300 font-normal sticky left-0 bg-slate-800 min-w-[110px]">นักเรียน</th>
                        <th className="text-left px-2 py-2.5 text-slate-300 font-normal">ห้อง</th>
                        <th className="px-2 py-2.5 text-center text-slate-300 font-normal">คะแนน</th>
                        <th className="px-2 py-2.5 text-center text-slate-300 font-normal">HP</th>
                        {drill.questions.map((q, i) => (
                          <th key={q.id} className="px-1 py-2.5 text-center min-w-[36px]">
                            <span className="text-slate-300 font-normal">ข้อ{i + 1}</span>
                          </th>
                        ))}
                      </tr>
                      <tr className="border-t border-slate-700/50">
                        <td className="px-3 py-2 text-slate-300 italic sticky left-0 bg-slate-900" colSpan={4}>โจทย์</td>
                        {drill.questions.map(q => (
                          <td key={q.id} className="px-1 py-2 text-center">
                            <span className="text-slate-300 text-[10px] leading-tight block max-w-[80px] mx-auto truncate" title={q.body}>{q.body}</span>
                            <span className="text-green-600 text-[10px]">{(q.data as any).answer}</span>
                          </td>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {drill.sessions.map((sess, i) => {
                        const att = drill.attemptsMap[sess.userId] ?? {};
                        return (
                          <tr key={sess.userId} className={`border-t border-slate-700/30 ${i % 2 === 0 ? "bg-slate-900" : "bg-slate-850"} hover:bg-slate-800`}>
                            <td className="px-3 py-2 sticky left-0 bg-inherit">
                              <button
                                onClick={() => setStudentDetail({ sess, drill: drill! })}
                                className="text-blue-400 hover:text-blue-300 hover:underline font-medium text-left"
                              >
                                {sess.name}
                              </button>
                            </td>
                            <td className="px-2 py-2 text-slate-300">{sess.classroom ?? "-"}</td>
                            <td className="px-2 py-2 text-center">
                              <div className={`font-pixel text-xs ${sess.passed ? "text-yellow-400" : "text-slate-300"}`}>{sess.score}</div>
                              <div className="text-slate-300 text-[10px]">{sess.total > 0 ? Math.round(sess.correct / sess.total * 100) : 0}%</div>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <div className="flex justify-center"><Hearts hp={sess.hpLeft} /></div>
                            </td>
                            {drill.questions.map(q => {
                              const a = att[q.id];
                              if (!a) return <td key={q.id} className="px-1 py-2 text-center text-slate-700">·</td>;
                              return (
                                <td key={q.id} className="px-1 py-2 text-center" title={`ตอบ: ${a.answer} (${a.timeSpent}วิ)`}>
                                  {a.isCorrect
                                    ? <IconCheck size={15} className="inline text-green-400" />
                                    : <IconX size={15} className="inline text-red-400" />
                                  }
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      <tr className="border-t-2 border-slate-600 bg-slate-800">
                        <td className="px-3 py-2 text-slate-300 text-xs sticky left-0 bg-slate-800" colSpan={4}>อัตราถูกต้อง</td>
                        {drill.questions.map(q => {
                          const total = drill.sessions.filter(s => drill.attemptsMap[s.userId]?.[q.id]).length;
                          const correct = drill.sessions.filter(s => drill.attemptsMap[s.userId]?.[q.id]?.isCorrect).length;
                          const pct = total > 0 ? Math.round(correct / total * 100) : null;
                          const color = pct === null ? "text-slate-300" : pct >= 70 ? "text-green-400" : pct >= 40 ? "text-yellow-400" : "text-red-400";
                          return (
                            <td key={q.id} className={`px-1 py-2 text-center font-medium ${color}`}>
                              {pct !== null ? `${pct}%` : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student detail modal */}
      {studentDetail && (
        <div className="fixed inset-0 bg-black/85 z-[60] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-600 rounded-2xl w-full max-w-xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <div>
                <div className="text-white font-medium">{studentDetail.sess.name}</div>
                <div className="text-slate-300 text-xs mt-0.5">
                  {studentDetail.drill.stage.category.name} › {studentDetail.drill.stage.name}
                  {studentDetail.sess.classroom && <span className="ml-2">· ห้อง {studentDetail.sess.classroom}</span>}
                </div>
              </div>
              <button onClick={() => setStudentDetail(null)} className="text-slate-300 hover:text-white leading-none"><IconX size={20} /></button>
            </div>

            <div className="grid grid-cols-4 gap-px bg-slate-700 border-b border-slate-700">
              {[
                { label: "คะแนน", value: <span className="font-pixel text-yellow-400">{studentDetail.sess.score}</span> },
                { label: "ถูกต้อง", value: <span className="text-green-400">{studentDetail.sess.correct}/{studentDetail.sess.total}</span> },
                { label: "ความแม่นยำ", value: <span className="text-blue-400">{studentDetail.sess.total > 0 ? Math.round(studentDetail.sess.correct / studentDetail.sess.total * 100) : 0}%</span> },
                { label: "HP เหลือ", value: <span className="flex justify-center"><Hearts hp={studentDetail.sess.hpLeft} /></span> },
              ].map(c => (
                <div key={c.label} className="bg-slate-800 px-3 py-3 text-center">
                  <div className="text-sm">{c.value}</div>
                  <div className="text-slate-300 text-[10px] mt-1">{c.label}</div>
                </div>
              ))}
            </div>

            <div className="p-4 space-y-2">
              {studentDetail.drill.questions.map((q, i) => {
                const att = studentDetail.drill.attemptsMap[studentDetail.sess.userId]?.[q.id];
                return (
                  <div
                    key={q.id}
                    className={`rounded-xl border px-4 py-3 ${
                      !att ? "border-slate-700 bg-slate-800/40" :
                      att.isCorrect ? "border-green-700/50 bg-green-900/15" : "border-red-700/50 bg-red-900/15"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`leading-none mt-0.5 shrink-0 ${
                        !att ? "text-slate-300" : att.isCorrect ? "text-green-400" : "text-red-400"
                      }`}>
                        {!att ? <span className="text-lg">·</span> : att.isCorrect ? <IconCheck size={18} /> : <IconX size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-300 text-sm">
                          <span className="text-slate-300 text-xs mr-1">ข้อ {i + 1}</span>
                          {q.body}
                        </div>
                        {att && (
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {att.isCorrect ? (
                              <span className="inline-flex items-center gap-1 text-xs bg-green-900/40 border border-green-700/50 text-green-300 px-2 py-0.5 rounded">
                                <IconCheck size={12} /> ตอบ: {att.answer}
                              </span>
                            ) : (
                              <>
                                <span className="inline-flex items-center gap-1 text-xs bg-red-900/40 border border-red-700/50 text-red-300 px-2 py-0.5 rounded">
                                  <IconX size={12} /> ตอบ: {att.answer || "(หมดเวลา)"}
                                </span>
                                <span className="text-xs bg-green-900/30 border border-green-700/40 text-green-400 px-2 py-0.5 rounded">
                                  เฉลย: {(q.data as any).answer}
                                </span>
                              </>
                            )}
                            <span className="text-xs text-slate-300">{att.timeSpent}วิ</span>
                          </div>
                        )}
                        {!att && <div className="text-slate-300 text-xs mt-1">ไม่มีข้อมูล</div>}
                        {q.data.hint && att && !att.isCorrect && (
                          <div className="text-slate-300 text-xs mt-1 flex items-center gap-1"><IconLightbulb size={12} /> {q.data.hint}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-4 pb-4">
              <button
                onClick={() => setStudentDetail(null)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm py-2.5 rounded-xl transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">กำลังโหลด...</div>}>
      <ResultsPageInner />
    </Suspense>
  );
}
